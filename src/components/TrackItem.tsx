import { Music, MoreVertical, Edit, ImagePlus, Trash2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface TrackItemProps {
  track: {
    id: string;
    name: string;
    artist: string;
    duration: string;
    audioUrl?: string;  // Добавь ?
    coverUrl?: string;
    fileName?: string;  // Добавь ?
    fileType?: string;  // Добавь ?
    file?: File;        // Добавь для локальных файлов
  };
  isPlaying: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onAddCover: () => void;
  onDelete: () => void;
}

export function TrackItem({ track, isPlaying, onPlay, onEdit, onAddCover, onDelete }: TrackItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors ${
        isPlaying ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={onPlay}
    >
      {track.coverUrl ? (
        <img 
          src={track.coverUrl} 
          alt={track.name}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
          <Music className="w-6 h-6 text-white" />
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white truncate">{track.name}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artist}</div>
      </div>
      
      <div className="text-sm text-gray-500 dark:text-gray-400">{track.duration}</div>
      
      <div className="relative" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          aria-label="Меню"
        >
          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Edit className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Изменить</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onAddCover();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <ImagePlus className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              <span className="text-gray-900 dark:text-white">Добавить обложку</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-red-600 dark:text-red-400">Удалить</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}