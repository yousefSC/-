
import React, { useState } from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';

interface Option {
  value: string;
  label: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedValue: string) => void;
  options: Option[];
  initialValue: string;
  title: string;
  t: (key: TranslationKey) => string;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ isOpen, onClose, onConfirm, options, initialValue, title, t }) => {
  const [selectedValue, setSelectedValue] = useState(initialValue);

  if (!isOpen) return null;

  const handleConfirmClick = () => {
    onConfirm(selectedValue);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="shadow-2xl max-w-sm w-full p-4 rounded-2xl bg-white dark:bg-neutral-800 flex flex-col max-h-[80vh]">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100 px-2 flex-shrink-0">{title}</h3>
        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2">
          <ul className="space-y-1">
            {options.map(option => (
              <li key={option.value}>
                <button
                  onClick={() => setSelectedValue(option.value)}
                  className={`w-full flex items-center text-start rtl:text-right gap-3 px-3 py-3 rounded-xl transition-colors ${selectedValue === option.value ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-100 dark:hover:bg-neutral-700/60'}`}
                >
                  <div className={`w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${selectedValue === option.value ? 'border-blue-600 bg-blue-600' : 'border-gray-400 dark:border-gray-500 bg-transparent'}`}>
                    {selectedValue === option.value && <Icon name="check" className="w-3 h-3 text-white animate-pop-in" />}
                  </div>
                  <span className={`flex-1 text-sm ${selectedValue === option.value ? 'font-semibold text-gray-800 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-neutral-700 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 font-bold text-sm transition-colors rounded-xl bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 hover:bg-slate-300 dark:hover:bg-neutral-600">{t('cancel')}</button>
          <button onClick={handleConfirmClick} className="px-4 py-2.5 font-bold text-sm bg-slate-900 hover:bg-slate-700 text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 transition-colors rounded-xl">{t('confirm')}</button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;