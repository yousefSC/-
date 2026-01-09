
import React from 'react';
import Icon from '../Icon';

interface ImageViewerModalProps {
  imageUrl: string;
  onClose: () => void;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ imageUrl, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="relative w-auto h-auto max-w-[95vw] max-h-[95vh]"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on image
      >
        <img src={imageUrl} alt="Zoomed view" className="block w-auto h-auto max-w-full max-h-full object-contain shadow-2xl" />
      </div>
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 rtl:right-auto rtl:left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        aria-label="Close image viewer"
      >
        <Icon name="x" className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ImageViewerModal;
