import React, { useRef, useState, useEffect } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';

interface MediaAttachmentSheetProps {
  onClose: () => void;
  onSelect: (dataUrl: string, name: string) => void;
  onOpenCamera: () => void;
  t: (key: TranslationKey) => string;
  onDrawOnProject?: () => void;
  onInspectCode?: () => void;
}

const ActionItem: React.FC<{ icon: string; label: string; onClick: () => void; disabled?: boolean }> = ({ icon, label, onClick, disabled = false }) => (
    <button 
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center text-center p-3 w-28 h-28 transition-colors duration-200 ease-in-out rounded-2xl bg-slate-200 dark:bg-neutral-700/60 
        ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-slate-300 dark:hover:bg-neutral-700'
        }`}
    >
        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/50 dark:bg-black/20 mb-2">
            <Icon name={icon} className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </div>
        <span className="font-semibold text-xs text-gray-700 dark:text-gray-300">{label}</span>
    </button>
);

const MediaAttachmentSheet: React.FC<MediaAttachmentSheetProps> = ({ onClose, onSelect, onOpenCamera, t, onDrawOnProject, onInspectCode }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef<number | null>(null);
  const [isAppsExpanded, setIsAppsExpanded] = useState(false); // Collapsed by default
  const [fileAccessAllowed, setFileAccessAllowed] = useState(true); // On by default

  const handleClose = () => {
    setIsClosing(true);
    timerRef.current = window.setTimeout(() => {
        onClose();
    }, 300); // Animation duration
  };

  useEffect(() => {
    return () => {
        if(timerRef.current) {
            clearTimeout(timerRef.current);
        }
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onSelect(event.target?.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
        className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center animate-fade-in"
        onClick={handleClose}
        aria-modal="true"
        role="dialog"
    >
        <div
            className={`w-full bg-slate-100 dark:bg-neutral-800 shadow-2xl ${isClosing ? 'animate-slide-down-to-bottom' : 'animate-slide-up-from-bottom'}`}
            style={{ borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 pt-2">
                 <div className="w-10 h-1.5 bg-slate-300 dark:bg-neutral-600 rounded-full mx-auto mb-4"></div>
                <div className="flex justify-center items-center gap-4">
                    <ActionItem 
                        icon="image" 
                        label={t('selectImage')} 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={!fileAccessAllowed}
                    />
                    <ActionItem 
                        icon="camera" 
                        label={t('captureImage')} 
                        onClick={onOpenCamera} 
                    />
                    <ActionItem 
                        icon="file" 
                        label={t('selectFile')} 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={!fileAccessAllowed}
                    />
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-neutral-700/50">
                    <button 
                        onClick={() => setIsAppsExpanded(prev => !prev)}
                        className="w-full flex justify-between items-center p-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-slate-200 dark:hover:bg-neutral-700/60 rounded-lg transition-colors"
                    >
                        <span>التطبيقات المتصله</span>
                        <Icon name={isAppsExpanded ? "chevron-up" : "chevron-down"} className="w-4 h-4 transition-transform" />
                    </button>
                    <div className={`grid transition-all duration-300 ease-in-out ${isAppsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="mt-2 p-3 space-y-2 bg-slate-200/50 dark:bg-neutral-700/30 rounded-xl">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white/50 dark:bg-black/20 rounded-lg">
                                            <Icon name="folder-open" className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">الوصول إلى ملفات الجهاز</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">السماح للتطبيق بالوصول إلى الصور والملفات لإرفاقها.</p>
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0 mt-1">
                                        <input
                                            type="checkbox"
                                            id="file-access-toggle"
                                            className="toggle-switch-input"
                                            checked={fileAccessAllowed}
                                            onChange={(e) => setFileAccessAllowed(e.target.checked)}
                                        />
                                        <label htmlFor="file-access-toggle" className="toggle-switch-label"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
        </div>
    </div>
  );
};

export default MediaAttachmentSheet;