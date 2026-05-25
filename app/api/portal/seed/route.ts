import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createSupabaseAdminClient } from '@/lib/supabase-admin';
import { PROJECT_SEED, BLOCKS_SEED } from '@/lib/portal-data';

/**
 * POST /api/portal/seed
 * Initialises the Technofoods project with all blocks and items.
 * The authenticated user becomes the admin.
 * Optional body: { client_user_id: string }
 */
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const admin    = createSupabaseAdminClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const clientUserId: string | undefined = body.client_user_id;

  // ── Upsert project ────────────────────────────────────────────────
  const { data: project, error: projErr } = await admin
    .from('portal_projects')
    .upsert(PROJECT_SEED, { onConflict: 'slug' })
    .select()
    .single();

  if (projErr || !project) {
    return NextResponse.json(
      { error: projErr?.message ?? 'No se pudo crear el proyecto' },
      { status: 500 },
    );
  }

  // ── Roles ─────────────────────────────────────────────────────────
  await admin.from('portal_user_roles').upsert(
    { project_id: project.id, user_id: user.id, role: 'admin' },
    { onConflict: 'project_id,user_id' },
  );

  if (clientUserId) {
    await admin.from('portal_user_roles').upsert(
      { project_id: project.id, user_id: clientUserId, role: 'client' },
      { onConflict: 'project_id,user_id' },
    );
  }

  // ── Blocks + Items ─────────────────────────────────────────────────
  for (const { items: itemSeeds, ...blockData } of BLOCKS_SEED) {
    const { data: block } = await admin
      .from('portal_blocks')
      .upsert({ ...blockData, project_id: project.id }, { onConflict: 'project_id,slug' })
      .select()
      .single();

    if (!block) continue;

    for (const itemSeed of itemSeeds) {
      await admin
        .from('portal_items')
        .upsert({ ...itemSeed, block_id: block.id }, { onConflict: 'block_id,slug' });
    }
  }

  return NextResponse.json({
    ok:         true,
    project_id: project.id,
    message:    'Proyecto Technofoods inicializado correctamente',
  });
}
