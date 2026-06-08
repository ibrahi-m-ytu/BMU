import React from 'react';
import { Student } from '../types';

interface Props {
  student: Student | null;
  onLogout: () => void;
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export function Navbar({ student, onLogout, currentScreen, onNavigate }: Props) {
  // Hide top navigation context tabs if we are on screens that don't need them
  // Now we use Bottom Navigation so the top nav is just a header
  const getScreenLabel = () => {
    switch (currentScreen) {
      case 'select-intent': return 'Derslikler';
      case 'rewards': return 'Puanlar & Ödüller';
      case 'dashboard': return student?.student_no === 'admin' ? 'Yönetim Paneli' : 'Panel';
      case 'profile': return 'Profil';
      case 'pending_uploads': return 'Bekleyen Yüklemeler';
      case 'classrooms': return 'Sınıf Seçimi';
      case 'upload': return 'Excel Yükle';
      case 'template': return 'Şablon İndir';
      default: return 'BMU';
    }
  };

  return (
    <nav className="bg-surface/80 backdrop-blur-md sticky top-0 z-40 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          onClick={() => student && onNavigate('select-intent')}
          className={`flex items-center gap-2 ${student ? 'cursor-pointer' : ''}`}
        >
          <div className="w-10 h-10 rounded-full border border-primary-container overflow-hidden bg-primary-container flex items-center justify-center text-on-primary-container font-extrabold text-sm">
             {student ? student.full_name.substring(0, 2).toUpperCase() : 'BM'}
          </div>
          <span className="font-extrabold text-primary tracking-tighter text-xl">BMU</span>
        </div>

        {student && (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-outline bg-surface-container px-3 py-1.5 rounded-full transition-all animate-in fade-in zoom-in-95 duration-300">
              {getScreenLabel()}
            </div>
            <button 
              onClick={onLogout}
              className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
