import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { TemplateScreen } from './components/TemplateScreen';
import { UploadScreen } from './components/UploadScreen';
import { Navbar } from './components/Navbar';
import { Toast } from './components/Toast';
import { useToast } from './hooks/useToast';
import { Student } from './types';

// New Screens
import { SelectIntentScreen } from './components/SelectIntentScreen';
import { ClassroomsScreen } from './components/ClassroomsScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { ETAScreen } from './components/ETAScreen';
import { ReportIssueScreen } from './components/ReportIssueScreen';
import { ReportStatusScreen } from './components/ReportStatusScreen';
import { RewardsScreen } from './components/RewardsScreen';
import { PendingUploadsScreen } from './components/PendingUploadsScreen';

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [student, setStudent] = useState<Student | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('bmu_student');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStudent(parsed);
        setScreen('select-intent');
      } catch (e) {
        localStorage.removeItem('bmu_student');
      }
    }
  }, []);

  const handleLogin = (data: Student) => {
    localStorage.setItem('bmu_student', JSON.stringify(data));
    setStudent(data);
    setScreen('select-intent');
  };

  const handleLogout = () => {
    localStorage.removeItem('bmu_student');
    setStudent(null);
    setScreen('welcome');
  };

  const renderScreen = () => {
    if (!student) {
      if (screen === 'register') return <RegisterScreen onLogin={handleLogin} onNavigate={setScreen} showToast={showToast} />;
      return <WelcomeScreen onNavigate={setScreen} />;
    }

    switch (screen) {
      case 'dashboard':
        return <DashboardScreen student={student} onNavigate={setScreen} showToast={showToast} />;
      case 'template':
        return <TemplateScreen onNavigate={setScreen} showToast={showToast} />;
      case 'upload':
        return <UploadScreen student={student} onNavigate={setScreen} showToast={showToast} />;
      
      // New Flow
      case 'select-intent':
        return <SelectIntentScreen onNavigate={setScreen} student={student} />;
      case 'classrooms':
        return <ClassroomsScreen onNavigate={setScreen} student={student} showToast={showToast} />;
      case 'rewards':
        return <RewardsScreen student={student} showToast={showToast} />;
      case 'profile':
        return <ProfileScreen student={student} onNavigate={setScreen} />;
      case 'eta':
        return <ETAScreen onNavigate={setScreen} />;
      case 'report-issue':
        return <ReportIssueScreen onNavigate={setScreen} showToast={showToast} student={student} />;
      case 'report-status':
        return <ReportStatusScreen onNavigate={setScreen} showToast={showToast} student={student} />;
      case 'pending_uploads':
        return <PendingUploadsScreen student={student} onNavigate={setScreen} showToast={showToast} />;
      default:
        setScreen('select-intent');
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)] font-sans selection:bg-primary-fixed">
      <Navbar student={student} onLogout={handleLogout} currentScreen={screen} onNavigate={setScreen} />
      
      <main className={`px-4 pt-4 mx-auto w-full max-w-md ${student ? 'pb-24' : 'pb-8'}`}>
        {renderScreen()}
      </main>

      <Toast toast={toast} onHide={hideToast} />

      {student && (
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-end px-2 pb-safe pt-2 bg-white/95 backdrop-blur-xl shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[32px] border-t border-gray-100 pb-5">
          <div className="w-full max-w-lg flex justify-around items-end">
            <div className="flex-1 flex justify-center">
              <button onClick={() => setScreen('select-intent')} className="flex flex-col items-center justify-center p-2 min-w-[72px] text-on-surface-variant hover:text-primary transition-all active:scale-90">
                <span className={`material-symbols-outlined text-[30px] ${screen === 'select-intent' ? 'text-primary' : ''}`} style={{fontVariationSettings: screen === 'select-intent' ? "'FILL' 1" : "'FILL' 0"}}>grid_view</span>
                <span className={`text-xs font-bold mt-1 ${screen === 'select-intent' ? 'text-primary' : ''}`}>Derslikler</span>
              </button>
            </div>
            
            <div className="flex-1 flex justify-center">
              <button onClick={() => setScreen('rewards')} className="flex flex-col items-center justify-center p-2 min-w-[72px] text-on-surface-variant hover:text-primary transition-all active:scale-90">
                <span className={`material-symbols-outlined text-[30px] ${screen === 'rewards' ? 'text-primary' : ''}`} style={{fontVariationSettings: screen === 'rewards' ? "'FILL' 1" : "'FILL' 0"}}>stars</span>
                <span className={`text-xs font-bold mt-1 ${screen === 'rewards' ? 'text-primary' : ''}`}>Puanlar</span>
              </button>
            </div>

            {student.student_no === 'admin' && (
              <div className="flex-1 flex justify-center">
                <button 
                  onClick={() => setScreen('dashboard')} 
                  className="flex flex-col items-center justify-center p-2 min-w-[72px] text-on-surface-variant hover:text-primary transition-all active:scale-90"
                >
                  <span className={`material-symbols-outlined text-[30px] ${screen === 'dashboard' ? 'text-primary' : ''}`} style={{fontVariationSettings: screen === 'dashboard' ? "'FILL' 1" : "'FILL' 0"}}>
                    admin_panel_settings
                  </span>
                  <span className={`text-xs font-bold mt-1 ${screen === 'dashboard' ? 'text-primary' : ''}`}>Yönetim</span>
                </button>
              </div>
            )}

            <div className="flex-1 flex justify-center">
              <button onClick={() => setScreen('profile')} className="flex flex-col items-center justify-center p-2 min-w-[72px] text-on-surface-variant hover:text-primary transition-all active:scale-90">
                <span className={`material-symbols-outlined text-[30px] ${screen === 'profile' ? 'text-primary' : ''}`} style={{fontVariationSettings: screen === 'profile' ? "'FILL' 1" : "'FILL' 0"}}>person</span>
                <span className={`text-xs font-bold mt-1 ${screen === 'profile' ? 'text-primary' : ''}`}>Profil</span>
              </button>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
