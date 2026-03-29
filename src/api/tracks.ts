import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-822d5729`;

interface Track {
  id: string;
  name: string;
  artist: string;
  duration: string;
  audio_url: string;
  coverUrl?: string;
}

// Загрузка трека на сервер
export async function uploadTrack(
  audioFile: File,
  name: string,
  artist: string,
  duration: string,
  coverFile?: File | null
): Promise<Track> {
  const formData = new FormData();
  formData.append('audio', audioFile);
  formData.append('name', name);
  formData.append('artist', artist);
  formData.append('duration', duration);
  
  if (coverFile) {
    formData.append('cover', coverFile);
  }

  const response = await fetch(`${API_URL}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload track');
  }

  const data = await response.json();
  return data.track;
}

// Получение всех треков
export async function getTracks(): Promise<Track[]> {
  const response = await fetch(`${API_URL}/tracks`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get tracks');
  }

  const data = await response.json();
  return data.tracks;
}

// Обновление трека
export async function updateTrack(
  trackId: string,
  name: string,
  artist: string
): Promise<void> {
  const response = await fetch(`${API_URL}/tracks/${trackId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, artist }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update track');
  }
}

// Добавление обложки к треку
export async function addCoverToTrack(
  trackId: string,
  coverFile: File
): Promise<string> {
  const formData = new FormData();
  formData.append('cover', coverFile);

  const response = await fetch(`${API_URL}/tracks/${trackId}/cover`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add cover');
  }

  const data = await response.json();
  return data.coverUrl;
}

// Удаление трека
export async function deleteTrack(trackId: string): Promise<void> {
  const response = await fetch(`${API_URL}/tracks/${trackId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${publicAnonKey}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete track');
  }
}
