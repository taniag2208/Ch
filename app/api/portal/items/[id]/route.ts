import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { UpdateItemPayload, ItemStatus } from '@/types/portal';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verify item exists and fetch its project
  const { data: item } = await supabase
    .from('portal_items')
    .select('id, block_id, portal_blocks!inner(project_id)')
    .eq('id', id)
    .single();

  if (!item) return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 });

  const projectId = (item as unknown as { portal_blocks: { project_id: string } })
    .portal_blocks.project_id;

  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  const role = roleRow?.role ?? 'client';

  const body: UpdateItemPayload = await request.json();
  const patch: Record<string, unknown> = {};

  if (body.comments !== undefined) {
    patch.comments = body.comments;
  }

  if (body.status !== undefined) {
    if (role === 'admin') {
      patch.status = body.status;
    } else if (body.status === 'in_review') {
      // clients can submit for review
      patch.status = 'in_review';
    }
  }

  if (body.admin_feedback !== undefined && role === 'admin') {
    patch.admin_feedback = body.admin_feedback;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('portal_items')
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(updated);
}
