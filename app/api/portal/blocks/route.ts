import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { calcBlockProgress, calcOverallProgress } from '@/lib/portal-utils';
import type {
  PortalItemWithFiles,
  PortalBlockWithItems,
  PortalDashboardData,
  UserRole,
} from '@/types/portal';

const BUCKET = process.env.NEXT_PUBLIC_STORAGE_BUCKET ?? 'portal-files';

export async function GET(request: NextRequest) {
  const project_slug = new URL(request.url).searchParams.get('project') ?? 'technofoods-shopify';

  const supabase = await createSupabaseServerClient();
  const admin    = createSupabaseAdminClient();

  // ── Auth ──────────────────────────────────────────────────────────
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // ── Project ───────────────────────────────────────────────────────
  const { data: project, error: projErr } = await supabase
    .from('portal_projects')
    .select('*')
    .eq('slug', project_slug)
    .single();

  if (projErr || !project) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
  }

  // ── User role ─────────────────────────────────────────────────────
  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .single();

  const user_role: UserRole = (roleRow?.role as UserRole) ?? 'client';

  // ── Blocks ────────────────────────────────────────────────────────
  const { data: blocks, error: blocksErr } = await supabase
    .from('portal_blocks')
    .select('*')
    .eq('project_id', project.id)
    .order('order_index');

  if (blocksErr) return NextResponse.json({ error: blocksErr.message }, { status: 500 });

  // ── Items ─────────────────────────────────────────────────────────
  const blockIds = (blocks ?? []).map((b) => b.id as string);
  const { data: items, error: itemsErr } = await supabase
    .from('portal_items')
    .select('*')
    .in('block_id', blockIds)
    .order('order_index');

  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  // ── Files + signed URLs ───────────────────────────────────────────
  const itemIds = (items ?? []).map((i) => i.id as string);
  const { data: files } = await supabase
    .from('portal_files')
    .select('*')
    .in('item_id', itemIds)
    .order('created_at');

  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (file) => {
      const { data } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(file.storage_path as string, 3600);
      return { ...file, signed_url: data?.signedUrl ?? null };
    }),
  );

  // ── Assemble ──────────────────────────────────────────────────────
  const blocksWithItems: PortalBlockWithItems[] = (blocks ?? []).map((block) => {
    const blockItems: PortalItemWithFiles[] = (items ?? [])
      .filter((i) => i.block_id === block.id)
      .map((item) => ({
        ...item,
        files: filesWithUrls.filter((f) => f.item_id === item.id),
      }));

    return {
      ...block,
      items:    blockItems,
      progress: calcBlockProgress(block.id as string, blockItems),
    };
  });

  const payload: PortalDashboardData = {
    project,
    blocks:    blocksWithItems,
    progress:  calcOverallProgress(blocksWithItems),
    user_role,
  };

  return NextResponse.json(payload);
}
