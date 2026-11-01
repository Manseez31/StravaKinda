import { createClient } from 'npm:@supabase/supabase-js@2';
export const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export async function authenticated(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
  if (!token) throw new Error('Unauthorized');
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error('Unauthorized');
  return { admin, user: data.user };
}
export async function verifiedPremium(userId: string) {
  const secret = Deno.env.get('REVENUECAT_SECRET_KEY');
  if (!secret) throw new Error('Subscription verification is not configured');
  const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, { headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error('Subscription verification unavailable');
  const entitlement = (await res.json()).subscriber?.entitlements?.premium;
  return !!entitlement && (entitlement.expires_date === null || new Date(entitlement.expires_date).getTime() > Date.now());
}
