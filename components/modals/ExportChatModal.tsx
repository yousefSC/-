import React from 'react';
import { ChatSession, TranslationKey } from '../../types';
import Icon from '../Icon';

interface ExportChatModalProps {
  session: ChatSession;
  onClose: () => void;
  t: (key: TranslationKey) => string;
}

const ExportChatModal: React.FC<ExportChatModalProps> = ({ session, onClose, t }) => {

  const sanitizeFilename = (name: string) => {
    return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  const handleExportJson = () => {
    const filename = `${sanitizeFilename(session.title)}.json`;
    const jsonString = JSON.stringify(session, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  const handleExportText = () => {
    const filename = `${sanitizeFilename(session.title)}.txt`;
    let textContent = `Chat Session: ${session.title}\n`;
    textContent += `Created At: ${new Date(session.createdAt).toLocaleString()}\n`;
    textContent += `Last Modified: ${new Date(session.lastModified).toLocaleString()}\n`;
    textContent += `\n------------------------------------\n\n`;

    session.messages.forEach(msg => {
      textContent += `${msg.sender === 'user' ? 'User' : 'AI'}: [${new Date(msg.timestamp).toLocaleString()}]\n`;
      textContent += `${msg.text}\n\n`;
      if (msg.attachment) {
        textContent += `[Attachment: ${msg.attachment.name}]\n\n`;
      }
      textContent += `---\n\n`;
    });

    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-sm w-full animate-pop-in bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{t('exportOptionsTitle')}</h3>
        <div className="space-y-3">
            <button
                onClick={handleExportJson}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-neutral-700/50 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
                <Icon name="file-json-2" className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('exportAsJson')}</span>
            </button>
            <button
                onClick={handleExportText}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-neutral-700/50 hover:bg-slate-200 dark:hover:bg-neutral-700 transition-colors"
            >
                <Icon name="file-text" className="w-5 h-5 text-green-500" />
                <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t('exportAsText')}</span>
            </button>
        </div>
        <div className="mt-6 flex justify-end">
            <button onClick={onClose} className="px-4 py-2 font-bold text-xs transition-colors rounded-lg bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600">
                {t('cancel')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ExportChatModal;
