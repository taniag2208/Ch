'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, AlertTriangle, Paperclip, MessageSquare } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { FileUploadZone } from './FileUploadZone';
import { STATUS_STYLES } from '@/lib/portal-utils';
import type { PortalItemWithFiles, PortalFile, ItemStatus, UserRole } from '@/types/portal';

interface ItemRowProps {
  item:          PortalItemWithFiles;
  userRole:      UserRole;
  onItemUpdated: (updated: PortalItemWithFiles) => void;
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'pending',   label: 'Pendiente' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved',  label: 'Aprobado' },
];

export function ItemRow({ item, userRole, onItemUpdated }: ItemRowProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState(item.comments ?? '');
  const [feedback, setFeedback] = useState(item.admin_feedback ?? '');

  const dot = STATUS_STYLES[item.status].dot;

  const patch = useCallback(
    async (payload: Partial<{ status: ItemStatus; comments: string; admin_feedback: string }>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/portal/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          onItemUpdated({ ...item, ...updated });
        }
      } finally {
        setSaving(false);
      }
    },
    [item, onItemUpdated],
  );

  const handleFilesUploaded = (newFiles: PortalFile[]) => {
    onItemUpdated({
      ...item,
      files: [...item.files, ...newFiles],
      status: item.status === 'pending' ? 'in_review' : item.status,
    });
  };

  const handleFileDeleted = (fileId: string) =>
    onItemUpdated({ ...item, files: item.files.filter((f) => f.id !== fileId) });

  const isApproved = item.status === 'approved';

  return (
    <div className={`rounded-xl border bg-white transition-all duration-200 ${
      open ? 'border-tita-200 shadow-card' : 'border-slate-100 hover:border-slate-200'
    }`}>
      {/* ── Row header ───────────────────────────────────────────── */}
      <button className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dot}`} />

        <span className="flex-1 text-sm font-medium text-slate-800 leading-snug">
          {item.title}
          {item.is_blocker && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold
              text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
              <AlertTriangle style={{ width: 9, height: 9 }} />
              Bloqueo
            </span>
          )}
        </span>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {item.files.length > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-100 rounded-full px-1.5 py-0.5 font-medium">
              <Paperclip style={{ width: 9, height: 9 }} />
              {item.files.length}
            </span>
          )}
          {item.comments && (
            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
          )}
          <StatusBadge status={item.status} size="xs" />
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-300 ml-1" />
            : <ChevronDown className="w-4 h-4 text-slate-300 ml-1" />
          }
        </div>
      </button>

      {/* ── Expanded panel ───────────────────────────────────────── */}
      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4 animate-slide-down">
          {/* Description */}
          {item.description && (
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-xl px-3 py-2.5 border border-slate-100">
              {item.description}
            </p>
          )}

          {/* Files */}
          <section>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Archivos adjuntos
            </p>
            <FileUploadZone
              itemId={item.id}
              files={item.files}
              onUploaded={handleFilesUploaded}
              onDeleted={handleFileDeleted}
              readonly={isApproved && userRole !== 'admin'}
            />
          </section>

          {/* Client comments */}
          <section>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
              Comentarios del cliente
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onBlur={() => {
                if (comments !== (item.comments ?? '')) patch({ comments });
              }}
              rows={2}
              placeholder="Agrega notas o aclaraciones para el equipo..."
              className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2
                placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-tita-300
                focus:border-tita-300 focus:bg-white transition resize-none"
            />
          </section>

          {/* Admin feedback */}
          {(feedback || userRole === 'admin') && (
            <section>
              <label className="text-[11px] font-bold text-tita-500 uppercase tracking-widest block mb-1.5">
                Feedback del equipo Tita Media
              </label>
              {userRole === 'admin' ? (
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onBlur={() => {
                    if (feedback !== (item.admin_feedback ?? '')) patch({ admin_feedback: feedback });
                  }}
                  rows={2}
                  placeholder="Deja feedback visible para el cliente..."
                  className="w-full text-sm rounded-xl border border-tita-200 bg-tita-50/40 px-3 py-2
                    placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-tita-300
                    focus:border-tita-300 transition resize-none"
                />
              ) : (
                <p className="text-sm text-tita-800 bg-tita-50 border border-tita-100 rounded-xl px-3 py-2.5 leading-relaxed">
                  {feedback}
                </p>
              )}
            </section>
          )}

          {/* Admin status controls */}
          {userRole === 'admin' && (
            <section className="flex items-center gap-3 pt-1 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Estado:
              </span>
              <select
                value={item.status}
                onChange={(e) => patch({ status: e.target.value as ItemStatus })}
                disabled={saving}
                className="text-xs rounded-lg border border-slate-200 bg-white px-2.5 py-1.5
                  font-semibold focus:outline-none focus:ring-2 focus:ring-tita-300 cursor-pointer"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {saving && <span className="text-xs text-slate-400 animate-pulse">Guardando...</span>}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
