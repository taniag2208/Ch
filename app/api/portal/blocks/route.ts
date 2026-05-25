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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectSlug = searchParams.get('project') ?? 'technofoods-shopify';

  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch project
  const { data: project, error: projError } = await supabase
    .from('portal_projects')
    .select('*')
    .eq('slug', projectSlug)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  // User role
  const { data: roleRow } = await supabase
    .from('portal_user_roles')
    .select('role')
    .eq('project_id', project.id)
    .eq('user_id', user.id)
    .single();

  const user_role: UserRole = (roleRow?.role as UserRole) ?? 'client';

  // Fetch blocks
  const { data: blocks, error: blocksError } = await supabase
    .from('portal_blocks')
    .select('*')
    .eq('project_id', project.id)
    .order('order_index');

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  // Fetch all items for this project
  const blockIds = (blocks ?? []).map((b) => b.id);
  const { data: items, error: itemsError } = await supabase
    .from('portal_items')
    .select('*')
    .in('block_id', blockIds)
    .order('order_index');

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Fetch all files
  const itemIds = (items ?? []).map((i) => i.id);
  const { data: files } = await supabase
    .from('portal_files')
    .select('*')
    .in('item_id', itemIds)
    .order('created_at');

  // Generate signed URLs for files
  const filesWithUrls = await Promise.all(
    (files ?? []).map(async (file) => {
      const { data: signedData } = await admin.storage
        .from('portal-files')
        .createSignedUrl(file.storage_path, 3600);
      return { ...file, signed_url: signedData?.signedUrl ?? null };
    }),
  );

  // Assemble blocks with items and progress
  const blocksWithItems: PortalBlockWithItems[] = (blocks ?? []).map((block) => {
    const blockItems: PortalItemWithFiles[] = (items ?? [])
      .filter((i) => i.block_id === block.id)
      .map((item) => ({
        ...item,
        files: filesWithUrls.filter((f) => f.item_id === item.id),
      }));

    return {
      ...block,
      items: blockItems,
      progress: calcBlockProgress(blockItems),
    };
  });

  const progress = calcOverallProgress(blocksWithItems);

  const payload: PortalDashboardData = {
    project,
    blocks: blocksWithItems,
    progress,
    user_role,
  };

  return NextResponse.json(payload);
}
