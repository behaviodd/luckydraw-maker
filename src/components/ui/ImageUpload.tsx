/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const onDrop = useCallback(
    (files: File[]) => {
      const file = files[0];
      if (!file) return;
      setPreview(URL.createObjectURL(file));
      onChange(file);
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
  };

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative w-16 h-16 cursor-pointer transition-all',
        cn('overflow-hidden border-3 border-gum-black',
            isDragActive
              ? 'shadow-brutal-pink bg-gum-pink/10'
              : 'shadow-brutal-sm bg-bg-subtle hover:shadow-brutal'),
        className
      )}
    >
      <input {...getInputProps()} />
      {preview ? (
        <>
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gum-coral flex items-center justify-center z-10 border-2 border-gum-black"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {isDragActive ? (
            <Upload className="w-5 h-5 text-gum-pink" />
          ) : (
            <ImageIcon className="w-5 h-5 text-text-muted" />
          )}
        </div>
      )}
    </div>
  );
}
