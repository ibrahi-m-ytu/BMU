import React, { useState, useEffect } from 'react';
import { Student } from '../types';

interface Props {
  onNavigate: (screen: string) => void;
  student: Student;
}

export function SelectIntentScreen({ onNavigate, student }: Props) {
  const [classroomsCount, setClassroomsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/classrooms?t=${Date.now()}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setClassroomsCount(data.length);
        }
      })
      .catch()
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col flex-1 px-5 pt-8 pb-12 w-full animate-in fade-in slide-in-from-bottom-4">
      <section className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container rounded-full mb-4">
          <span className="material-symbols-outlined text-[18px] text-on-secondary-container" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
          <span className="text-xs font-bold text-on-secondary-container uppercase tracking-wider">Hızlı Erişim</span>
        </div>
        <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-3">
          Selam {student.full_name.split(' ')[0]}! Bugün planın ne?
        </h2>
        <p className="text-base text-on-surface-variant font-medium">
          Kampüsteki vaktini en iyi şekilde değerlendirmene yardımcı olalım.
        </p>
      </section>

      <div className="flex flex-col gap-5 flex-1">
        <button 
          onClick={() => onNavigate('classrooms')}
          className="relative group flex flex-col w-full text-left bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm transition-all duration-200 active:scale-95"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[28px]">search</span>
          </div>
          <div className="mt-8">
            <h3 className="font-bold text-xl text-primary mb-2 leading-tight">Boş sınıfları görmek istiyorum</h3>
            {!loading && classroomsCount === 0 ? (
              <p className="text-red-600 font-bold text-sm leading-relaxed flex items-center gap-1.5 bg-red-50/75 p-2 rounded-xl border border-red-100">
                <span className="material-symbols-outlined text-lg">error</span>
                Lütfen panelden sınıf yükleyiniz (Sınıf bulunamadı)
              </p>
            ) : (
              <p className="text-on-surface-variant leading-relaxed">Çalışmak veya kafa dinlemek için uygun yerleri hemen bul.</p>
            )}
          </div>
          {!loading && classroomsCount > 0 && (
            <div className="mt-6 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border-2 border-white bg-tertiary-container flex items-center justify-center text-[10px] text-white font-bold">12+</div>
                <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] text-white font-bold">LIVE</div>
              </div>
              <span className="text-xs font-bold text-on-surface-variant/70 ml-2">Şu an aktif</span>
            </div>
          )}
        </button>

        <button 
          onClick={() => onNavigate('report-status')}
          className="relative group flex flex-col w-full text-left bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm transition-all duration-200 active:scale-95"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-secondary-container/20 flex items-center justify-center text-on-secondary-container group-hover:bg-secondary-container transition-colors">
            <span className="material-symbols-outlined text-[28px]">add_circle</span>
          </div>
          <div className="mt-8">
            <h3 className="font-bold text-xl text-on-surface mb-2 leading-tight">Sınıf hakkında bilgi vermek istiyorum</h3>
            <p className="text-on-surface-variant leading-relaxed">Bulunduğun yerin doluluk durumunu paylaş, başkalarına yardımcı ol.</p>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <div className="px-3 py-1 bg-tertiary/10 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary" style={{fontVariationSettings: "'FILL' 1"}}>stars</span>
              <span className="text-xs font-bold text-tertiary">+5-10 Puan</span>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('dashboard')}
          className="relative group flex flex-col w-full text-left bg-white border border-outline-variant/30 rounded-3xl p-6 shadow-sm transition-all duration-200 active:scale-95"
        >
          <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary group-hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[28px]">upload_file</span>
          </div>
          <div className="mt-8">
            <h3 className="font-bold text-xl text-on-surface mb-2 leading-tight">Derslik Ekle</h3>
            <p className="text-on-surface-variant leading-relaxed">Excel kullanarak sisteme yeni derslikler yükle.</p>
          </div>
        </button>
      </div>

      <div className="mt-12 opacity-80 pointer-events-none">
        <div className="w-full h-32 rounded-3xl overflow-hidden relative">
          <img alt="Campus Life" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgAFGAvVwhz_2qFsWw8Vk5Mc3SA606umt2mvA26Gp4MjeyyJKhfkNMOeHkZSqY6_qHtPFj6CxCUMUxwEQ81ZQqIsHKfjWFimrWMNg94j0OOU9wd5G9Wpxf9gFeJuQZzV3sxGPQTcMr5ps1xcOoyNde5s4d_nCPqmUkg2eLWxEenljfkKgR2Q0Y1U4PnPgt2WCHSk0uRE8wkIJuyDV_X_t54k5HiBYLmuodecVCnzjnE0MduGQVJQ-HzKPysBJ6D-wki1qqXKKvdiA"/>
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
        </div>
      </div>
    </div>
  );
}
