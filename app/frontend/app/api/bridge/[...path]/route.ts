import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.SPRING_BASE_URL ?? "http://localhost:8080";

async function proxy(req: NextRequest, method: string, path: string[]) {
  const url = new URL(req.url);
  const targetUrl = `${BASE}/${path.join("/")}${method === "GET" ? url.search : ""}`;

  const headers: Record<string, string> = {};
  const hopByHop = new Set(["host", "connection", "keep-alive", "transfer-encoding", "upgrade"]);
  req.headers.forEach((v, k) => {
    if (!hopByHop.has(k.toLowerCase())) headers[k] = v;
  });

  const init: RequestInit = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    const body = await req.arrayBuffer();
    init.body = body;
  }

  const upstream = await fetch(targetUrl, init);
  const data = await upstream.arrayBuffer();

  const respHeaders = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) respHeaders.set("content-type", ct);
  const sc = upstream.headers.get("set-cookie");
  if (sc) respHeaders.append("set-cookie", sc);

  return new NextResponse(data, { status: upstream.status, headers: respHeaders });
}

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, "GET", ctx.params.path);
}
export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, "POST", ctx.params.path);
}
export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, "PUT", ctx.params.path);
}
export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, "PATCH", ctx.params.path);
}
export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, "DELETE", ctx.params.path);
}