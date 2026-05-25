import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { UpdateItemPayload } from '@/types/portal';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body: UpdateItemPayload = await request.json();

  // Determine role for this item's project
  const { data: item } = await supabase
    .from('portal_items')
    .select('id, block_id, portal_blocks!inner(project_id)')
    .eq('id', id)
    .single();

  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const projectId = (item as unknown as { portal_blocks: { project_id: string } }).portal_blocks.project_id;
  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  const role = roleRow?.role ?? 'client';

  // Build update payload based on role
  const updateData: Record<string, unknown> = {};

  if (body.comments !== undefined) {
    updateData.comments = body.comments;
  }
  if (body.status !== undefined) {
    // Only admins can move to approved; clients can only set in_review
    if (role === 'admin') {
      updateData.status = body.status;
    } else if (body.status === 'in_review') {
      updateData.status = 'in_review';
    }
  }
  if (body.admin_feedback !== undefined && role === 'admin') {
    updateData.admin_feedback = body.admin_feedback;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('portal_items')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
