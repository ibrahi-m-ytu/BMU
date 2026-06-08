import React, { useState } from 'react';
import { ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Student } from '../types';

interface Props {
  onLogin: (student: Student) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  onNavigate: (screen: string) => void;
}

export function RegisterScreen({ onLogin, showToast, onNavigate }: Props) {
  const [loading, setLoading] = useState(false);
  const [lookupMode, setLookupMode] = useState(true);
  const [faculties, setFaculties] = useState<string[]>([
    "Mühendislik Fakültesi", "Fen Edebiyat Fakültesi", "Hukuk Fakültesi", "Tıp Fakültesi", "İşletme Fakültesi", "Diğer"
  ]);

  React.useEffect(() => {
    fetch('/api/classrooms')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const unique = Array.from(new Set(data.map(c => c.faculty_name)));
          if (unique.length > 0) setFaculties(unique as string[]);
        }
      })
      .catch();
  }, []);

  const [formData, setFormData] = useState({
    full_name: '',
    student_no: '',
    email: '',
    faculty: ''
  });

  const [lookupNo, setLookupNo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.student_no !== 'admin') {
      if (formData.full_name.length < 3) return showToast('Ad Soyad en az 3 karakter olmalıdır.', 'error');
      if (formData.student_no.length < 8) return showToast('Öğrenci numarası geçersiz.', 'error');
      if (!formData.email.endsWith('.edu.tr')) return showToast('Geçerli bir öğrenci (.edu.tr) e-posta adresi giriniz.', 'error');
      if (!formData.faculty) return showToast('Fakülte seçiniz.', 'error');
    }

    try {
      setLoading(true);
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        showToast('Sunucu yanıtı okunamadı', 'error');
        return;
      }

      if (res.ok) {
        showToast('Kayıt başarılı! Hoş geldiniz.', 'success');
        onLogin(data.student);
      } else {
        showToast(data.message || 'Kayıt başarısız', 'error');
      }
    } catch (err: any) {
      showToast('Bağlantı hatası: ' + (err.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupNo) return showToast('Öğrenci numarası giriniz.', 'error');

    try {
      setLoading(true);
      const res = await fetch(`/api/students/${lookupNo}`);
      
      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        showToast('Sunucu yanıtı okunamadı', 'error');
        return;
      }

      if (res.ok) {
        showToast('Giriş başarılı!', 'success');
        onLogin(data);
      } else {
        showToast(data.message || 'Öğrenci bulunamadı', 'error');
      }
    } catch (err: any) {
      showToast('Bağlantı hatası: ' + (err.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button 
        onClick={() => onNavigate('welcome')}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Geri dön
      </button>

      <div className="bg-white/80 backdrop-blur-md p-6 md:p-8 rounded-[24px] shadow-sm border border-outline-variant/30 relative">
        {/* Decorative elements to match the requested UI */}
        <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <h2 className="text-3xl font-extrabold text-primary mb-6 tracking-tight">
          {lookupMode ? 'Öğrenci Girişi' : 'Aramıza Katıl'}
        </h2>

        {!lookupMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-outline mb-1 ml-2">Ad Soyad</label>
                <input
                  type="text"
                  autoComplete="name"
                  required
                  className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold"
                  placeholder="Örn. Ahmet Yılmaz"
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-bold text-outline mb-1 ml-2">Öğrenci Numarası</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold pr-10"
                    placeholder="Örn. 20210001"
                    value={formData.student_no}
                    onChange={e => setFormData({ ...formData, student_no: e.target.value })}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">badge</span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-outline mb-1 ml-2">E-posta</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold pr-10"
                    placeholder="Örn. ahmet@bmu.edu.tr"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                   <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">alternate_email</span>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-outline mb-1 ml-2">Fakülte</label>
                <div className="relative">
                  <select
                    required
                    className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold appearance-none pr-10"
                    value={formData.faculty}
                    onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                  >
                    <option value="" disabled>Fakülteni seç...</option>
                    {faculties.map((f, i) => (
                      <option key={i} value={f}>{f}</option>
                    ))}
                    {!faculties.includes('Diğer') && <option value="Diğer">Diğer</option>}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs font-semibold text-outline px-4 pt-4 pb-2">
                Kaydol butonuna basarak kampüsün en havalı topluluğuna katılmayı kabul etmiş olursun! 😎
            </p>

            <button
              disabled={loading}
              type="submit"
              className="w-full h-14 bg-primary-container text-on-primary-container font-extrabold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : (
                  <>
                    <span>Kaydol</span>
                    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLookup} className="space-y-4">
             <div>
                <label className="block text-sm font-bold text-outline mb-1 ml-2">Öğrenci Numarası</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="w-full h-14 px-4 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold pr-10"
                    placeholder="Örn. 20210001"
                    value={lookupNo}
                    onChange={e => setLookupNo(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none">badge</span>
                </div>
              </div>
            <button
              disabled={loading}
              type="submit"
              className="w-full mt-4 h-14 bg-primary text-on-primary font-bold rounded-full shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Giriş Yap'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm font-semibold text-on-surface-variant">
            {lookupMode ? "Üye değil misiniz?" : "Zaten bir hesabın var mı?"}
            <button 
              type="button"
              onClick={() => setLookupMode(!lookupMode)}
              className="text-primary font-bold hover:underline ml-1"
            >
              {lookupMode ? "Kaydol" : "Giriş Yap"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
