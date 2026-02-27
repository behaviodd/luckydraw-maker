import imageCompression from 'browser-image-compression';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'draw-images';

export class BucketNotFoundError extends Error {
  constructor() {
    super(
      'Storage 버킷이 없습니다. Supabase 대시보드 → Storage → New bucket → 이름: "draw-images", Public 체크 후 생성해주세요.'
    );
    this.name = 'BucketNotFoundError';
  }
}

export async function compressAndUpload(
  file: File,
  userId: string,
  supabase: SupabaseClient
): Promise<string> {
  const needsCompression = file.size > 2 * 1024 * 1024;
  let processedFile: File | Blob = file;

  if (needsCompression) {
    processedFile = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: 'image/webp',
    });
  }

  const filename = `${userId}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, processedFile, { upsert: true });

  if (error) {
    if (error.message?.toLowerCase().includes('not found') || error.message?.toLowerCase().includes('bucket')) {
      throw new BucketNotFoundError();
    }
    throw error;
  }

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return data.publicUrl;
}
