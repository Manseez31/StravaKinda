export class RequestError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function readJson(req: Request, limit = 5000): Promise<Record<string, unknown>> {
 if (Number(req.headers.get('content-length') ?? 0) > limit) throw new RequestError('Request too large', 413);
 const reader = req.body?.getReader(); if (!reader) throw new RequestError('JSON body required', 400);
 const chunks: Uint8Array[] = []; let bytes = 0;
 try { for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > limit) { await reader.cancel(); throw new RequestError('Request too large', 413); } chunks.push(value); } } finally { reader.releaseLock(); }
 const merged = new Uint8Array(bytes); let offset = 0; for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
 try { const result = JSON.parse(new TextDecoder().decode(merged)); if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error(); return result; } catch { throw new RequestError('Invalid JSON object', 400); }
}
