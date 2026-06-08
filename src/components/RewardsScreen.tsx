import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface Props {
  student: Student;
  showToast?: (msg: string, type: 'success' | 'error') => void;
}

export function RewardsScreen({ student, showToast }: Props) {
  const [totalPoints, setTotalPoints] = useState(student.points);
  const [activeCode, setActiveCode] = useState<{ code: string; item: string; cost: number } | null>(null);

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

  const handleSpendPoints = async (cost: number, itemName: string) => {
    try {
      const res = await fetch(`/api/students/${student.student_no}/spend-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: cost, item_name: itemName })
      });
      const data = await res.json();
      if (res.ok) {
        setTotalPoints(data.remainingPoints);
        
        // Update local Student points as well
        const saved = localStorage.getItem('bmu_student');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            parsed.points = data.remainingPoints;
            localStorage.setItem('bmu_student', JSON.stringify(parsed));
          } catch (e) {}
        }

        if (showToast) showToast(`${itemName} ödülü başarıyla seçildi! QR kodunuz oluşturuluyor...`, 'success');
        
        const qrContent = `VERIFY-${student.student_no}-${Date.now()}-${cost}-${itemName.replace(/\s+/g, '-')}`;
        setActiveCode({ code: qrContent, item: itemName, cost });
      } else {
        if (showToast) showToast(data.message || 'Bir hata oluştu.', 'error');
      }
    } catch {
      if (showToast) showToast('Bağlantı hatası.', 'error');
    }
  };

  const coffeeProgress = Math.min((totalPoints / 100) * 100, 100);
  const snackProgress = Math.min((totalPoints / 150) * 100, 100);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 pb-20">
      <section className="space-y-4">
        <h2 className="text-3xl tracking-tight text-primary font-bold px-1">Ödüllerin 🎁</h2>
        <p className="text-base text-on-surface-variant px-1">Puanlarını biriktirerek kampüste çeşitli avantajlar elde edebilirsin.</p>
        
        <div className="bg-gradient-to-r from-primary to-tertiary p-6 rounded-[24px] text-white shadow-lg flex items-center justify-between mt-4">
          <div>
            <p className="text-white/80 font-medium mb-1">Toplam Puanın</p>
            <div className="text-4xl font-extrabold">{totalPoints}</div>
          </div>
          <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
            <span className="material-symbols-outlined text-4xl">local_activity</span>
          </div>
        </div>

        <div className="grid gap-4 mt-6">
          {/* Coffee reward card */}
          <div className="bg-white border border-outline-variant p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">☕</span>
                <div>
                  <h3 className="text-xl font-bold">Kahve</h3>
                  <p className="text-xs text-outline font-medium">Kantin & Kafeterya</p>
                </div>
              </div>
              {totalPoints >= 100 ? (
                <button 
                  onClick={() => handleSpendPoints(100, 'Kahve')}
                  className="bg-tertiary-container text-on-tertiary-container px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Kullan
                </button>
              ) : (
                <div className="text-outline text-sm font-bold py-2 px-2">
                  {100 - totalPoints} Puan Kaldı
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-tertiary-fixed-dim rounded-full transition-all duration-500" style={{ width: `${coffeeProgress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-tertiary">
                {totalPoints >= 100 ? <span>Hedefe Ulaşıldı!</span> : <span>İlerleme</span>}
                <span>{totalPoints} / 100 Puan</span>
              </div>
            </div>
          </div>

          {/* Snack reward card */}
          <div className="bg-white border border-outline-variant p-5 rounded-[24px] shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🥪</span>
                <div>
                  <h3 className="text-xl font-bold">Atıştırmalık</h3>
                  <p className="text-xs text-outline font-medium">Öğrenci Lokantası</p>
                </div>
              </div>
              {totalPoints >= 150 ? (
                <button 
                  onClick={() => handleSpendPoints(150, 'Atıştırmalık')}
                  className="bg-tertiary-container text-on-tertiary-container px-6 py-2 rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  Kullan
                </button>
              ) : (
                <div className="text-outline text-sm font-bold py-2 px-2">
                  {150 - totalPoints} Puan Kaldı
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary-container rounded-full transition-all duration-500" style={{ width: `${snackProgress}%` }}></div>
              </div>
              <div className="flex justify-between text-xs font-bold text-outline">
                {totalPoints >= 150 ? <span className="text-primary font-bold">Hedefe Ulaşıldı!</span> : <span>İlerleme</span>}
                <span>{totalPoints} / 150 Puan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Point System Table */}
      <section className="space-y-4 pt-6">
        <h3 className="text-xl font-extrabold text-gray-900 border-l-4 border-primary pl-3">Nasıl Puan Kazanılır? 📈</h3>
        <div className="bg-white border border-gray-100 rounded-[28px] overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-widest">
              <tr>
                <th className="px-6 py-4">Eylem</th>
                <th className="px-6 py-4 text-right">Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <tr>
                <td className="px-6 py-4 font-medium">Sınıf Bildirimi (Boş)</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-bold">+10</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Sınıf Bildirimi (Yarı Dolu)</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-bold">+8</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Sınıf Bildirimi (Dolu)</td>
                <td className="px-6 py-4 text-right text-emerald-600 font-bold">+5</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">2. Doğrulayıcı Bonusu</td>
                <td className="px-6 py-4 text-right text-emerald-500 font-bold">+5</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">3. Doğrulayıcı Bonusu</td>
                <td className="px-6 py-4 text-right text-emerald-500 font-bold">+3</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium">Raporun Kullanıldı (Kişi başı)</td>
                <td className="px-6 py-4 text-right text-blue-600 font-bold">+2</td>
              </tr>
              <tr className="bg-red-50/30">
                <td className="px-6 py-4 font-medium text-red-700 underline decoration-red-200">Hatalı Durum Bildirimi</td>
                <td className="px-6 py-4 text-right text-red-600 font-bold">-10</td>
              </tr>
              <tr className="bg-red-50/30">
                <td className="px-6 py-4 font-medium text-red-700 underline decoration-red-200">Hatalı İnternet/Sıcaklık</td>
                <td className="px-6 py-4 text-right text-red-600 font-bold">-5</td>
              </tr>
              <tr className="bg-red-50/30">
                <td className="px-6 py-4 font-medium text-red-700 underline decoration-red-200">Yanlış Rapor (Tüm alanlar)</td>
                <td className="px-6 py-4 text-right text-red-700 font-black">-15</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-gray-400 px-2 italic">
          * Hatalı bildirim yapılması durumunda, bildirimden kazanılan puan geri alınır ve yukarıdaki cezalar uygulanır.
        </p>
      </section>

      {/* QR Code Presentation Modal */}
      {activeCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-[28px] p-6 shadow-2xl border border-gray-150 animate-in zoom-in-95 duration-300 text-center relative">
            <h3 className="text-2xl font-black text-gray-900 mb-1">Kuponun Hazır! 🎁</h3>
            <p className="text-sm text-gray-500 mb-6">{activeCode.item} ödülünüz için oluşturulan karekodu görevliye taratabilirsiniz.</p>
            
            <div className="bg-gray-50 p-4 rounded-2xl inline-block mb-4 border border-gray-100">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&color=183ce6&data=${encodeURIComponent(activeCode.code)}`} 
                alt="Award QR Code" 
                className="w-48 h-48 mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="bg-blue-50/50 p-2.5 rounded-xl mb-6 text-xs text-[#183CE6] font-mono select-all overflow-x-auto whitespace-nowrap">
              {activeCode.code}
            </div>

            <div className="text-xs text-gray-400 mb-6">
              Harcanan: <strong className="text-gray-700 font-semibold">{activeCode.cost} Puan</strong> • Kupon 15 dakika geçerlidir.
            </div>

            <button
              onClick={() => setActiveCode(null)}
              className="w-full bg-[#183CE6] hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all active:scale-[0.98] outline-none cursor-pointer"
            >
              Tamam, Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
