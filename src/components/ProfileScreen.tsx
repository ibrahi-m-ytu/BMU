import React, { useState, useEffect } from 'react';
import { Student, UploadLog } from '../types';

interface Props {
  student: Student;
  onNavigate: (screen: string) => void;
}

export function ProfileScreen({ student, onNavigate }: Props) {
  const [totalPoints, setTotalPoints] = useState(student.points);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${student.student_no}`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.points === 'number') {
           setTotalPoints(data.points);
        }
      })
      .catch();
  }, [student.student_no]);

  const handleToggleHistory = async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded) {
      try {
        const res = await fetch(`/api/students/${student.student_no}/point-log`);
        const data = await res.json();
        if (Array.isArray(data)) setHistory(data);
      } catch {}
      setHistoryLoaded(true);
    }
  };

  const earnedTotal = history.reduce((acc, item) => (item.points > 0 && item.status === 'accepted') ? acc + item.points : acc, 0);
  const spentTotal = Math.abs(history.reduce((acc, item) => (item.points < 0 && item.status === 'accepted') ? acc + item.points : acc, 0));

  const getItemMeta = (item: any): { label: string; icon: string; isPositive: boolean; displayPoints: number } => {
    const points = item.points ?? 0;
    const isPositive = points > 0;

    if (item.status === 'pending') {
      return { label: `İşlem Bekleniyor — ${item.filename}`, icon: 'pending', isPositive: false, displayPoints: 0 };
    }

    if (item.status === 'rejected') {
      return { label: `İşlem Reddedildi — ${item.filename}`, icon: 'cancel', isPositive: false, displayPoints: 0 };
    }

    let label = item.filename || 'İşlem';
    let icon = isPositive ? 'history' : 'redeem';

    if (item.filename === 'odül_kullanımı') {
      label = 'Ödül Kullanımı';
      icon = 'redeem';
    } else if (item.filename === 'bildirim') {
      label = 'Sınıf Bildirimi';
      icon = 'sensors';
    } else if (item.filename === 'dogrulama') {
      label = 'Doğrulama Bonusu';
      icon = 'verified';
    } else if (item.filename === 'bilgi_kullanildi' || item.filename === 'bilgi_kullanildi_gidildi') {
      label = 'Bilgi Paylaşım Bonusu';
      icon = 'groups';
    } else if (item.filename === 'yanlis_bildirim_cezasi') {
      label = 'Hatalı Bildirim Cezası';
      icon = 'report_problem';
    } else if (item.filename?.startsWith('Derslik Yükleme:')) {
      label = item.filename;
      icon = 'upload_file';
    }

    return { label, icon, isPositive, displayPoints: points };
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <section className="relative overflow-hidden rounded-[32px] bg-primary p-8 text-on-primary shadow-xl">
        <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 space-y-2">
          <p className="text-sm opacity-80 font-bold">Hoş geldin,</p>
          <h1 className="text-3xl font-bold text-white mb-6 animate-in slide-in-from-left-4">{student.full_name}</h1>
          <div className="flex items-end gap-2">
            <span className="text-5xl leading-tight font-extrabold animate-in slide-in-from-bottom-4">{totalPoints}</span>
            <span className="text-2xl mb-2 font-bold">Puan</span>
          </div>
          <div className="pt-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-primary bg-tertiary-fixed flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px] text-on-tertiary-fixed-variant" style={{fontVariationSettings: "'FILL' 1"}}>military_tech</span>
            </div>
            <p className="text-xs font-bold">Üstün Çalışkan Kampüs Dostu</p>
          </div>
        </div>
      </section>

      <div className="rounded-[24px] border border-outline-variant overflow-hidden">
        <button
          onClick={handleToggleHistory}
          className="w-full flex items-center justify-between px-5 py-4 bg-surface-container-low hover:bg-surface-container transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history</span>
            <span className="font-bold text-sm text-on-surface">Geçmiş İşlemler</span>
          </div>
          <span
            className="material-symbols-outlined text-outline transition-transform duration-200"
            style={{ transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            expand_more
          </span>
        </button>

        {showHistory && (
          <div className="bg-surface-container-lowest divide-y divide-outline-variant/30">
            {history.length > 0 && (
              <div className="px-5 py-4 bg-surface-container-lowest grid grid-cols-2 gap-4 border-b border-outline-variant/30">
                <div className="bg-tertiary/10 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-1">Toplam Kazanılan</span>
                  <span className="text-lg font-black text-tertiary">+{earnedTotal} Pts</span>
                </div>
                <div className="bg-error/10 rounded-2xl p-3 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-error uppercase tracking-wider mb-1">Toplam Harcanan</span>
                  <span className="text-lg font-black text-error">-{spentTotal} Pts</span>
                </div>
              </div>
            )}

            {history.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-outline">
                Henüz işlem geçmişin yok.
              </div>
            ) : (
              history.map((item: any) => {
                const { label, icon, isPositive, displayPoints } = getItemMeta(item);
                return (
                  <div key={`${item.id}-${item.uploaded_at}`} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isPositive ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface leading-tight">{label}</p>
                        <p className="text-xs text-outline mt-0.5">
                          {new Date(item.uploaded_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {displayPoints !== 0 && (
                      <span className={`text-sm font-bold shrink-0 ml-3 ${isPositive ? 'text-tertiary' : 'text-error'}`}>
                        {isPositive ? '+' : ''}{displayPoints} Pts
                      </span>
                    )}
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
