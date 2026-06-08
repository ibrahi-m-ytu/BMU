import React, { useState, useEffect } from 'react';
import { Student } from '../types';

export function ReportStatusScreen({ onNavigate, showToast, student }: { onNavigate: (s:string)=>void, showToast: any, student: Student }) {
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState<any[]>([]);

  const [faculty, setFaculty] = useState('');
  const [classroom, setClassroom] = useState('');
  const [occupancy, setOccupancy] = useState(''); // Boş, Yarı Boş, Dolu
  const [internet, setInternet] = useState(''); // Düşük, Orta, Mükemmel
  const [temperature, setTemperature] = useState(''); // Sıcak, Soğuk, İdeal
  const [selectedClassId, setSelectedClassId] = useState('');

  useEffect(() => {
    fetch('/api/classrooms')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setClassrooms(data);
      })
      .catch();
  }, []);

  const handleSubmit = async () => {
    if (!selectedClassId) return;
    setLoading(true);

    const statusMap: Record<string, string> = { 'Boş': 'empty', 'Yarı Dolu': 'partial', 'Dolu': 'full' };
    const netMap: Record<string, string> = { 'Düşük': 'low', 'Orta': 'good', 'Mükemmel': 'excellent' };
    const tempMap: Record<string, string> = { 'Sıcak': 'hot', 'Soğuk': 'cold', 'İdeal': 'ideal' };

    try {
      const res = await fetch(`/api/classrooms/${selectedClassId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: statusMap[occupancy] || occupancy, 
          temp: tempMap[temperature] || temperature,
          net: netMap[internet] || internet,
          student_id: student.id
        })
      });

      const data = await res.json();

      if (res.status === 429) {
        showToast(data.message, 'warning');
        return;
      }

      if (data.success) {
        showToast(data.message, 'success');
        onNavigate('select-intent');
      } else {
        showToast(data.message || 'Rapor iletilemedi.', 'error');
      }
    } catch (e) {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const uniqueFaculties = Array.from(new Set(classrooms.map(c => c.faculty_name)));
  const filteredClasses = classrooms.filter(c => c.faculty_name === faculty);

  const isFormComplete = faculty && selectedClassId && occupancy && internet && temperature;

  return (
    <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold text-on-surface">Sınıf Durumunu Bildir</h2>
        <p className="text-base text-on-surface-variant mt-2">Şu an bulunduğun yerin şartlarını arkadaşlarınla paylaş.</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="font-extrabold text-sm text-on-surface-variant px-1">Fakülte Seç</label>
          <div className="relative">
            <select 
              value={faculty} 
              onChange={e => { setFaculty(e.target.value); setClassroom(''); }}
              className="w-full h-14 px-5 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-[20px] text-on-surface font-semibold appearance-none outline-none focus:border-primary"
            >
              <option value="">Fakülte Seçiniz...</option>
              {uniqueFaculties.map((f: any) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-extrabold text-sm text-on-surface-variant px-1">Sınıf Seç</label>
          <div className="relative">
            <select 
              value={selectedClassId} 
              onChange={e => {
                const id = e.target.value;
                setSelectedClassId(id);
                const c = classrooms.find(item => String(item.id) === id);
                if (c) setClassroom(c.room_name);
              }}
              disabled={!faculty}
              className="w-full h-14 px-5 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-[20px] text-on-surface font-semibold appearance-none outline-none focus:border-primary"
            >
              <option value="">Sınıf Seçiniz...</option>
              {filteredClasses.map(c => (
                <option key={c.id} value={c.id}>{c.room_name} ({c.building})</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>

        <div className="my-6">
          <h4 className="flex items-center gap-2 font-bold mb-4"><span className="material-symbols-outlined text-primary">groups</span>Doluluk Oranı</h4>
          <div className="grid grid-cols-3 gap-3">
            {['Boş', 'Yarı Dolu', 'Dolu'].map(val => (
              <button 
                key={val} 
                onClick={() => setOccupancy(val)}
                className={`border rounded-xl p-3 flex flex-col items-center border-outline-variant transition-all
                  ${occupancy === val ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white hover:border-primary hover:bg-primary/5'}
                `}
              >
                <span className={`material-symbols-outlined mb-2 ${occupancy === val ? 'text-primary' : 'text-on-surface-variant'}`}>person</span>
                <span className="text-sm font-bold">{val}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="my-6">
          <h4 className="flex items-center gap-2 font-bold mb-4"><span className="material-symbols-outlined text-primary">wifi</span>İnternet Kalitesi</h4>
          <div className="grid grid-cols-3 gap-3">
            {['Düşük', 'Orta', 'Mükemmel'].map(val => (
              <button 
                key={val} 
                onClick={() => setInternet(val)}
                className={`border rounded-xl p-3 flex flex-col items-center border-outline-variant transition-all
                  ${internet === val ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white hover:border-primary hover:bg-primary/5'}
                `}
              >
                <span className={`material-symbols-outlined mb-2 ${internet === val ? 'text-primary' : 'text-on-surface-variant'}`}>signal_cellular_alt</span>
                <span className="text-sm font-bold">{val}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="my-6">
          <h4 className="flex items-center gap-2 font-bold mb-4"><span className="material-symbols-outlined text-primary">thermostat</span>Sıcaklık</h4>
          <div className="grid grid-cols-3 gap-3">
            {['Sıcak', 'Soğuk', 'İdeal'].map(val => (
              <button 
                key={val} 
                onClick={() => setTemperature(val)}
                className={`border rounded-xl p-3 flex flex-col items-center border-outline-variant transition-all
                  ${temperature === val ? 'bg-primary/10 border-primary shadow-sm' : 'bg-white hover:border-primary hover:bg-primary/5'}
                `}
              >
                <span className={`material-symbols-outlined mb-2 ${temperature === val ? 'text-primary' : 'text-on-surface-variant'}`}>thermostat</span>
                <span className="text-sm font-bold">{val}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container/50 p-4 rounded-xl flex gap-3 items-start border border-primary/10">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <div className="space-y-1">
            <p className="text-xs font-bold text-on-surface">Topluluk Kuralları</p>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              Dürüst bildirimler kampüsü herkese kolaylaştırır. 
              <span className="text-primary font-bold"> Saatte en fazla 2 farklı derslik</span> bildirimi yapabilirsin.
            </p>
          </div>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={loading || !isFormComplete}
          className="w-full h-14 bg-primary text-on-primary font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? 'Bildiriliyor...' : (isFormComplete ? 'Bildir' : 'Lütfen Tüm Alanları Seçin')}
          {!loading && isFormComplete && <span className="material-symbols-outlined">send</span>}
        </button>

      </div>
    </div>
  )
}
