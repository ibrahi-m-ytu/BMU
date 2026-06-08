import React, { useState, useRef } from 'react';
import { ArrowLeft, UploadCloud, File, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student } from '../types';

interface Props {
  student: Student;
  onNavigate: (screen: string) => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
}

export function UploadScreen({ student, onNavigate, showToast }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<{status: string, message: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      showToast('Lütfen sadece .xlsx uzantılı Excel dosyası yükleyin.', 'error');
      return;
    }
    setSelectedFile(file);
    setUploadSuccess(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('student_id', student.id.toString());

      const res = await fetch('/api/classrooms/upload', {
        method: 'POST',
        body: formData,
      });

      let data;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
      } catch (parseErr) {
        showToast('Sunucu yanıtı okunamadı (API hatası).', 'error');
        return;
      }

      if (res.ok) {
        showToast('Dosya başarıyla yüklendi!', 'success');
        setUploadSuccess({ status: data.status, message: data.message });
        
        // Confetti explosion
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#183CE6', '#22C55E', '#FBBF24']
        });
      } else {
        showToast(data.message || 'Yükleme başarısız (' + res.status + ')', 'error');
      }
    } catch (err: any) {
      showToast('Bağlantı hatası: ' + (err.message || 'Bilinmiyor'), 'error');
    } finally {
      setIsUploading(false);
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

      <h2 className="text-2xl font-bold text-gray-900 mb-2">Dosya Yükle</h2>
      <p className="text-gray-600 mb-8 text-sm">Doldurduğun Excel şablonunu sisteme yükleyerek puan kazan.</p>

      {uploadSuccess ? (
        <div className="bg-blue-50 border border-blue-200 rounded-[24px] p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-blue-100 text-[#183CE6] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl" style={{fontVariationSettings: "'FILL' 1"}}>pending_actions</span>
          </div>
          <h3 className="text-xl font-bold text-blue-900 mb-2">Yükleme Başarılı!</h3>
          <p className="text-[#183CE6] mb-6 font-medium">
            {uploadSuccess.message}
          </p>
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm text-sm font-bold text-blue-700">
            Yönetici onayladıktan sonra puanlarınız eklenecek.
          </div>
          <button
             onClick={() => {
               setUploadSuccess(null);
               setSelectedFile(null);
             }}
             className="mt-8 text-sm font-semibold text-blue-700 hover:underline"
          >
             Yeni bir dosya yükle
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-[24px] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200
              ${dragActive ? 'border-[#183CE6] bg-blue-50/50 scale-[1.02]' : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'}
            `}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".xlsx" 
              hidden 
              onChange={handleChange}
            />
            
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors
              ${dragActive ? 'bg-blue-100 text-[#183CE6]' : 'bg-white text-gray-400 shadow-sm'}
            `}>
              <UploadCloud className="w-8 h-8" />
            </div>
            
            <h3 className="font-bold text-gray-900 mb-1">Dosyayı buraya sürükleyin</h3>
            <p className="text-sm text-gray-500">veya seçmek için tıklayın (.xlsx)</p>
          </div>

          {selectedFile && (
            <div className="bg-white border border-blue-100 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <File className="w-5 h-5" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-bold text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFile(null)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full h-14 bg-[#183CE6] hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isUploading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Yükleniyor...
                </>
              ) : (
                'Yükle ve Puan Kazan'
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
