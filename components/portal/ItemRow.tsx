'use client';

import { useState, useCallback } from 'react';
import { ChevronDown, AlertTriangle, MessageSquare, ChevronUp } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { FileUploadZone } from './FileUploadZone';
import { getStatusColor } from '@/lib/portal-utils';
import type { PortalItemWithFiles, PortalFile, ItemStatus, UserRole } from '@/types/portal';

interface ItemRowProps {
  item: PortalItemWithFiles;
  userRole: UserRole;
  onItemUpdated: (updated: PortalItemWithFiles) => void;
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: 'pending',   label: 'Pendiente' },
  { value: 'in_review', label: 'En revisión' },
  { value: 'approved',  label: 'Aprobado' },
];

export function ItemRow({ item, userRole, onItemUpdated }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [comments, setComments] = useState(item.comments ?? '');
  const [adminFeedback, setAdminFeedback] = useState(item.admin_feedback ?? '');
  const colors = getStatusColor(item.status);

  const save = useCallback(
    async (patch: Partial<{ status: ItemStatus; comments: string; admin_feedback: string }>) => {
      setSaving(true);
      try {
        const res = await fetch(`/api/portal/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
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

  const handleFileUploaded = (newFiles: PortalFile[]) => {
    const merged = [...item.files, ...newFiles];
    onItemUpdated({ ...item, files: merged, status: item.status === 'pending' ? 'in_review' : item.status });
  };

  const handleFileDeleted = (fileId: string) => {
    onItemUpdated({ ...item, files: item.files.filter((f) => f.id !== fileId) });
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        expanded ? 'border-indigo-200 shadow-elegant' : 'border-slate-100 hover:border-slate-200'
      } bg-white`}
    >
      {/* Header row */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Status dot */}
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />

        {/* Title */}
        <span className="flex-1 text-sm font-medium text-slate-800 leading-snug">
          {item.title}
          {item.is_blocker && (
            <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              Bloqueo
            </span>
          )}
        </span>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.files.length > 0 && (
            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
              {item.files.length} archivo{item.files.length !== 1 ? 's' : ''}
            </span>
          )}
          {item.comments && (
            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
          )}
          <StatusBadge status={item.status} size="sm" />
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-300" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-300" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Description */}
          {item.description && (
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
              {item.description}
            </p>
          )}

          {/* Files */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Archivos
            </p>
            <FileUploadZone
              itemId={item.id}
              files={item.files}
              onUploaded={handleFileUploaded}
              onDeleted={handleFileDeleted}
              disabled={item.status === 'approved' && userRole !== 'admin'}
            />
          </div>

          {/* Comments */}
          <div>
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
              Comentarios del cliente
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onBlur={() => {
                if (comments !== (item.comments ?? '')) {
                  save({ comments });
                }
              }}
              rows={2}
              placeholder="Agrega notas o aclaraciones..."
              className="w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none"
            />
          </div>

          {/* Admin feedback (visible to all, editable by admin) */}
          {(adminFeedback || userRole === 'admin') && (
            <div>
              <label className="text-xs font-semibold text-indigo-500 uppercase tracking-wide block mb-1.5">
                Feedback del equipo
              </label>
              {userRole === 'admin' ? (
                <textarea
                  value={adminFeedback}
                  onChange={(e) => setAdminFeedback(e.target.value)}
                  onBlur={() => {
                    if (adminFeedback !== (item.admin_feedback ?? '')) {
                      save({ admin_feedback: adminFeedback });
                    }
                  }}
                  rows={2}
                  placeholder="Deja feedback para el cliente..."
                  className="w-full text-sm rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-2 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 resize-none"
                />
              ) : (
                <p className="text-sm text-indigo-800 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  {adminFeedback}
                </p>
              )}
            </div>
          )}

          {/* Status selector (admin only) */}
          {userRole === 'admin' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Estado:
              </label>
              <select
                value={item.status}
                onChange={(e) => save({ status: e.target.value as ItemStatus })}
                disabled={saving}
                className="text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {saving && (
                <span className="text-xs text-slate-400 animate-pulse">Guardando...</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
