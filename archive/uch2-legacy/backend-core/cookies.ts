import type { CookieOptions, Request } from "express";
import { isIP } from "node:net";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const shouldSetDomain =
    hostname &&
    !LOCAL_HOSTS.has(hostname) &&
    !isIP(hostname);

  const domain = shouldSetDomain
    ? (hostname.startsWith(".") ? hostname : `.${hostname}`)
    : undefined;

  return {
    domain,
    httpOnly: true,
    path: "/",
    sameSite: "none", // switch to "lax" if cross-site not needed
    secure: isSecureRequest(req),
  };
}
