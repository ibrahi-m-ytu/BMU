import React from 'react';
import { ArrowRight, Info } from 'lucide-react';

interface Props {
  onNavigate: (screen: string) => void;
}

export function WelcomeScreen({ onNavigate }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 animate-in fade-in zoom-in-95 duration-300">
      <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-sm">
        <span className="material-symbols-outlined text-4xl">school</span>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
        BMU Kampüs <br className="hidden md:block"/> Derslik Yönetimi
      </h1>
      <p className="text-gray-600 text-lg mb-10 max-w-sm">
        Dersliklerinizi kaydedin, puan kazanın.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => onNavigate('register')}
          className="w-full bg-[#183CE6] hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          Giriş Yap
          <ArrowRight className="w-5 h-5" />
        </button>
        <a href="#how-it-works" className="w-full bg-white hover:bg-gray-50 text-blue-600 border border-blue-200 font-semibold py-4 px-6 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2">
          Nasıl Çalışır?
        </a>
      </div>

      <div id="how-it-works" className="mt-20 border-t border-gray-100 pt-16 w-full text-left">
        <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
          <Info className="w-6 h-6 text-blue-600" />
          Nasıl Çalışır?
        </h2>
        
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
          {[
            { step: '1', title: 'Kayıt Ol', desc: 'Öğrenci bilgilerinle sisteme giriş yap.' },
            { step: '2', title: 'Şablonu İndir', desc: 'Boş derslik Excel listesi (.xlsx) indir.' },
            { step: '3', title: 'Yükle & Puan Kazan', desc: 'Doldurduğun dosyayı yükle, topluluğa katkı sağla.' },
            { step: '4', title: 'Vakit Kazan', desc: 'Boş sınıfları anlık gör ve ders çalışma vaktini verimli kullan.' },
          ].map((item, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {item.step}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-gray-100 bg-white shadow-sm">
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
