import { useState, useRef, useEffect } from 'react';
import { Upload, Settings } from 'lucide-react';
import { TrackItem } from './components/TrackItem';
import { Player } from './components/Player';
import { SettingsModal } from './components/SettingsModal';
import { EditTrackModal } from './components/EditTrackModal';
import { CoverViewModal } from './components/CoverViewModal';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import * as api from './api/tracks';

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: string;
  audio_url: string;
  coverUrl?: string;
}

function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [isCoverViewOpen, setIsCoverViewOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('isDarkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [isShuffle, setIsShuffle] = useState(() => {
    const saved = localStorage.getItem('isShuffle');
    return saved ? JSON.parse(saved) : false;
  });
  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverTrackId, setCoverTrackId] = useState<string | null>(null);
  
  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const data = await api.getTracks();
      setTracks(data);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки треков');
    }
  };

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('isShuffle', JSON.stringify(isShuffle));
  }, [isShuffle]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (!file.type.startsWith('audio/')) {
      toast.error(`${file.name} не является аудиофайлом`);
      continue;
    }

    try {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;

      await new Promise((resolve) => {
        audio.addEventListener('loadedmetadata', resolve);
      });

      const duration = audio.duration;
      const mins = Math.floor(duration / 60);
      const secs = Math.floor(duration % 60);
      const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      URL.revokeObjectURL(url);

      // 🚀 ВАЖНО: используем API
      const newTrack = await api.uploadTrack(
        file,
        file.name.replace(/\.[^/.]+$/, ''),
        'Неизвестный исполнитель',
        durationStr
      );

      setTracks(prev => [newTrack, ...prev]);

      toast.success(`Трек "${file.name}" загружен`);
    } catch (err) {
      console.error(err);
      toast.error(`Ошибка загрузки ${file.name}`);
    }
  }

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};

  const handlePlayTrack = (index: number) => {
    if (currentTrackIndex === index) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    
    if (isShuffle) {
      const unplayedIndices = tracks
        .map((_, index) => index)
        .filter(index => !playedIndices.includes(index));
      
      if (unplayedIndices.length === 0) {
        const firstRandomIndex = Math.floor(Math.random() * tracks.length);
        setCurrentTrackIndex(firstRandomIndex);
        setPlayedIndices([firstRandomIndex]);
        setIsPlaying(true);
      } else {
        const randomIndex = unplayedIndices[Math.floor(Math.random() * unplayedIndices.length)];
        setCurrentTrackIndex(randomIndex);
        setPlayedIndices([...playedIndices, randomIndex]);
        setIsPlaying(true);
      }
    } else {
      const nextIndex = currentTrackIndex !== null 
        ? (currentTrackIndex + 1) % tracks.length 
        : 0;
      setCurrentTrackIndex(nextIndex);
      setIsPlaying(true);
    }
  };

  const handlePrevious = () => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex !== null 
      ? (currentTrackIndex - 1 + tracks.length) % tracks.length 
      : tracks.length - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const handleEditTrack = (track: Track) => {
    setEditingTrack(track);
    setIsEditModalOpen(true);
  };

  const handleSaveTrack = async (trackId: string, name: string, artist: string) => {
    try {
      await api.updateTrack(trackId, name, artist);

      setTracks(prevTracks =>
        prevTracks.map(track =>
          track.id === trackId ? { ...track, name, artist } : track
        )
      );

     toast.success('Трек обновлен');
    } catch (error) {
      toast.error('Ошибка при обновлении');
    }
  };

  const handleAddCover = (trackId: string) => {
    setCoverTrackId(trackId);
    if (coverInputRef.current) {
      coverInputRef.current.click();
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !coverTrackId) return;

    const file = files[0];

    try {
      const coverUrl = await api.addCoverToTrack(coverTrackId, file);

      setTracks(prevTracks =>
        prevTracks.map(track =>
          track.id === coverTrackId ? { ...track, coverUrl } : track
        )
      );

      toast.success('Обложка добавлена');
    } catch {
      toast.error('Ошибка загрузки обложки');
    }
  };

  const handleDeleteTrack = async (trackId: string) => {
    try {
      await api.deleteTrack(trackId);

      const trackIndex = tracks.findIndex(track => track.id === trackId);

      if (currentTrackIndex === trackIndex) {
        setIsPlaying(false);
        setCurrentTrackIndex(null);
      } else if (currentTrackIndex !== null && trackIndex < currentTrackIndex) {
        setCurrentTrackIndex(currentTrackIndex - 1);
      } 

      setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));

      toast.success('Трек удален');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка удаления трека');
    }
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <Toaster position="top-center" />
      
      {/* Шапка */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Музыкальный плеер</h1>
            
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                Загрузить музыку
              </label>
              
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Настройки"
              >
                <Settings className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Список треков */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {tracks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Нет загруженных треков
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Загрузите музыку, чтобы начать прослушивание
            </p>
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              Загрузить музыку
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            {tracks.map((track, index) => (
              <TrackItem
                key={track.id}
                track={track}
                isPlaying={currentTrackIndex === index && isPlaying}
                onPlay={() => handlePlayTrack(index)}
                onEdit={() => handleEditTrack(track)}
                onAddCover={() => handleAddCover(track.id)}
                onDelete={() => handleDeleteTrack(track.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Плеер */}
      <Player
        track={currentTrack}
        isPlaying={isPlaying}
        isShuffle={isShuffle}
        onPlayPause={handlePlayPause}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        onCoverClick={() => setIsCoverViewOpen(true)}
      />

      {/* Модальное окно настроек */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Модальное окно редактирования трека */}
      <EditTrackModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        track={editingTrack}
        onSave={handleSaveTrack}
      />

      {/* Модальное окно просмотра обложки */}
      <CoverViewModal
        isOpen={isCoverViewOpen}
        onClose={() => setIsCoverViewOpen(false)}
        coverUrl={currentTrack?.coverUrl}
        trackName={currentTrack?.name || ''}
      />

      {/* Скрытый input для загрузки обложек */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverUpload}
        className="hidden"
        id="cover-upload"
      />
    </div>
  );
}

export default App;