import React from 'react';

export function ETAScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const handleSelection = (minutes: number) => {
    // Show some toast or alert
    setTimeout(() => {
      onNavigate('classrooms');
    }, 500);
  };

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary-container/20 rounded-full blur-[100px]"></div>
      </div>
      
      <div className="w-full max-w-md mx-auto flex flex-col items-center text-center space-y-8">
        <div className="relative mb-4">
          <div className="w-24 h-24 bg-primary-container text-on-primary-container rounded-[32px] flex items-center justify-center shadow-lg transform rotate-6 animate-bounce">
            <span className="material-symbols-outlined text-[48px]" style={{fontVariationSettings: "'FILL' 1"}}>directions_run</span>
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary-container text-on-secondary-container rounded-full flex items-center justify-center shadow-md transform -rotate-12">
            <span className="material-symbols-outlined text-[20px]">timer</span>
          </div>
        </div>
        
        <div className="space-y-2 px-4">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight leading-tight">
            Ne kadar sürede oradasın?
          </h1>
          <p className="text-on-surface-variant text-base">
            Sınıf arkadaşların yerini senin için rezerve ediyor!
          </p>
        </div>
        
        <div className="w-full flex flex-col gap-4 pt-4">
          <button onClick={() => handleSelection(5)} className="group relative overflow-hidden flex items-center justify-between px-8 py-6 w-full bg-primary-container text-on-primary-container rounded-[24px] shadow-lg active:scale-95 transition-all duration-200 border-b-4 border-primary hover:brightness-110">
            <span className="text-2xl font-bold">[5 dk]</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">Koşar Adım</span>
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>bolt</span>
            </div>
          </button>
          <button onClick={() => handleSelection(10)} className="group relative overflow-hidden flex items-center justify-between px-8 py-6 w-full bg-secondary-container text-on-secondary-container rounded-[24px] shadow-lg active:scale-95 transition-all duration-200 border-b-4 border-secondary hover:brightness-110">
            <span className="text-2xl font-bold">[10 dk]</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-widest opacity-80">Orta Şeker</span>
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>directions_walk</span>
            </div>
          </button>
          <button onClick={() => handleSelection(15)} className="group relative overflow-hidden flex items-center justify-between px-8 py-6 w-full bg-surface-container-highest text-on-surface rounded-[24px] shadow-md active:scale-95 transition-all duration-200 border-b-4 border-outline-variant hover:bg-surface-variant">
            <span className="text-2xl font-bold">[15 dk]</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-widest opacity-60">Acelem Yok</span>
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>coffee</span>
            </div>
          </button>
        </div>
        
        <div className="pt-8 w-full flex justify-center">
          <div className="bg-white/70 backdrop-blur-md px-4 py-2 rounded-full border border-black/5 flex items-center gap-3">
            <div className="w-2 h-2 bg-tertiary-fixed-dim rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-on-surface-variant">Kampüste 42 kişi yolda</span>
          </div>
        </div>
      </div>
    </div>
  )
}
