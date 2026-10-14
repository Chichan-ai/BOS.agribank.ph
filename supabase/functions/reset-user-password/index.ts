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
	if (profileError || !['admin', 'admin1'].includes(profile?.role)) {
		return jsonResponse({ error: 'Only Admin I can reset passwords.' }, 403);
	}

	let payload: { userId?: unknown; password?: unknown };
	try { payload = await request.json(); }
	catch { return jsonResponse({ error: 'Request body must be valid JSON.' }, 400); }
	const userId = typeof payload.userId === 'string' ? payload.userId.trim() : '';
	const password = typeof payload.password === 'string' ? payload.password : '';
	if (!userId || !password) return jsonResponse({ error: 'userId and password are required.' }, 400);
	if (password.length < 8 || password.length > 72) {
		return jsonResponse({ error: 'Password must be between 8 and 72 characters.' }, 400);
	}

	const { data: updatedUser, error: updateError } = await adminClient.auth.admin.updateUserById(userId, { password });
	if (updateError) return jsonResponse({ error: updateError.message }, 400);
	return jsonResponse({ success: true, user: { id: updatedUser.user.id, email: updatedUser.user.email } });
});
