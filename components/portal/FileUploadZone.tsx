'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, ImageIcon, Film, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import { formatBytes } from '@/lib/portal-utils';
import type { PortalFile } from '@/types/portal';

interface FileUploadZoneProps {
  itemId:      string;
  files:       PortalFile[];
  onUploaded:  (newFiles: PortalFile[]) => void;
  onDeleted:   (fileId: string) => void;
  readonly?:   boolean;
}

function FileTypeIcon({ ct }: { ct: string | null }) {
  if (ct?.startsWith('image/'))  return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
  if (ct === 'application/pdf')  return <FileText className="w-3.5 h-3.5 text-rose-500" />;
  if (ct?.startsWith('video/'))  return <Film className="w-3.5 h-3.5 text-violet-500" />;
  if (ct?.includes('sheet') || ct?.includes('excel'))
                                  return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
  return <File className="w-3.5 h-3.5 text-slate-400" />;
}

export function FileUploadZone({ itemId, files, onUploaded, onDeleted, readonly = false }: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    Array.from(list).forEach((f) => fd.append('files', f));
    try {
      const res  = await fetch(`/api/portal/upload/${itemId}`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Error al subir');
      onUploaded(json.files);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [itemId, onUploaded]);

  const deleteFile = async (id: string) => {
    const res = await fetch(`/api/portal/files/${id}`, { method: 'DELETE' });
    if (res.ok) onDeleted(id);
  };

  return (
    <div className="space-y-2.5">
      {/* Drop zone */}
      {!readonly && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`
            flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
            px-4 py-4 cursor-pointer transition-all duration-200 select-none
            ${dragging
              ? 'border-tita-400 bg-tita-50'
              : 'border-slate-200 bg-slate-50/60 hover:border-tita-300 hover:bg-tita-50/40'
            }
          `}
        >
          <input ref={inputRef} type="file" multiple className="hidden"
            onChange={(e) => upload(e.target.files)} />

          {uploading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-tita-500 animate-spin" />
              <span className="text-xs text-tita-600 font-medium">Subiendo...</span>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 rounded-full bg-tita-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-tita-600" />
              </div>
              <p className="text-xs text-slate-600 font-medium text-center">
                Arrastra o <span className="text-tita-600 font-semibold">selecciona archivos</span>
              </p>
              <p className="text-[10px] text-slate-400">
                PDF · Excel · Imágenes · Videos · AI/SVG · Máx. 50 MB
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* File list */}
      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file) => (
            <li key={file.id}
              className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs group"
            >
              <FileTypeIcon ct={file.content_type} />
              <div className="flex-1 min-w-0">
                {file.signed_url ? (
                  <a href={file.signed_url} target="_blank" rel="noopener noreferrer"
                    className="font-medium text-slate-700 hover:text-tita-600 truncate block transition-colors">
                    {file.filename}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700 truncate block">{file.filename}</span>
                )}
                <span className="text-slate-400 text-[10px]">{formatBytes(file.size_bytes)}</span>
              </div>
              {!readonly && (
                <button onClick={() => deleteFile(file.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-300 hover:text-rose-400 hover:bg-rose-50 transition-all">
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
