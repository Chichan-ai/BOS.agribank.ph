import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { ...corsHeaders, 'Content-Type': 'application/json' },
	});
}

function normalizeRole(role: unknown) {
	const value = typeof role === 'string' ? role.trim().toLowerCase() : '';
	if (value === 'admin' || value.startsWith('admin ·')) return 'admin';
	if (value.includes('admin ii') || value.startsWith('admin2')) return 'admin2';
	if (value.includes('admin i') || value.startsWith('admin1')) return 'admin1';
	return value;
}

Deno.serve(async (request: Request) => {
	if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
	if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed.' }, 405);

	const supabaseUrl = Deno.env.get('SUPABASE_URL');
	const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
	const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
	if (!supabaseUrl || !anonKey || !serviceRoleKey) {
		return jsonResponse({ error: 'Supabase function environment is not configured.' }, 500);
	}

	const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
	if (!token) return jsonResponse({ error: 'Authentication is required.' }, 401);

	const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
	const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
	const { data: authData, error: authError } = await authClient.auth.getUser(token);
	if (authError || !authData.user) return jsonResponse({ error: 'Invalid or expired session.' }, 401);

	const { data: profile, error: profileError } = await adminClient
		.from('user_profiles').select('role').eq('id', authData.user.id).single();
	if (profileError || !['admin', 'admin1'].includes(normalizeRole(profile?.role))) {
		return jsonResponse({ error: 'Only Admin I can delete users.' }, 403);
	}

	let payload: { userId?: unknown };
	try { payload = await request.json(); }
	catch { return jsonResponse({ error: 'Request body must be valid JSON.' }, 400); }
	const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
		return jsonResponse({ error: 'A valid userId is required.' }, 400);
	}
	if (userId === authData.user.id) {
		return jsonResponse({ error: 'You cannot delete your own account.' }, 400);
	}

	const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
	if (deleteError) return jsonResponse({ error: deleteError.message }, 400);
	return jsonResponse({ success: true, userId });
});
