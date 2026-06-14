import { useState, useRef, useEffect } from 'react';
import { Upload, Settings, Music, Heart, Loader2 } from 'lucide-react'; // Добавили Loader2 для анимации загрузки
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
  const [isLoading, setIsLoading] = useState(true); // НОВОЕ: состояние загрузки (изначально true)
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
  
  const [activeTab, setActiveTab] = useState<'all' | 'playlists'>('all');
  const [playlistTrackIds, setPlaylistTrackIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('playlistTrackIds');
    return saved ? JSON.parse(saved) : [];
  });

  const [playedIndices, setPlayedIndices] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverTrackId, setCoverTrackId] = useState<string | null>(null);

  const [user, setUser] = useState<string | null>(
    localStorage.getItem("user")
  );

  const login = () => {
    const email = prompt("Введите email");
    if (!email) return;

    localStorage.setItem("user", email);
    setUser(email);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      setIsLoading(true); // Включаем лоадер перед запросом
      const data = await api.getTracks();
      setTracks(data);
    } catch (err) {
      console.error(err);
      toast.error('Ошибка загрузки треков');
    } finally {
      setIsLoading(false); // Выключаем лоадер в любом случае (успех или ошибка)
    }
  };

  useEffect(() => {
    localStorage.setItem('isDarkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('isShuffle', JSON.stringify(isShuffle));
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem('playlistTrackIds', JSON.stringify(playlistTrackIds));
  }, [playlistTrackIds]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleAddToPlaylist = (trackId: string) => {
    if (playlistTrackIds.includes(trackId)) {
      toast.error('Трек уже есть в плейлисте');
      return;
    }
    setPlaylistTrackIds(prev => [...prev, trackId]);
    toast.success('Добавлено в плейлист');
  };

  const handleRemoveFromPlaylist = (trackId: string) => {
    setPlaylistTrackIds(prev => prev.filter(id => id !== trackId));
    toast.success('Удалено из плейлиста');
  };

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

  const displayedTracks = activeTab === 'all' 
    ? tracks 
    : tracks.filter(track => playlistTrackIds.includes(track.id));

  const handlePlayTrack = (trackId: string) => {
    const globalIndex = tracks.findIndex(t => t.id === trackId);
    
    if (currentTrack?.id === trackId) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrackIndex(globalIndex);
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
      setPlaylistTrackIds(prev => prev.filter(id => id !== trackId));

      toast.success('Трек удален');
    } catch (err) {
      console.error(err);
      toast.error('Ошибка удаления трека');
    }
  };

  const currentTrack = currentTrackIndex !== null ? tracks[currentTrackIndex] : null;

  if (!user) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--background)",
          color: "var(--text-color)",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>Введите email</h2>

        <input
          type="email"
          placeholder="example@mail.com"
          id="emailInput"
          style={{
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid gray",
            marginBottom: "15px",
            width: "250px",
          }}
        />

        <button
          onClick={() => {
            const input = document.getElementById("emailInput") as HTMLInputElement;
            const email = input.value;
            if (!email) return;

            localStorage.setItem("user", email);
            setUser(email);
          }}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Войти
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-32">
      <Toaster position="top-center" />
    
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

      <div className="max-w-7xl mx-auto px-6 mt-6">
        <div className="flex justify-center border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Music className="w-4 h-4" />
              Все треки
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-all ${
                activeTab === 'playlists'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              Плейлисты
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* ИЗМЕНЕННАЯ ЛОГИКА ОТОБРАЖЕНИЯ (КОНТЕНТ / ЗАГРУЗКА / ПУСТОЙ ЭКРАН) */}
        {isLoading ? (
          // Экран загрузки (показывается только во время fetch-запроса к API)
          <div className="text-center py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Загружаю композиции...
            </h2>
          </div>
        ) : displayedTracks.length === 0 ? (
          // Пустой экран (показывается только если isLoading завершился, а треков реально 0)
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'all' ? <Upload className="w-10 h-10 text-gray-400" /> : <Heart className="w-10 h-10 text-gray-400" />}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {activeTab === 'all' ? 'Нет загруженных треков' : 'Плейлист пуст'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {activeTab === 'all' 
                ? 'Загрузите музыку, чтобы начать прослушивание' 
                : 'Добавьте треки в плейлист через меню трека (три точки)'}
            </p>
            {activeTab === 'all' && (
              <label
                htmlFor="file-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition-colors"
              >
                <Upload className="w-5 h-5" />
                Загрузить музыку
              </label>
            )}
          </div>
        ) : (
          // Сам список треков
          <div className="space-y-2">
            {displayedTracks.map((track) => {
              const globalIndex = tracks.findIndex(t => t.id === track.id);
              return (
                <TrackItem
                  key={track.id}
                  track={track}
                  isPlaying={currentTrackIndex === globalIndex && isPlaying}
                  onPlay={() => handlePlayTrack(track.id)}
                  onEdit={() => handleEditTrack(track)}
                  onAddCover={() => handleAddCover(track.id)}
                  onDelete={() => handleDeleteTrack(track.id)}
                  isInPlaylist={playlistTrackIds.includes(track.id)}
                  currentTab={activeTab}
                  onAddToPlaylist={() => handleAddToPlaylist(track.id)}
                  onRemoveFromPlaylist={() => handleRemoveFromPlaylist(track.id)}
                />
              );
            })}
          </div>
        )}
      </main>

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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onSignOut={logout} 
      />

      <EditTrackModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        track={editingTrack}
        onSave={handleSaveTrack}
      />

      <CoverViewModal
        isOpen={isCoverViewOpen}
        onClose={() => setIsCoverViewOpen(false)}
        coverUrl={currentTrack?.coverUrl}
        trackName={currentTrack?.name || ''}
      />

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