import React, { useState, useEffect } from 'react';
import { Download, UploadCloud, Trophy, History } from 'lucide-react';
import { Student, UploadLog } from '../types';

interface Props {
  student: Student;
  onNavigate: (screen: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function DashboardScreen({ student, onNavigate, showToast }: Props) {
  const [history, setHistory] = useState<UploadLog[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [stats, setStats] = useState({ registeredStudents: 0, benefitedStudents: 0 });
  const [totalPoints, setTotalPoints] = useState(student.points);

  const toggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }

    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/students/${student.student_no}/uploads`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data);
        setShowHistory(true);
      } else {
        showToast('Geçmiş yüklemeler alınamadı', 'error');
      }
    } catch {
      showToast('Sunucu hatası', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Fetch initial points on load and poll every 10s
  useEffect(() => {
    const fetchData = () => {
      const ts = Date.now();
      fetch(`/api/students/${student.student_no}?t=${ts}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.points === 'number') {
             setTotalPoints(data.points);
          }
        })
        .catch(() => {});
    };

    fetchData(); // Initial
    const timer = setInterval(fetchData, 5000); // Poll every 5s

    if (student.student_no === 'admin') {
      fetch('/api/students/admin/stats')
        .then(r => r.json())
        .then(d => {
           setStats(d);
         })
        .catch(() => {});
    }

    return () => clearInterval(timer);
  }, [student.id, student.student_no]);

  const handleResetUploads = async () => {
    const c1 = window.confirm('⚠️ Tüm derslik verileri, puanlar ve yüklemeler sıfırlanacak. Bu işlem GERİ ALINAMAZ. Devam etmek istiyor musun?');
    if (!c1) return;
    try {
      showToast('İşlem başlatıldı...', 'success');
      const res = await fetch('/api/admin/reset-uploads', { method: 'POST' });
      if (res.ok) { 
        showToast('Tüm veriler sıfırlandı.', 'success'); 
        setTimeout(() => window.location.reload(), 1500);
      }
      else showToast('Sıfırlama başarısız.', 'error');
    } catch { showToast('Bağlantı hatası.', 'error'); }
  };

  const handleResetUsers = async () => {
    const c1 = window.confirm('🚨 TÜM KULLANICI VERİLERİ SİLİNECEK. Admin korunur. GERİ ALINAMAZ. Devam?');
    if (!c1) return;
    try {
      showToast('İşlem başlatıldı...', 'success');
      const res = await fetch('/api/admin/reset-users', { method: 'POST' });
      if (res.ok) { 
        showToast('Tüm kullanıcı verileri sıfırlandı.', 'success'); 
        setTimeout(() => window.location.reload(), 1500);
      }
      else showToast('Sıfırlama başarısız.', 'error');
    } catch { showToast('Bağlantı hatası.', 'error'); }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-24">
      <div className="bg-gradient-to-br from-[#183CE6] to-[#3D5AFE] rounded-[24px] p-6 text-white shadow-lg overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h2 className="text-xl opacity-90 mb-1">Merhaba,</h2>
        <h3 className="text-3xl font-extrabold mb-6 tracking-tight">{student.full_name.split(' ')[0]}!</h3>
        
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 text-yellow-900 p-2 rounded-xl shadow-inner">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-semibold">Toplam Puan</p>
            <p className="text-2xl font-black">{totalPoints}</p>
          </div>
        </div>
      </div>

      {student.student_no === 'admin' && (
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-2">
             <div className="text-3xl font-bold text-primary">{stats.registeredStudents}</div>
             <div className="text-xs text-on-surface-variant font-medium text-center">Kayıtlı Öğrenci</div>
           </div>
           <div className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-2">
             <div className="text-3xl font-bold text-tertiary">{stats.benefitedStudents}</div>
             <div className="text-xs text-on-surface-variant font-medium text-center">Faydalanan Öğrenci</div>
           </div>
           <button 
             onClick={() => onNavigate('pending_uploads')}
             className="col-span-2 bg-yellow-100 p-4 rounded-[20px] shadow-sm border border-yellow-200 flex justify-center items-center gap-2 active:scale-95 transition-all outline-none"
           >
             <span className="material-symbols-outlined text-yellow-800">pending_actions</span>
             <span className="font-bold text-yellow-800">Bekleyen Yüklemeleri Onayla</span>
           </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('template')}
          className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-3 active:scale-95 transition-all text-gray-800 hover:text-blue-600 group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
            <Download className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Şablon İndir</span>
        </button>

        <button 
          onClick={() => onNavigate('upload')}
          className="bg-white p-5 rounded-[20px] shadow-sm border border-gray-100 flex flex-col justify-center items-center gap-3 active:scale-95 transition-all text-gray-800 hover:text-blue-600 group"
        >
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-100 transition-colors">
            <UploadCloud className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Excel Yükle</span>
        </button>
      </div>

      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
        <button 
          onClick={toggleHistory}
          className="w-full flex items-center justify-between p-5 text-gray-800 hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <div className="flex items-center gap-3 font-bold">
            <div className="text-gray-400">
             <History className="w-5 h-5"/>
            </div>
            Geçmiş İşlemler
          </div>
          <span className={`material-symbols-outlined transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {showHistory && (
          <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2">
            {loadingHistory ? (
              <p className="text-center text-gray-500 text-sm py-4">Yükleniyor...</p>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">Henüz hiç yükleme yapmadınız.</p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {history.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">{new Date(item.uploaded_at).toLocaleDateString('tr-TR')} • {item.row_count} derslik</p>
                      <p className="text-sm font-semibold text-gray-800 truncate max-w-[200px]">{item.filename}</p>
                    </div>
                    {item.status === 'pending' ? (
                      <div className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded-lg text-xs">
                        Beklemede
                      </div>
                    ) : item.status === 'rejected' ? (
                      <div className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded-lg text-xs">
                        Reddedildi
                      </div>
                    ) : (
                      <div className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded-lg text-xs">
                        +{item.points}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {student.student_no === 'admin' && (
        <div className="pt-4 space-y-3">
          <button
            onClick={handleResetUploads}
            className="w-full flex items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
            Tüm Verileri Sıfırla (Derslikler Dahil)
          </button>
          <button
            onClick={handleResetUsers}
            className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold py-3.5 rounded-2xl transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">person_remove</span>
            Tüm Kullanıcıları Sil
          </button>
        </div>
      )}
    </div>
  );
}
