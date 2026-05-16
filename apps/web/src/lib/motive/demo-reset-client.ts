const TOKEN_STORAGE_KEY = "motive_demo_operator_token";
const TOKEN_QUERY_KEYS = ["demo_operator_token", "demoToken"];

type TokenStorage = Pick<Storage, "getItem" | "setItem">;

export function buildDemoResetHeaders(token: string | null): HeadersInit {
  return token
    ? { "content-type": "application/json", "x-demo-operator-token": token }
    : { "content-type": "application/json" };
}

export function readDemoOperatorToken(input: {
  search?: string;
  sessionStorage?: TokenStorage | null;
  localStorage?: TokenStorage | null;
} = {}): string | null {
  const params = new URLSearchParams(input.search ?? "");
  const queryToken = TOKEN_QUERY_KEYS
    .map((key) => params.get(key)?.trim())
    .find((value): value is string => Boolean(value));
  if (queryToken) {
    input.sessionStorage?.setItem(TOKEN_STORAGE_KEY, queryToken);
    return queryToken;
  }

  return input.sessionStorage?.getItem(TOKEN_STORAGE_KEY)?.trim()
    || input.localStorage?.getItem(TOKEN_STORAGE_KEY)?.trim()
    || null;
}

export function readBrowserDemoOperatorToken(): string | null {
  if (typeof window === "undefined") return null;
  return readDemoOperatorToken({
    search: window.location.search,
    sessionStorage: safeStorage(() => window.sessionStorage),
    localStorage: safeStorage(() => window.localStorage)
  });
}

function safeStorage(getStorage: () => Storage): Storage | null {
  try {
    return getStorage();
  } catch {
    return null;
  }
}
