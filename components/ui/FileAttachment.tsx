import React from 'react';
import Icon from '../Icon';

// Helper to get a suitable icon for a MIME type
const getIconForMimeType = (mimeType: string): string => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'volume-2';
    if (mimeType === 'application/pdf') return 'file-text';
    if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return 'file-zip';
    if (mimeType.includes('javascript') || mimeType.includes('json')) return 'file-json-2';
    if (mimeType.includes('html') || mimeType.includes('css') || mimeType.includes('xml')) return 'file-code-2';
    if (mimeType.startsWith('text/')) return 'file-text';
    return 'file';
};

// Helper to format file size
const formatBytes = (dataUrl: string): string => {
    if (!dataUrl.includes(';base64,')) return '';
    const base64 = dataUrl.split(',')[1];
    if (!base64) return '';
    const bytes = Math.ceil((base64.length * 3) / 4);
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

interface FileAttachmentProps {
  dataUrl: string;
  name: string;
  mimeType: string;
  onClear?: () => void;
}

const FileAttachment: React.FC<FileAttachmentProps> = ({ dataUrl, name, mimeType, onClear }) => {
  const isImage = mimeType.startsWith('image/');

  if (isImage) {
    // Render image preview. The presence of `onClear` distinguishes between
    // the input area (where it's present) and a chat message.
    
    // For the input area context:
    if (onClear) {
      return (
        <div className="relative group inline-block">
          <img src={dataUrl} alt={name} className="h-20 w-auto max-w-full object-contain rounded-lg bg-slate-200 dark:bg-neutral-900" />
          <button 
            onClick={(e) => { e.stopPropagation(); onClear(); }} 
            className="absolute -top-1.5 -right-1.5 rtl:-left-1.5 rtl:right-auto p-1 bg-gray-700 text-white rounded-full transition-opacity z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            title="Remove media"
          >
            <Icon name="x" className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // For the chat message context:
    return (
        <div className="relative max-w-[250px] sm:max-w-xs">
          <img src={dataUrl} alt={name} className="w-full h-auto object-contain rounded-lg bg-slate-200 dark:bg-neutral-900" />
        </div>
    );
  }

  // Fallback for non-image files
  const iconName = getIconForMimeType(mimeType);
  const fileSize = formatBytes(dataUrl);
  const containerClasses = "relative flex items-center gap-3 p-2 rounded-xl bg-slate-100 dark:bg-neutral-700/50 max-w-xs";

  return (
    <div className={containerClasses}>
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-slate-200 dark:bg-neutral-600 rounded-lg">
        <Icon name={iconName} className="w-6 h-6 text-gray-500 dark:text-gray-300" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{fileSize}</p>
      </div>
      {onClear && (
        <button onClick={(e) => { e.stopPropagation(); onClear(); }} className="p-1 text-gray-500 dark:text-gray-400 rounded-full hover:bg-slate-300 dark:hover:bg-neutral-500 z-10" title="Remove media">
          <Icon name="x" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default FileAttachment;