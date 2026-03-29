import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Создание бакета при запуске
const bucketName = 'make-822d5729-music';
const initStorage = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, { public: false });
    console.log('Music bucket created');
  }
};
initStorage();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-822d5729/health", (c) => {
  return c.json({ status: "ok" });
});

// Загрузка трека
app.post("/make-server-822d5729/tracks", async (c) => {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const coverFile = formData.get('cover') as File | null;
    const name = formData.get('name') as string;
    const artist = formData.get('artist') as string;
    const duration = formData.get('duration') as string;

    if (!audioFile || !name || !artist || !duration) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const trackId = Date.now().toString();

    // Загрузка аудиофайла
    const audioFileName = `${trackId}_${audioFile.name}`;
    const audioBuffer = await audioFile.arrayBuffer();
    const { error: audioError } = await supabase.storage
      .from(bucketName)
      .upload(`audio/${audioFileName}`, audioBuffer, {
        contentType: audioFile.type,
      });

    if (audioError) {
      console.error('Audio upload error:', audioError);
      return c.json({ error: 'Failed to upload audio file' }, 500);
    }

    // Загрузка обложки (если есть)
    let coverPath = null;
    if (coverFile) {
      const coverFileName = `${trackId}_cover.${coverFile.name.split('.').pop()}`;
      const coverBuffer = await coverFile.arrayBuffer();
      const { error: coverError } = await supabase.storage
        .from(bucketName)
        .upload(`covers/${coverFileName}`, coverBuffer, {
          contentType: coverFile.type,
        });

      if (!coverError) {
        coverPath = `covers/${coverFileName}`;
      }
    }

    // Сохранение метаданных в KV
    const trackData = {
      id: trackId,
      name,
      artist,
      duration,
      audioPath: `audio/${audioFileName}`,
      coverPath,
      fileName: audioFile.name,
      fileType: audioFile.type,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`track:${trackId}`, trackData);

    return c.json({ success: true, track: trackData });
  } catch (error) {
    console.error('Upload track error:', error);
    return c.json({ error: 'Failed to upload track' }, 500);
  }
});

// Получение всех треков
app.get("/make-server-822d5729/tracks", async (c) => {
  try {
    const tracks = await kv.getByPrefix('track:');
    
    // Получаем signed URLs для всех файлов
    const tracksWithUrls = await Promise.all(
      tracks.map(async (track: any) => {
        const { data: audioUrl } = await supabase.storage
          .from(bucketName)
          .createSignedUrl(track.audioPath, 3600); // 1 час

        let coverUrl = null;
        if (track.coverPath) {
          const { data: cover } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(track.coverPath, 3600);
          coverUrl = cover?.signedUrl || null;
        }

        return {
          ...track,
          audioUrl: audioUrl?.signedUrl || null,
          coverUrl,
        };
      })
    );

    return c.json({ tracks: tracksWithUrls });
  } catch (error) {
    console.error('Get tracks error:', error);
    return c.json({ error: 'Failed to get tracks' }, 500);
  }
});

// Обновление трека
app.put("/make-server-822d5729/tracks/:id", async (c) => {
  try {
    const trackId = c.req.param('id');
    const { name, artist } = await c.req.json();

    const existingTrack = await kv.get(`track:${trackId}`);
    if (!existingTrack) {
      return c.json({ error: 'Track not found' }, 404);
    }

    const updatedTrack = {
      ...existingTrack,
      name,
      artist,
    };

    await kv.set(`track:${trackId}`, updatedTrack);

    return c.json({ success: true, track: updatedTrack });
  } catch (error) {
    console.error('Update track error:', error);
    return c.json({ error: 'Failed to update track' }, 500);
  }
});

// Добавление обложки к треку
app.post("/make-server-822d5729/tracks/:id/cover", async (c) => {
  try {
    const trackId = c.req.param('id');
    const formData = await c.req.formData();
    const coverFile = formData.get('cover') as File;

    if (!coverFile) {
      return c.json({ error: 'Cover file is required' }, 400);
    }

    const existingTrack = await kv.get(`track:${trackId}`);
    if (!existingTrack) {
      return c.json({ error: 'Track not found' }, 404);
    }

    // Удаляем старую обложку, если есть
    if (existingTrack.coverPath) {
      await supabase.storage.from(bucketName).remove([existingTrack.coverPath]);
    }

    // Загружаем новую обложку
    const coverFileName = `${trackId}_cover.${coverFile.name.split('.').pop()}`;
    const coverBuffer = await coverFile.arrayBuffer();
    const { error: coverError } = await supabase.storage
      .from(bucketName)
      .upload(`covers/${coverFileName}`, coverBuffer, {
        contentType: coverFile.type,
        upsert: true,
      });

    if (coverError) {
      console.error('Cover upload error:', coverError);
      return c.json({ error: 'Failed to upload cover' }, 500);
    }

    const updatedTrack = {
      ...existingTrack,
      coverPath: `covers/${coverFileName}`,
    };

    await kv.set(`track:${trackId}`, updatedTrack);

    // Получаем signed URL для обложки
    const { data: coverUrl } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(`covers/${coverFileName}`, 3600);

    return c.json({ success: true, coverUrl: coverUrl?.signedUrl });
  } catch (error) {
    console.error('Add cover error:', error);
    return c.json({ error: 'Failed to add cover' }, 500);
  }
});

// Удаление трека
app.delete("/make-server-822d5729/tracks/:id", async (c) => {
  try {
    const trackId = c.req.param('id');

    const existingTrack = await kv.get(`track:${trackId}`);
    if (!existingTrack) {
      return c.json({ error: 'Track not found' }, 404);
    }

    // Удаляем файлы из storage
    const filesToDelete = [existingTrack.audioPath];
    if (existingTrack.coverPath) {
      filesToDelete.push(existingTrack.coverPath);
    }

    await supabase.storage.from(bucketName).remove(filesToDelete);

    // Удаляем метаданные из KV
    await kv.del(`track:${trackId}`);

    return c.json({ success: true });
  } catch (error) {
    console.error('Delete track error:', error);
    return c.json({ error: 'Failed to delete track' }, 500);
  }
});

Deno.serve(app.fetch);