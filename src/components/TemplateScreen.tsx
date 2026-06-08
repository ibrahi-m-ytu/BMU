import React, { useState } from 'react';
import { ArrowLeft, Download, FileSpreadsheet, ListChecks, Target, ArrowRight } from 'lucide-react';

interface Props {
  onNavigate: (screen: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function TemplateScreen({ onNavigate, showToast }: Props) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await fetch('/api/classrooms/template');
      if (!res.ok) throw new Error('Şablon indirilemedi');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bmu_kampus_sablonu.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Şablon indirildi!', 'success');
    } catch (err) {
      showToast('Şablon indirilirken bir hata oluştu.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
      <button 
        onClick={() => onNavigate('dashboard')}
        className="flex items-center gap-2 text-gray-500 hover:text-[#183CE6] mb-6 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Dashboard'a Dön
      </button>

      <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="bg-blue-50 p-6 flex flex-col items-center border-b border-blue-100">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-blue-600 mb-4 border border-blue-100">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">Gerekli Şablonu İndir</h2>
          <p className="text-sm text-gray-600 text-center max-w-xs">
            Sistemin kabul ettiği formata uygun boş Excel dosyanızı buradan indirebilirsiniz.
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-14 bg-[#183CE6] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100 mb-8"
          >
            {isDownloading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <Download className="w-5 h-5"/>}
            Şablonu İndir (.xlsx)
          </button>

          <div className="space-y-5">
            <h3 className="font-bold text-gray-900 text-sm mb-3">Doldururken Dikkat Edilmesi Gerekenler:</h3>
            
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5"><ListChecks className="w-5 h-5" /></div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">İlk satırdaki başlıkları hiçbir şekilde değiştirmeyin.</p>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5"><Target className="w-5 h-5" /></div>
              <p className="text-sm text-gray-600 font-medium leading-relaxed">Kapasite değerine sadece rakam girin (örn: 50).</p>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => onNavigate('upload')}
        className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold py-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
      >
        Şablonu Doldurdum, Yükle <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
