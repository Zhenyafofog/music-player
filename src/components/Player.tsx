import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Music } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface PlayerProps {
  track: {
    id: string;
    name: string;
    artist: string;
    audioUrl?: string;
    coverUrl?: string;
    file?: File;
  } | null;
  isPlaying: boolean;
  isShuffle: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCoverClick: () => void;
}

export function Player({ track, isPlaying, isShuffle, onPlayPause, onNext, onPrevious, onToggleShuffle, onCoverClick }: PlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  if (!track || !audioRef.current) return;
  
  // Явно проверяем, что file существует и это File
  if (track.file && track.file instanceof File) {
    const url = URL.createObjectURL(track.file as File); // Явное приведение типа
    audioRef.current.src = url;
    audioRef.current.volume = volume;
    audioRef.current.currentTime = 0;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Ошибка воспроизведения:', error);
          onPlayPause();
        });
      }
    }
    
    return () => {
      URL.revokeObjectURL(url);
    };
  } 
  else if (track.audioUrl) {
    audioRef.current.src = track.audioUrl;
    audioRef.current.volume = volume;
    audioRef.current.currentTime = 0;
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Ошибка воспроизведения:', error);
          onPlayPause();
        });
      }
    }
  } else {
    console.warn('Нет источника звука для трека:', track.name);
  }
}, [track?.id]); // Отслеживаем только изменение ID трека

useEffect(() => {
  if (audioRef.current && track) {
    // Проверяем, есть ли источник звука
    const hasSource = (track.file instanceof File) || track.audioUrl;
    
    if (!hasSource) {
      // Если нет источника, останавливаем
      if (isPlaying) {
        onPlayPause();
      }
      return;
    }
    
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Ошибка воспроизведения:', error);
          onPlayPause();
        });
      }
    } else {
      audioRef.current.pause();
    }
  }
}, [isPlaying, track]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!track) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={onNext}
      />
      
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center gap-6">
          {/* Обложка и информация о треке */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {track.coverUrl ? (
              <img 
                src={track.coverUrl} 
                alt={track.name}
                className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={onCoverClick}
              />
            ) : (
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                <Music className="w-8 h-8 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="font-medium text-gray-900 dark:text-white truncate">{track.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artist}</div>
            </div>
          </div>
          
          {/* Управление */}
          <div className="flex flex-col items-center gap-2 shrink-0 ml-40">
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleShuffle}
                className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ${
                  isShuffle ? 'text-blue-500' : 'text-gray-700 dark:text-gray-300'
                }`}
                aria-label="Случайный порядок"
              >
                <Shuffle className="w-5 h-5" />
              </button>
              
              <button
                onClick={onPrevious}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Предыдущий трек"
              >
                <SkipBack className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              
              <button
                onClick={onPlayPause}
                className="p-3 bg-blue-500 hover:bg-blue-600 rounded-full transition-colors"
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-white" fill="white" />
                ) : (
                  <Play className="w-6 h-6 text-white" fill="white" />
                )}
              </button>
              
              <button
                onClick={onNext}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Следующий трек"
              >
                <SkipForward className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            {/* Прогресс бар */}
            <div className="flex items-center gap-2 w-80 max-w-full">
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>
          
          {/* Громкость */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}