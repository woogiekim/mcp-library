const BASE_URL = process.env.MCP_SERVER_URL ?? "http://localhost:8080";

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  listUseCases: () => request<unknown[]>("GET", "/usecases"),
  getUseCase: (id: string) => request<unknown>("GET", `/usecases/${id}`),
  createUseCase: (body: unknown) => request<{ id: string }>("POST", "/usecases", body),
  deleteUseCase: (id: string) => request<void>("DELETE", `/usecases/${id}`),
  search: (query: string, limit?: number) =>
    request<unknown>("POST", "/search", { query, limit }),
  query: (query: string) =>
    request<unknown>("POST", "/query", { query }),
};
