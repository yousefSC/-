import React from 'react';
import { TranslationKey } from '../../types';
import Icon from '../Icon';
import Tooltip from '../ui/Tooltip';

interface ConfirmationModalProps {
  title?: string;
  message: string;
  icon?: string;
  onConfirm: () => void;
  onCancel: () => void;
  t: (key: TranslationKey) => string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonVariant?: 'primary' | 'destructive';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  title, 
  message, 
  icon, 
  onConfirm, 
  onCancel, 
  t, 
  confirmButtonText, 
  cancelButtonText, 
  confirmButtonVariant = 'primary' 
}) => {
  
  const isDestructive = confirmButtonVariant === 'destructive';

  const confirmButtonClasses = isDestructive
    ? "bg-red-600 md:hover:bg-red-700 focus:ring-red-500/50"
    : "bg-blue-600 md:hover:bg-blue-700 focus:ring-blue-500/50";

  const iconContainerClasses = isDestructive
    ? "bg-red-100 dark:bg-red-900/40"
    : "bg-blue-100 dark:bg-blue-900/40";
    
  const iconClasses = isDestructive
    ? "text-red-600 dark:text-red-400"
    : "text-blue-600 dark:text-blue-400";
  
  const getConfirmIconName = () => {
      if (isDestructive || icon === 'trash-2' || icon === 'shield-alert') {
          return 'trash-2';
      }
      if (icon === 'log-out') {
          return 'log-out';
      }
      return 'check';
  };
  
  const confirmIconName = getConfirmIconName();


  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative max-w-sm w-full animate-pop-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {icon && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${iconContainerClasses} ring-8 ring-white dark:ring-neutral-800`}>
                <Icon name={icon} className={`w-8 h-8 ${iconClasses}`} />
              </div>
            </div>
        )}
        <div className="shadow-2xl pt-12 p-6 rounded-2xl bg-white dark:bg-neutral-800 text-center">
          <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{title || t('confirmAction')}</h3>
          <p className="text-sm mb-6 text-gray-600 dark:text-gray-300">{message}</p>
          <div className="flex flex-row-reverse justify-center gap-4">
            <Tooltip text={confirmButtonText || t('confirm')}>
              <button 
                onClick={onConfirm} 
                className={`w-16 h-16 flex items-center justify-center font-bold text-sm ${confirmButtonClasses} text-white transition-transform transform hover:scale-105 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-neutral-800`}
              >
                <Icon name={confirmIconName} className="w-7 h-7" />
              </button>
            </Tooltip>
            {cancelButtonText !== '' && (
              <Tooltip text={cancelButtonText || t('cancel')}>
                <button 
                  onClick={onCancel}
                  className="w-16 h-16 flex items-center justify-center font-bold text-sm transition-colors rounded-full bg-slate-200 dark:bg-neutral-700 text-gray-800 dark:text-gray-200 md:hover:bg-slate-300 md:dark:hover:bg-neutral-600"
                >
                  <Icon name="x" className="w-7 h-7" />
                </button>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;