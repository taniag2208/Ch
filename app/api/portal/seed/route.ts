import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { TECHNOFOODS_PROJECT, TECHNOFOODS_BLOCKS } from '@/lib/portal-data';

/**
 * POST /api/portal/seed
 * Seeds the Technofoods project with blocks and items.
 * Body: { admin_user_id: string, client_user_id?: string }
 * Requires an authenticated user with admin role (or first-time setup).
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const clientUserId: string | undefined = body.client_user_id;

  // Upsert project
  const { data: project, error: projError } = await admin
    .from('portal_projects')
    .upsert(TECHNOFOODS_PROJECT, { onConflict: 'slug' })
    .select()
    .single();

  if (projError || !project) {
    return NextResponse.json(
      { error: projError?.message ?? 'Failed to create project' },
      { status: 500 },
    );
  }

  // Assign admin role to current user
  await admin.from('portal_user_roles').upsert(
    { project_id: project.id, user_id: user.id, role: 'admin' },
    { onConflict: 'project_id,user_id' },
  );

  // Assign client role if provided
  if (clientUserId) {
    await admin.from('portal_user_roles').upsert(
      { project_id: project.id, user_id: clientUserId, role: 'client' },
      { onConflict: 'project_id,user_id' },
    );
  }

  // Seed blocks + items
  for (const blockSeed of TECHNOFOODS_BLOCKS) {
    const { items: itemSeeds, ...blockData } = blockSeed;

    const { data: block, error: blockError } = await admin
      .from('portal_blocks')
      .upsert(
        { ...blockData, project_id: project.id },
        { onConflict: 'project_id,slug' },
      )
      .select()
      .single();

    if (blockError || !block) continue;

    for (const itemSeed of itemSeeds) {
      await admin.from('portal_items').upsert(
        { ...itemSeed, block_id: block.id },
        { onConflict: 'block_id,slug' },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    project_id: project.id,
    message: 'Project seeded successfully',
  });
}
