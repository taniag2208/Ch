'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, Image, Film, File } from 'lucide-react';
import { formatBytes } from '@/lib/portal-utils';
import type { PortalFile } from '@/types/portal';

interface FileUploadZoneProps {
  itemId: string;
  files: PortalFile[];
  onUploaded: (files: PortalFile[]) => void;
  onDeleted: (fileId: string) => void;
  disabled?: boolean;
}

function FileIcon({ contentType }: { contentType: string | null }) {
  if (contentType?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (contentType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />;
  if (contentType?.startsWith('video/')) return <Film className="w-4 h-4 text-purple-500" />;
  return <File className="w-4 h-4 text-slate-400" />;
}

export function FileUploadZone({
  itemId,
  files,
  onUploaded,
  onDeleted,
  disabled = false,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);
      setUploading(true);

      const formData = new FormData();
      Array.from(fileList).forEach((f) => formData.append('files', f));

      try {
        const res = await fetch(`/api/portal/upload/${itemId}`, {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? 'Upload failed');
        onUploaded(json.files);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error al subir archivo');
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [itemId, onUploaded],
  );

  const handleDelete = async (fileId: string) => {
    const res = await fetch(`/api/portal/files/${fileId}`, { method: 'DELETE' });
    if (res.ok) onDeleted(fileId);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {!disabled && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            upload(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            px-4 py-5 cursor-pointer transition-all duration-200
            ${dragging
              ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
              : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-indigo-600 font-medium">Subiendo...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-slate-700">
                  Arrastra archivos o <span className="text-indigo-600">haz clic</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  PDF, Excel, imágenes, videos · Máx. 50 MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs"
            >
              <FileIcon contentType={file.content_type} />
              <div className="flex-1 min-w-0">
                {file.signed_url ? (
                  <a
                    href={file.signed_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-slate-700 hover:text-indigo-600 truncate block"
                  >
                    {file.filename}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700 truncate block">{file.filename}</span>
                )}
                <span className="text-slate-400">{formatBytes(file.size_bytes)}</span>
              </div>
              {!disabled && (
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-0.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
