
import React, { useRef, useState } from 'react';
import { UploadIcon, SparklesIcon } from './Icons';
import { Language } from '../types';

interface Props {
  onImageSelected: (file: File) => void;
  isAnalyzing: boolean;
  language: Language;
}

export const UploadZone: React.FC<Props> = ({ onImageSelected, isAnalyzing, language }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const isZh = language === 'zh';

  const t = {
    analyzing: isZh ? "正在咨询地图..." : "Consulting the maps...",
    clickToChange: isZh ? "点击更换" : "Click to change",
    dropHere: isZh ? "把它放这！" : "Drop it here!",
    uploadTitle: isZh ? "上传一张风景照" : "Upload a landscape photo",
    uploadSubtitle: isZh ? "我们将为您寻找世界各地相似的角落" : "We'll find similar places around the world",
    ready: isZh ? "AI 准备就绪" : "AI ready to analyze"
  };

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelected(file);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        onClick={isAnalyzing ? undefined : handleClick}
        onDragOver={isAnalyzing ? undefined : onDragOver}
        onDragLeave={isAnalyzing ? undefined : onDragLeave}
        onDrop={isAnalyzing ? undefined : onDrop}
        className={`
          relative flex flex-col items-center justify-center w-full h-64 sm:h-80
          rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden
          ${isDragging 
            ? 'border-emerald-500 bg-emerald-50 scale-102 shadow-xl' 
            : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-slate-50'
          }
          ${isAnalyzing ? 'cursor-wait opacity-80' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => e.target.files && handleFile(e.target.files[0])}
          disabled={isAnalyzing}
        />

        {preview ? (
          <div className="relative w-full h-full">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="font-medium animate-pulse">{t.analyzing}</p>
              </div>
            )}
            {!isAnalyzing && (
               <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur text-xs font-semibold px-3 py-1 rounded-full shadow-lg text-slate-700">
                 {t.clickToChange}
               </div>
            )}
          </div>
        ) : (
          <div className="text-center p-6 space-y-4">
            <div className={`p-4 rounded-full bg-slate-100 inline-flex items-center justify-center transition-transform duration-300 ${isDragging ? 'scale-110 bg-emerald-100 text-emerald-600' : 'text-slate-400'}`}>
              <UploadIcon className="w-8 h-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-700">
                {isDragging ? t.dropHere : t.uploadTitle}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {t.uploadSubtitle}
              </p>
            </div>
          </div>
        )}
      </div>

      {preview && !isAnalyzing && (
        <div className="mt-6 flex justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-500">
                <SparklesIcon className="w-4 h-4 text-emerald-500" />
                <span>{t.ready}</span>
            </div>
        </div>
      )}
    </div>
  );
};
