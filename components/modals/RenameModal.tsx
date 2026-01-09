import React, { useState } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';

interface RenameModalProps {
  item: { id: string; title: string };
  onClose: () => void;
  onRename: (itemId: string, newTitle: string) => void;
  t: (key: TranslationKey) => string;
  titleKey: TranslationKey;
}

const RenameModal: React.FC<RenameModalProps> = ({ item, onClose, onRename, t, titleKey }) => {
  const [newTitle, setNewTitle] = useState(item.title);

  const handleConfirm = () => {
    if (newTitle.trim()) {
      onRename(item.id, newTitle.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="shadow-2xl rounded-xl max-w-sm w-full p-6 bg-white dark:bg-neutral-800">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">{t(titleKey)}</h3>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-2 rounded-lg focus:ring-1 focus:ring-blue-500 focus:outline-none bg-slate-100 dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-6"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-xs transition-colors rounded-lg bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600">{t('cancel')}</button>
          <button onClick={handleConfirm} className="px-4 py-2 font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-lg">{t('rename')}</button>
        </div>
      </div>
    </div>
  );
};

export default RenameModal;