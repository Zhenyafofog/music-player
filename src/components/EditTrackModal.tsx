import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface EditTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: {
    id: string;
    name: string;
    artist: string;
  } | null;
  onSave: (trackId: string, name: string, artist: string) => void;
}

export function EditTrackModal({ isOpen, onClose, track, onSave }: EditTrackModalProps) {
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');

  useEffect(() => {
    if (track) {
      setName(track.name);
      setArtist(track.artist);
    }
  }, [track]);

  const handleSave = () => {
    if (track && name.trim()) {
      onSave(track.id, name.trim(), artist.trim() || 'Неизвестный исполнитель');
      onClose();
    }
  };

  if (!isOpen || !track) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Изменить трек</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="track-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Название трека
            </label>
            <input
              id="track-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите название трека"
            />
          </div>

          <div>
            <label htmlFor="track-artist" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Исполнитель
            </label>
            <input
              id="track-artist"
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите имя исполнителя"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}