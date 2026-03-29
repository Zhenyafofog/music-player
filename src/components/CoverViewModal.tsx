import { X } from 'lucide-react';

interface CoverViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverUrl: string | undefined;
  trackName: string;
}

export function CoverViewModal({ isOpen, onClose, coverUrl, trackName }: CoverViewModalProps) {
  if (!isOpen || !coverUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        <img 
          src={coverUrl} 
          alt={trackName}
          className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
        
        <div className="mt-4 text-center">
          <p className="text-white text-lg font-medium">{trackName}</p>
        </div>
      </div>
    </div>
  );
}
