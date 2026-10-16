import { NextRequest, NextResponse } from "next/server";

const getApiInternalUrl = () => process.env.API_INTERNAL_URL || "http://api:8080";

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const targetPath = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${getApiInternalUrl()}/${targetPath}${search}`;

  const forwardHeaders = new Headers();

  // Forward incoming headers
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Do not forward host or connection hop-by-hop headers
    if (lowerKey !== "host" && lowerKey !== "connection") {
      forwardHeaders.set(key, value);
    }
  });

  // Preserve or append client IP
  const clientIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
  if (clientIp) {
    forwardHeaders.set("X-Forwarded-For", clientIp);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body,
      redirect: "manual",
      cache: "no-store",
    });

    const responseHeaders = new Headers();

    // Copy response headers except transfer-encoding
    upstreamRes.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey !== "transfer-encoding") {
        responseHeaders.append(key, value);
      }
    });

    // Handle Set-Cookie array correctly
    if (typeof upstreamRes.headers.getSetCookie === "function") {
      const setCookies = upstreamRes.headers.getSetCookie();
      if (setCookies && setCookies.length > 0) {
        responseHeaders.delete("set-cookie");
        for (const cookie of setCookies) {
          responseHeaders.append("set-cookie", cookie);
        }
      }
    }

    return new NextResponse(upstreamRes.body, {
      status: upstreamRes.status,
      statusText: upstreamRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        error: {
          code: "internal_error",
          message: `GMC API proxy failed to reach upstream: ${error.message}`,
        },
      },
      { status: 502 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
