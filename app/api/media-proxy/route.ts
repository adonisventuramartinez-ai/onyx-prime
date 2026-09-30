// app/api/media-proxy/route.ts
import { createStreamProxyHandler } from "aetherly-stream-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const { GET, HEAD, OPTIONS } = createStreamProxyHandler({
  pathPrefix: "/api/media-proxy",
  allowedHeaderPrefixes: ["referer", "user-agent"],
});
