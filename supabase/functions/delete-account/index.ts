import { authenticated, response } from '../_shared/http.ts';
Deno.serve(async req => {
  if (req.method !== 'POST') return response({ error: 'POST required' }, 405);
  try { const { admin, user } = await authenticated(req);
    // Remove owned files first; Storage prevents deleting an owner with remaining objects.
    const files = await admin.storage.from('avatars').list(user.id, { limit: 1000 });
    if (files.error) throw files.error;
    if (files.data.length) { const deletion = await admin.storage.from('avatars').remove(files.data.map(f => `${user.id}/${f.name}`)); if (deletion.error) throw deletion.error; }
    const result = await admin.auth.admin.deleteUser(user.id); if (result.error) throw result.error;
    return response({ deleted: true });
  } catch (e) { return response({ error: e instanceof Error && e.message === 'Unauthorized' ? 'Unauthorized' : 'Account deletion failed; retry or contact support' }, e instanceof Error && e.message === 'Unauthorized' ? 401 : 500); }
});
