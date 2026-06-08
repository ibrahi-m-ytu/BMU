import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Student } from '../types';

interface Props {
  student: Student;
  onNavigate: (screen: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function PendingUploadsScreen({ student, onNavigate, showToast }: Props) {
  const [pending, setPending] = useState<any[]>([]);
  const [resolving, setResolving] = useState<number | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [allUploads, setAllUploads] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [resetting, setResetting] = useState<'uploads' | 'users' | null>(null);

  const fetchPending = async () => {
    try {
      const res = await fetch(`/api/classrooms/pending?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setPending(data);
      }
    } catch {
      showToast('Bağlantı hatası', 'error');
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleToggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded) {
      try {
        const res = await fetch('/api/classrooms/all-uploads');
        const data = await res.json();
        if (Array.isArray(data)) setAllUploads(data);
      } catch {}
      setHistoryLoaded(true);
    }
  };

  const handleResolve = async (id: number, action: 'accept' | 'reject') => {
    if (resolving) return;
    try {
      setResolving(id);
      const res = await fetch(`/api/classrooms/pending/${id}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        // Immediate UI feedback by filtering local state
        setPending(prev => prev.filter(item => Number(item.id) !== Number(id)));
        showToast(`İşlem Başarılı: Yükleme ${action === 'accept' ? 'onaylandı' : 'reddedildi'}`, 'success');
        // Refresh history if it was loaded
        if (historyLoaded) {
          const hRes = await fetch('/api/classrooms/all-uploads');
          const hData = await hRes.json();
          if (Array.isArray(hData)) setAllUploads(hData);
        }
      } else {
        const errInfo = await res.json().catch(() => ({ message: 'Bağlantı hatası' }));
        showToast(errInfo.message || 'Bağlantı hatası', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Bağlantı hatası', 'error');
    } finally {
      setResolving(null);
    }
  };

  const handleResetUploads = async () => {
    const c1 = window.confirm('⚠️ Tüm derslik ve yükleme verileri silinecek. Bu işlem GERİ ALINAMAZ. Devam etmek istiyor musun?');
    if (!c1) return;
    const c2 = window.confirm('🔴 Son onay: Emin misin?');
    if (!c2) return;
    try {
      setResetting('uploads');
      const res = await fetch('/api/admin/reset-uploads', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { showToast('Tüm yükleme verileri sıfırlandı.', 'success'); setAllUploads([]); setPending([]); }
      else showToast(data.message || 'Sıfırlama başarısız.', 'error');
    } catch { showToast('Bağlantı hatası.', 'error'); }
    finally { setResetting(null); }
  };

  const handleResetUsers = async () => {
    const c1 = window.confirm('🚨 TÜM KULLANICI VERİLERİ SİLİNECEK. Admin korunur. GERİ ALINAMAZ. Devam?');
    if (!c1) return;
    const c2 = window.confirm('🔴 Son onay: Tüm kullanıcıları silmek istediğinden emin misin?');
    if (!c2) return;
    try {
      setResetting('users');
      const res = await fetch('/api/admin/reset-users', { method: 'POST' });
      const data = await res.json();
      if (res.ok) { showToast('Tüm kullanıcı verileri sıfırlandı.', 'success'); setAllUploads([]); setPending([]); }
      else showToast(data.message || 'Sıfırlama başarısız.', 'error');
    } catch { showToast('Bağlantı hatası.', 'error'); }
    finally { setResetting(null); }
  };

  if (student.student_no !== 'admin') {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-40">
      <button 
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#183CE6] mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard'a Dön
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bekleyen Yüklemeler</h2>
      <p className="text-gray-600 mb-8 text-sm">Sisteme yüklenmek istenen sınıf listelerini onaylayın veya reddedin.</p>

      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="bg-gray-50 text-center py-10 rounded-[20px] text-gray-500">
            Bekleyen yükleme bulunmuyor.
          </div>
        ) : (
          pending.map(item => (
            <div key={`pending-${item.id}`} className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3 transition-all duration-200 ${resolving === item.id ? 'opacity-40 scale-[0.98] pointer-events-none' : 'opacity-100 scale-100'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{item.filename}</h3>
                  <p className="text-xs text-gray-500">
                    Öğrenci: {item.student_name} ({item.student_no})
                  </p>
                  <p className="text-xs text-gray-500">
                    Sayı: {item.row_count} derslik • Verilecek: +{item.points} Puan
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(item.uploaded_at).toLocaleString('tr-TR')}
                </div>
              </div>

              <div className="flex gap-2 pt-2 relative z-50">
                <button
                  disabled={resolving !== null}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResolve(item.id, 'reject');
                  }}
                  className="flex-2 bg-red-50 text-red-600 hover:bg-red-100 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> {resolving === item.id ? '...' : 'Reddet'}
                </button>
                <button
                  disabled={resolving !== null}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleResolve(item.id, 'accept');
                  }}
                  className="flex-3 bg-[#183CE6] text-white hover:bg-blue-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> {resolving === item.id ? 'İşleniyor...' : 'Onayla (Yükle)'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 rounded-[20px] border border-gray-200 overflow-hidden">
        <button
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#183CE6]">history</span>
            <span className="font-bold text-sm text-gray-900">Geçmiş Yüklemeler</span>
          </div>
          <span
            className="material-symbols-outlined text-gray-400 transition-transform duration-200"
            style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </button>

        {showHistory && (
          <div className="divide-y divide-gray-100 bg-white">
            {allUploads.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                Geçmiş yükleme bulunmuyor.
              </div>
            ) : (
              allUploads.map((item: any) => {
                const isAccepted = item.status === 'accepted';
                const isRejected = item.status === 'rejected';
                return (
                  <div key={`ul-${item.id}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`material-symbols-outlined text-xl ${
                        isAccepted ? 'text-green-600' : isRejected ? 'text-red-500' : 'text-gray-400'
                      }`}>
                        {isAccepted ? 'check_circle' : isRejected ? 'cancel' : 'pending'}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.filename}</p>
                        <p className="text-xs text-gray-500">
                          {item.student_name} ({item.student_no}) • {item.row_count} derslik • {new Date(item.uploaded_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ml-3 ${
                      isAccepted ? 'bg-green-100 text-green-700' : isRejected ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {isAccepted ? `+${item.points} Puan` : isRejected ? 'Reddedildi' : 'Bekliyor'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
}
