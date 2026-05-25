import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'portal-files';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const supabase = await createSupabaseServerClient();
  const admin    = createSupabaseAdminClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: file } = await supabase
    .from('portal_files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (!file) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 });

  // Check: uploader or admin role in the project
  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (file.uploaded_by !== user.id && roleRow?.role !== 'admin') {
    return NextResponse.json({ error: 'No permitido' }, { status: 403 });
  }

  await admin.storage.from(BUCKET).remove([file.storage_path as string]);

  const { error } = await admin.from('portal_files').delete().eq('id', fileId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ deleted: true });
}
