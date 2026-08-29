export class ApiRequestError extends Error {
  status: number;
  retryAfterSeconds?: number;
  congestion: boolean;

  constructor(message: string, status: number, retryAfterSeconds?: number, congestion = false) {
    super(message);
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.congestion = congestion;
  }
}

export async function postJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let payload: { error?: string; retryAfterSeconds?: number; congestion?: boolean } | null = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON error body — fall through with the generic message below.
    }
    throw new ApiRequestError(
      payload?.error || `AI servisi ${response.status} koduyla dondu.`,
      response.status,
      payload?.retryAfterSeconds,
      payload?.congestion === true,
    );
  }
  return response.json() as Promise<T>;
}

export async function patchJson<T>(url: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  await ensureOk(response);
  return response.json() as Promise<T>;
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;
  let payload: { error?: string } | null = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON error body — fall through with the generic message below.
  }
  throw new ApiRequestError(payload?.error || `Servis ${response.status} koduyla döndü.`, response.status);
}

export async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { headers });
  await ensureOk(response);
  return response.json() as Promise<T>;
}

export async function postForm<T>(url: string, form: FormData, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { method: 'POST', headers, body: form });
  await ensureOk(response);
  return response.json() as Promise<T>;
}

export async function deleteRequest<T>(url: string, headers: Record<string, string> = {}, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  await ensureOk(response);
  return response.json() as Promise<T>;
}
