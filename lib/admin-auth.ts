import { NextRequest } from "next/server";

export const ADMIN_COOKIE = "admin_session";

export function expectedAdminKey() {
  return process.env.ADMIN_DASHBOARD_KEY || "local-admin";
}

export function isValidAdminKey(token: string | null | undefined) {
  return Boolean(token && token === expectedAdminKey());
}

export function assertAdmin(headers: Headers) {
  const token = headers.get("x-admin-key");
  return isValidAdminKey(token);
}

export function assertAdminRequest(req: NextRequest) {
  const headerToken = req.headers.get("x-admin-key");
  const cookieToken = req.cookies.get(ADMIN_COOKIE)?.value;
  return isValidAdminKey(headerToken) || isValidAdminKey(cookieToken);
}
