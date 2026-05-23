export type ApiError = { code: string; message: string }

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export async function apiFetch<T>(
  input: string,
  init?: RequestInit & { token?: string },
): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('content-type', 'application/json')
  if (init?.token) headers.set('authorization', `Bearer ${init.token}`)

  const res = await fetch(input, {
    ...init,
    headers,
  })

  const json = (await res.json()) as ApiResponse<T>
  if (json.ok === false) throw new Error(`${json.error.code}:${json.error.message}`)
  return json.data
}
