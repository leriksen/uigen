// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { jwtVerify } from "jose";

vi.mock("server-only", () => ({}));

const mockSet = vi.fn();
const mockDelete = vi.fn();
let mockGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: mockSet, delete: mockDelete, get: mockGet })),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

test("createSession sets httpOnly cookie named auth-token", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe("auth-token");
  expect(options.httpOnly).toBe(true);
});

test("createSession cookie expires in ~7 days", async () => {
  const { createSession } = await import("@/lib/auth");
  const before = Date.now();
  await createSession("user-1", "user@example.com");
  const after = Date.now();

  const [, , options] = mockSet.mock.calls[0];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
  expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
});

test("createSession sets sameSite lax and path /", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession cookie is not secure outside production", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-1", "user@example.com");

  const [, , options] = mockSet.mock.calls[0];
  expect(options.secure).toBe(false);
});

test("createSession token is a valid JWT with userId and email", async () => {
  const { createSession } = await import("@/lib/auth");
  await createSession("user-42", "test@example.com");

  const [, token] = mockSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  expect(payload.userId).toBe("user-42");
  expect(payload.email).toBe("test@example.com");
});

test("deleteSession deletes the auth-token cookie", async () => {
  const { deleteSession } = await import("@/lib/auth");
  await deleteSession();

  expect(mockDelete).toHaveBeenCalledOnce();
  expect(mockDelete).toHaveBeenCalledWith("auth-token");
});

test("deleteSession only deletes once per call", async () => {
  const { deleteSession } = await import("@/lib/auth");
  await deleteSession();

  expect(mockDelete).toHaveBeenCalledTimes(1);
});

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  mockGet.mockReturnValue({ value: "not.a.valid.jwt" });
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns session payload for a valid token", async () => {
  const { createSession, getSession } = await import("@/lib/auth");
  await createSession("user-99", "hello@example.com");
  const token = mockSet.mock.calls[0][1];
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session?.userId).toBe("user-99");
  expect(session?.email).toBe("hello@example.com");
});

test("getSession returns null for an expired token", async () => {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode("development-secret-key");
  const expiredToken = await new SignJWT({ userId: "u1", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("-1s")
    .sign(secret);
  mockGet.mockReturnValue({ value: expiredToken });

  const { getSession } = await import("@/lib/auth");
  const session = await getSession();

  expect(session).toBeNull();
});

function makeRequest(token?: string): import("next/server").NextRequest {
  const url = "http://localhost/";
  const req = new (require("next/server").NextRequest)(url);
  if (token) {
    req.cookies.set("auth-token", token);
  }
  return req;
}

test("verifySession returns null when no cookie is present", async () => {
  const { verifySession } = await import("@/lib/auth");
  const session = await verifySession(makeRequest());

  expect(session).toBeNull();
});

test("verifySession returns null for an invalid token", async () => {
  const { verifySession } = await import("@/lib/auth");
  const session = await verifySession(makeRequest("not.a.valid.jwt"));

  expect(session).toBeNull();
});

test("verifySession returns session payload for a valid token", async () => {
  const { createSession, verifySession } = await import("@/lib/auth");
  await createSession("user-7", "verify@example.com");
  const token = mockSet.mock.calls[0][1];

  const session = await verifySession(makeRequest(token));

  expect(session?.userId).toBe("user-7");
  expect(session?.email).toBe("verify@example.com");
});

test("verifySession returns null for an expired token", async () => {
  const { SignJWT } = await import("jose");
  const secret = new TextEncoder().encode("development-secret-key");
  const expiredToken = await new SignJWT({ userId: "u1", email: "a@b.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("-1s")
    .sign(secret);

  const { verifySession } = await import("@/lib/auth");
  const session = await verifySession(makeRequest(expiredToken));

  expect(session).toBeNull();
});
