import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4', 'video/quicktime',
  'application/zip', 'application/x-zip-compressed',
  'text/plain', 'text/csv',
  'application/illustrator',
  'image/vnd.adobe.illustrator',
];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify user is a member of this item's project
  const { data: item } = await supabase
    .from('portal_items')
    .select('id, block_id, portal_blocks!inner(project_id, portal_projects!inner(slug))')
    .eq('id', itemId)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const block = item as unknown as {
    block_id: string;
    portal_blocks: { project_id: string; portal_projects: { slug: string } };
  };
  const projectSlug = block.portal_blocks.portal_projects.slug;
  const blockId = block.block_id;

  const uploaded = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File ${file.name} exceeds 50MB limit` },
        { status: 400 },
      );
    }

    // Accept common types + fallback for .ai files
    const isAllowed =
      ALLOWED_TYPES.includes(file.type) ||
      file.name.endsWith('.ai') ||
      file.name.endsWith('.svg');

    if (!isAllowed) {
      return NextResponse.json(
        { error: `File type ${file.type} not allowed` },
        { status: 400 },
      );
    }

    const ext = file.name.split('.').pop() ?? 'bin';
    const uniqueName = `${uuidv4()}.${ext}`;
    const storagePath = `${projectSlug}/${blockId}/${itemId}/${uniqueName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: storageError } = await admin.storage
      .from('portal-files')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (storageError) {
      return NextResponse.json({ error: storageError.message }, { status: 500 });
    }

    // Record file in DB
    const { data: fileRecord, error: dbError } = await admin
      .from('portal_files')
      .insert({
        item_id: itemId,
        uploaded_by: user.id,
        filename: file.name,
        storage_path: storagePath,
        content_type: file.type,
        size_bytes: file.size,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Generate signed URL
    const { data: signedData } = await admin.storage
      .from('portal-files')
      .createSignedUrl(storagePath, 3600);

    uploaded.push({ ...fileRecord, signed_url: signedData?.signedUrl ?? null });
  }

  // Auto-advance item to in_review if still pending
  await supabase
    .from('portal_items')
    .update({ status: 'in_review' })
    .eq('id', itemId)
    .eq('status', 'pending');

  return NextResponse.json({ files: uploaded });
}
