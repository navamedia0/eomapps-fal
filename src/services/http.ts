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
