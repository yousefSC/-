
import React from 'react';
import { Message, TranslationKey } from '../../types';
import Icon from '../Icon';

interface SourcesModalProps {
  message: Message;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

const SourcesModal: React.FC<SourcesModalProps> = ({ message, onClose, t }) => {
  const sources = message.groundingMetadata?.groundingChunks || [];

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-neutral-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-neutral-700 flex-shrink-0">
          <h3 className="font-bold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
            <Icon name="search" className="w-5 h-5 text-blue-500" />
            {t('viewSources')}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 dark:hover:bg-neutral-700 rounded-full">
            <Icon name="x" className="w-5 h-5 text-gray-500" />
          </button>
        </header>
        
        <main className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {sources.length > 0 ? (
            <ul className="space-y-3">
              {sources.filter(s => s.web.uri).map((source, index) => (
                  <li key={index}>
                    <a 
                      href={source.web.uri!} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-3 rounded-lg bg-slate-100 dark:bg-neutral-700/50 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors flex items-center gap-3"
                    >
                      <Icon name="globe" className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm text-blue-600 dark:text-blue-400 truncate">{source.web.title || source.web.uri}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{source.web.uri}</p>
                      </div>
                    </a>
                  </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                <Icon name="file-question" className="w-12 h-12 mb-3" />
                <p className="font-semibold">{t('noSourcesFound')}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SourcesModal;
