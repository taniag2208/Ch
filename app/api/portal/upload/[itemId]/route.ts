import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'portal-files';
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime', 'video/x-msvideo',
  'application/zip', 'application/x-zip-compressed',
  'text/plain', 'text/csv',
]);

const ALLOWED_EXTS = new Set(['ai', 'svg', 'eps', 'psd', 'sketch', 'fig', 'xd', 'zip', 'rar']);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const supabase = await createSupabaseServerClient();
  const admin    = createSupabaseAdminClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verify item & project membership
  const { data: item } = await supabase
    .from('portal_items')
    .select('id, block_id, status, portal_blocks!inner(project_id, portal_projects!inner(slug))')
    .eq('id', itemId)
    .single();

  if (!item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

  const meta = (item as unknown as {
    block_id: string;
    portal_blocks: { project_id: string; portal_projects: { slug: string } };
  });

  const projectSlug = meta.portal_blocks.portal_projects.slug;
  const blockId     = meta.block_id;

  const formData = await request.formData();
  const files    = formData.getAll('files') as File[];

  if (!files.length) {
    return NextResponse.json({ error: 'No se enviaron archivos' }, { status: 400 });
  }

  const uploaded = [];

  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `${file.name} supera el límite de 50 MB` }, { status: 400 });
    }

    const ext = (file.name.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_TYPES.has(file.type) && !ALLOWED_EXTS.has(ext)) {
      return NextResponse.json({ error: `Tipo de archivo no permitido: ${file.type || ext}` }, { status: 400 });
    }

    const uniqueName  = `${uuidv4()}.${ext || 'bin'}`;
    const storagePath = `${projectSlug}/${blockId}/${itemId}/${uniqueName}`;
    const buffer      = Buffer.from(await file.arrayBuffer());

    const { error: storageErr } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (storageErr) {
      return NextResponse.json({ error: storageErr.message }, { status: 500 });
    }

    const { data: fileRow, error: dbErr } = await admin
      .from('portal_files')
      .insert({
        item_id:      itemId,
        uploaded_by:  user.id,
        filename:     file.name,
        storage_path: storagePath,
        content_type: file.type,
        size_bytes:   file.size,
      })
      .select()
      .single();

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

    const { data: signedData } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 3600);

    uploaded.push({ ...fileRow, signed_url: signedData?.signedUrl ?? null });
  }

  // Auto-advance to in_review when still pending
  await supabase
    .from('portal_items')
    .update({ status: 'in_review' })
    .eq('id', itemId)
    .eq('status', 'pending');

  return NextResponse.json({ files: uploaded });
}
