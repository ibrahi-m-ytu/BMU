import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student } from '../types';

interface Props {
  onNavigate: (screen: string) => void;
  student: Student;
  showToast: any;
}

export function ClassroomsScreen({ onNavigate, student, showToast }: Props) {
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [facultyFilter, setFacultyFilter] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'favorites'>('all');
  
  // False Report Modal State
  const [reportModal, setReportModal] = useState<any | null>(null);
  const [wrongFields, setWrongFields] = useState<string[]>([]);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    const fetchRooms = () => {
      fetch(`/api/classrooms?t=${Date.now()}`)
        .then(r => r.json())
        .then(data => {
          if (Array.isArray(data)) setClassrooms(data);
        })
        .catch();
    };

    fetchRooms();
    const interval = setInterval(fetchRooms, 15000); // Polling classrooms every 15s
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGo = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = 'Yoldasın! 🚀';
    btn.classList.replace('bg-primary', 'bg-tertiary-container');
    
    // Increment occupancy in DB
    fetch(`/api/classrooms/${id}/occupy`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ student_id: student.id })
    }).catch(() => {});

    setTimeout(() => {
        onNavigate('eta');
    }, 1000);
  };

  const submitFalseReport = async () => {
    if (!reportModal || wrongFields.length === 0) return;
    setReporting(true);
    try {
      const res = await fetch(`/api/classrooms/${reportModal.id}/false-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_student_id: student.id,
          wrong_fields: wrongFields
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        setReportModal(null);
        setWrongFields([]);
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setReporting(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 relative">
      <section className="mb-stack-lg">
        <h1 className="text-3xl md:text-4xl font-bold text-on-surface mb-2">Keşfet 🔭</h1>
        <p className="text-base text-on-surface-variant mb-4">Kampüste bugün durumlar sakin. İşte senin için en iyi çalışma alanları:</p>
        
        {classrooms.length > 0 && (
          <div className="relative mb-6">
            <select 
              value={facultyFilter}
              onChange={e => setFacultyFilter(e.target.value)}
              className="w-full h-12 bg-surface-container border-none rounded-xl px-4 appearance-none outline-none font-bold text-sm text-on-surface"
            >
              <option value="">Tüm Fakülteler</option>
              {Array.from(new Set(classrooms.map(c => c.faculty_name))).map((f: any) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>
        )}
      </section>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setFilterMode('all')}
          className={`${filterMode === 'all' ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant'} px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all`}
        >
          Tüm Derslikler
        </button>
        <button 
          onClick={() => setFilterMode('favorites')}
          className={`${filterMode === 'favorites' ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container-high text-on-surface-variant'} px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all`}
        >
          Favorilerim
        </button>
      </div>

      {classrooms.length === 0 ? (
        <div className="col-span-1 md:col-span-2 bg-blue-50/60 border border-blue-200 rounded-[28px] p-8 text-center my-8 shadow-sm">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-200">
            <span className="material-symbols-outlined text-3xl leading-none">school</span>
          </div>
          <h3 className="font-black text-xl text-blue-900 mb-2">Henüz Sınıf Yüklenmedi 🏫</h3>
          <p className="text-sm text-blue-700 font-semibold leading-relaxed max-w-sm mx-auto mb-6">
            Sistemde kayıtlı derslik bulunamadı. Lütfen yönetici panelinden Excel şablonu kullanarak sınıfları sisteme dahil edin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          {classrooms.filter(c => (!facultyFilter || c.faculty_name === facultyFilter) && (filterMode === 'all' || favorites.has(c.id))).map((c: any) => {
            const hasStatus = !!c.status;
            
            // Check for false report window (20 mins)
            let minsRemaining = 0;
            if (c.last_insight_at) {
              const diff = Date.now() - new Date(c.last_insight_at).getTime();
              minsRemaining = Math.max(0, 20 - Math.floor(diff / 60000));
            }

            return (
              <div key={c.id} className="bg-white/70 backdrop-blur-md rounded-[24px] p-4 shadow-sm border border-black/5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    <button onClick={() => toggleFavorite(c.id)} className="mt-1 flex-shrink-0 text-outline hover:text-secondary hover:opacity-80 transition-colors cursor-pointer">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: favorites.has(c.id) ? "'FILL' 1" : "'FILL' 0", color: favorites.has(c.id) ? '#f59e0b' : 'inherit' }}>star</span>
                    </button>
                    <div>
                      <h3 className="font-bold text-xl text-on-surface">{c.room_name}</h3>
                      <p className="text-xs text-outline">{c.building}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full shadow-sm ${hasStatus ? (c.status === 'Boş' ? 'bg-tertiary-fixed text-on-tertiary-fixed' : 'bg-secondary-fixed text-on-secondary-fixed') : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-2 h-2 rounded-full ${hasStatus ? 'animate-pulse' : ''} ${hasStatus ? (c.status === 'Boş' ? 'bg-tertiary' : 'bg-secondary') : 'bg-gray-400'}`}></span>
                    <span className="text-sm font-bold">{c.status || 'Bilgi Yok'}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[18px]">thermostat</span>
                    <span className="text-sm font-bold text-gray-500">
                      {c.temp && c.temp !== 'Bilgi Yok' ? (c.temp.includes('°C') || ['hot','cold','ideal','Sıcak','Soğuk','İdeal'].includes(c.temp) ? c.temp : `${c.temp}°C`) : 'Bilgi Yok'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-xl border border-outline-variant/30">
                    <span className="material-symbols-outlined text-[18px]">wifi</span>
                    <span className="text-sm font-bold text-gray-500">{c.net || 'Bilgi Yok'}</span>
                  </div>
                  
                  {minsRemaining > 0 && (
                    <button 
                      onClick={() => setReportModal(c)}
                      className="flex items-center gap-1.5 bg-error/10 text-error px-3 py-1.5 rounded-xl border border-error/20 hover:bg-error/20 transition-all text-xs font-bold"
                    >
                      <span className="material-symbols-outlined text-[16px]">report_problem</span>
                      Yanlış Bildirim ({minsRemaining} dk)
                    </button>
                  )}
                </div>
                
                <div className="bg-primary-fixed/30 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>groups</span>
                    <span className="text-base text-on-primary-fixed-variant">Gelen Öğrenciler</span>
                  </div>
                  <span className="text-xl font-bold text-primary">{c.val || 0}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <button onClick={(e) => handleGo(c.id, e)} className="bg-primary text-on-primary h-14 rounded-2xl text-sm font-bold shadow-lg active:scale-95 transition-all cursor-pointer">Oraya Gidiyorum</button>
                  <button onClick={() => onNavigate('report-status')} className="bg-surface-variant text-on-surface-variant h-14 rounded-2xl text-sm font-bold active:scale-95 transition-all cursor-pointer">Bildir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* False Report Modal */}
      <AnimatePresence>
        {reportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setReportModal(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl relative z-10"
            >
              <h3 className="text-2xl font-bold text-on-surface mb-2">Hangi bilgi yanlıştı?</h3>
              <p className="text-on-surface-variant text-sm mb-6">Birden fazla alan seçebilirsiniz. Hatalı bildirim yapan öğrenciden puan düşülecektir.</p>
              
              <div className="space-y-3 mb-8">
                {[
                  { id: 'status', label: 'Derslik Durumu (Boş/Dolu)' },
                  { id: 'net', label: 'İnternet Kalitesi' },
                  { id: 'temp', label: 'Sıcaklık' },
                ].map(field => (
                  <label key={field.id} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-container hover:bg-surface-container-high transition-all cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-6 h-6 rounded-lg accent-primary"
                      checked={wrongFields.includes(field.id)}
                      onChange={(e) => {
                        if (e.target.checked) setWrongFields([...wrongFields, field.id]);
                        else setWrongFields(wrongFields.filter(f => f !== field.id));
                      }}
                    />
                    <span className="font-bold text-on-surface">{field.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={submitFalseReport}
                  disabled={wrongFields.length === 0 || reporting}
                  className="w-full h-14 bg-error text-white rounded-2xl font-bold shadow-lg active:scale-95 transition-all text-sm disabled:opacity-50"
                >
                  {reporting ? 'Bildiriliyor...' : 'Şikâyeti Gönder'}
                </button>
                <button 
                  onClick={() => setReportModal(null)}
                  className="w-full h-14 bg-surface-container text-on-surface rounded-2xl font-bold active:scale-95 transition-all text-sm"
                >
                  Vazgeç
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
