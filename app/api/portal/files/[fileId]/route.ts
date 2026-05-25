import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: file } = await supabase
    .from('portal_files')
    .select('*')
    .eq('id', fileId)
    .single();

  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  // Only the uploader or an admin can delete
  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (file.uploaded_by !== user.id && roleRow?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Remove from storage
  await admin.storage.from('portal-files').remove([file.storage_path]);

  // Remove DB record
  const { error } = await admin.from('portal_files').delete().eq('id', fileId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
