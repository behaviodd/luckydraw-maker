import imageCompression from 'browser-image-compression';
import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'draw-images';
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
  // MIME 타입 검증
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('허용되지 않는 파일 형식입니다. PNG, JPG, WebP, GIF만 업로드 가능합니다.');
  }

  // 파일 크기 제한 (압축 전)
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('파일 크기가 10MB를 초과합니다.');
  }

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
