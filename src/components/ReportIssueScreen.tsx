import React, { useState } from 'react';

import { Student } from '../types';

export function ReportIssueScreen({ onNavigate, showToast, student }: { onNavigate: (s:string)=>void, showToast: any, student: Student }) {
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if(!active) {
      showToast('Lütfen bir sorun seçin.', 'error');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Raporunuz başarıyla iletildi. Teşekkürler!', 'success');
      onNavigate('classrooms');
    }, 1500);
  }

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-top-4 relative">
      <div className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container" style={{fontVariationSettings: "'FILL' 1"}}>meeting_room</span>
          </div>
          <div>
            <h2 className="font-bold text-xl text-on-surface">Amfi 1</h2>
            <p className="text-on-surface-variant text-sm font-semibold">Mühendislik Fakültesi</p>
          </div>
        </div>
      </div>

      <section className="mb-8">
        <h3 className="font-bold text-lg mb-4 text-on-surface">Ne Yanlış?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: '1', icon: 'groups', label: 'Doluluk Oranı Yanlış' },
            { id: '2', icon: 'wifi', label: 'İnternet Kalitesi Yanlış' },
            { id: '3', icon: 'thermostat', label: 'Sıcaklık Yanlış' },
            { id: '4', icon: 'lock_person', label: 'Sınıf Kapalı/Erişilemez' },
          ].map(opt => (
            <button 
              key={opt.id}
              onClick={() => setActive(opt.id)}
              className={`flex flex-col items-start p-4 bg-surface-container-lowest border rounded-xl text-left transition-all active:scale-[0.98] ${
                active === opt.id ? 'border-primary bg-primary-container/20' : 'border-outline-variant hover:border-primary/50'
              }`}
            >
              <span className="material-symbols-outlined text-primary mb-3 text-[28px]" style={{fontVariationSettings: active === opt.id ? "'FILL' 1" : "'FILL' 0"}}>{opt.icon}</span>
              <span className="text-sm font-bold leading-tight">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h3 className="font-bold text-lg mb-4 text-on-surface">Detaylı Not</h3>
        <textarea 
          className="w-full h-32 p-4 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-on-surface-variant/50 text-base" 
          placeholder="Lütfen durumu kısaca açıklayın (isteğe bağlı)..."
        ></textarea>
      </section>

      <button 
        onClick={handleSubmit} 
        disabled={loading}
        className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-primary-container transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span>Raporu Gönder</span>}
        {!loading && <span className="material-symbols-outlined">send</span>}
      </button>

      <div className="mt-12 opacity-80 flex flex-col items-center text-center">
        <img className="w-full h-40 object-cover rounded-xl grayscale opacity-20" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyof9fjcH8EplTF0SEYrDUCUqRrFKZVGNjSDO28LCj2sa0yq1h9MLoo5z76UcNOwFtXENTaiGW8kUBAIomLCs4Bk-LLKYlGzm1T-hOaf9q5xTEUZDuGMGzP8uuGEqlFXIHJ8mB1JfwPIzTOhEFn3PTxrw9PfjYi38IZkbLggTpWQuJ3NLsxYm5-xE97GeFOQXkXF6Qqzqz07n-Rn98sjk9p2sgUE2rUG0fyCJvXlcHZTrNIhbSmhwKr8mOx80LFy58tK8puwoS7Jo" alt="Campus context"/>
        <p className="text-xs font-semibold text-on-surface-variant mt-2 italic">Geri bildirimlerin topluluk için değerlidir.</p>
      </div>
    </div>
  )
}
