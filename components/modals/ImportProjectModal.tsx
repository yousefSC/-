import React, { useState, useRef } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';
import Tooltip from '../ui/Tooltip';

interface ImportProjectModalProps {
  onClose: () => void;
  onImport: (code: string) => boolean; // Returns true on success, false on failure
  t: (key: TranslationKey) => string;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex-1 py-2 text-sm font-semibold border-b-2 transition-colors ${isActive ? 'border-blue-500 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'}`}
    >
        {label}
    </button>
);


const ImportProjectModal: React.FC<ImportProjectModalProps> = ({ onClose, onImport, t }) => {
  const [activeTab, setActiveTab] = useState<'code' | 'id'>('code');
  const [code, setCode] = useState('');
  const [projectId, setProjectId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
        let success = false;
        if (activeTab === 'code') {
            if (code.trim()) {
                success = onImport(code);
            }
        } else { // activeTab is 'id'
            if (projectId.trim()) {
                const projectDataString = localStorage.getItem(projectId.trim());
                if (projectDataString) {
                    success = onImport(projectDataString);
                } else {
                    setError(t('projectNotFound'));
                }
            }
        }

        if (!success && !error) {
            setError(t('importError'));
        }
        
        // onImport handles closing the modal on success
        if (!success) {
            setIsLoading(false);
        }
    }, 50);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleImport();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target?.result as string;
            setCode(fileContent);
            setError(null);
        };
        reader.onerror = () => {
            setError(t('importError'));
        };
        reader.readAsText(file);
    }
    if (e.target) {
        e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="shadow-2xl rounded-2xl max-w-lg w-full bg-slate-100 dark:bg-neutral-900 flex flex-col max-h-[90vh]">
        <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-800 flex-shrink-0">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Icon name="upload" className="w-5 h-5" />
                {t('importProject')}
            </h3>
            <Tooltip text={t('close')}>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full">
                  <Icon name="x" className="w-5 h-5 text-gray-500" />
              </button>
            </Tooltip>
        </header>
        <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            <div className="border-b border-slate-200 dark:border-neutral-800 mb-4">
              <div className="flex -mb-px">
                <TabButton label={t('importFromFile')} isActive={activeTab === 'code'} onClick={() => { setActiveTab('code'); setError(null); }} />
                <TabButton label={t('importById')} isActive={activeTab === 'id'} onClick={() => { setActiveTab('id'); setError(null); }} />
              </div>
            </div>

            {activeTab === 'code' ? (
              <div className="animate-fade-in">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('importProjectDesc')}</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".html,.js,.json,.txt,text/plain,text/html,text/javascript,application/json"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 text-sm font-semibold rounded-lg bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 hover:bg-slate-50 dark:hover:bg-neutral-700 transition-colors"
                >
                    <Icon name="file-up" className="w-4 h-4" />
                    <span>{t('importFromFile')}</span>
                </button>
                <div className="relative flex items-center my-3">
                    <div className="flex-grow border-t border-slate-300 dark:border-neutral-700"></div>
                    <span className="flex-shrink mx-4 text-xs text-gray-400 dark:text-gray-500 uppercase">OR</span>
                    <div className="flex-grow border-t border-slate-300 dark:border-neutral-700"></div>
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('pasteCodeHere')}
                    className="w-full h-48 p-3 rounded-lg font-mono text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 custom-scrollbar resize-y border border-slate-300 dark:border-neutral-700"
                    spellCheck="false"
                />
              </div>
            ) : (
              <div className="animate-fade-in">
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('importByIdDesc')}</p>
                 <input
                    type="text"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('enterProjectId')}
                    className="w-full p-3 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 border border-slate-300 dark:border-neutral-700"
                    autoFocus
                 />
              </div>
            )}
            
            {error && (
                <p className="mt-2 text-xs text-red-500 font-semibold animate-fade-in">{error}</p>
            )}
        </main>
        <footer className="p-3 border-t border-slate-200 dark:border-neutral-800 flex-shrink-0 flex justify-end">
             <button
                onClick={handleImport}
                disabled={isLoading || (activeTab === 'code' && !code.trim()) || (activeTab === 'id' && !projectId.trim())}
                className="px-4 py-2.5 w-full md:w-auto flex items-center justify-center gap-2 font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-200 dark:hover:bg-slate-300 dark:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
              >
                {isLoading ? (
                    <>
                    <span className="w-4 h-4 border-2 border-current/50 border-t-current rounded-full animate-spin"></span>
                    {t('importing')}
                    </>
                ) : (
                    <>
                    <Icon name="upload" className="w-4 h-4" />
                    {t('import')}
                    </>
                )}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ImportProjectModal;