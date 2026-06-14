import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Play, Pause, Edit2, Image, Trash2, PlusCircle, MinusCircle } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: string;
  audio_url: string;
  coverUrl?: string;
}

interface TrackItemProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onEdit: () => void;
  onAddCover: () => void;
  onDelete: () => void;
  // Новые добавленные пропсы:
  isInPlaylist: boolean;
  currentTab: 'all' | 'playlists';
  onAddToPlaylist: () => void;
  onRemoveFromPlaylist: () => void;
}

export function TrackItem({
  track,
  isPlaying,
  onPlay,
  onEdit,
  onAddCover,
  onDelete,
  isInPlaylist,
  currentTab,
  onAddToPlaylist,
  onRemoveFromPlaylist
}: TrackItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне его области
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group`}>
      <div className="flex items-center gap-4 flex-1 min-w-0" onClick={onPlay}>
        {/* Блок Обложки / Иконки Play */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-blue-500/10 flex items-center justify-center flex-shrink-0 cursor-pointer">
          {track.coverUrl ? (
            <img src={track.coverUrl} alt={track.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold">
              🎵
            </div>
          )}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white fill-white" />}
          </div>
        </div>

        {/* Название и Исполнитель */}
        <div className="min-w-0 flex-1 cursor-pointer">
          <h4 className={`font-medium truncate ${isPlaying ? 'text-blue-500 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>{track.name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artist}</p>
        </div>
      </div>

      {/* Правая часть: Длительность и Троеточие */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">{track.duration}</span>
        
        {/* Выпадающее меню */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-20">
              
              {/* ДИНАМИЧЕСКАЯ КНОПКА ДЛЯ ПЛЕЙЛИСТА */}
              {currentTab === 'all' ? (
                <button
                  onClick={() => { onAddToPlaylist(); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-green-500" />
                  Добавить в плейлист
                </button>
              ) : (
                <button
                  onClick={() => { onRemoveFromPlaylist(); setIsMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <MinusCircle className="w-4 h-4" />
                  Убрать из плейлиста
                </button>
              )}

              <hr className="border-gray-100 dark:border-gray-700 my-1" />

              <button
                onClick={() => { onEdit(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Редактировать
              </button>
              <button
                onClick={() => { onAddCover(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Image className="w-4 h-4" />
                Изменить обложку
              </button>
              <button
                onClick={() => { onDelete(); setIsMenuOpen(false); }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Удалить трек
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}