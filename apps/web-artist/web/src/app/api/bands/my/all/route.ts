import { NextRequest, NextResponse } from "next/server";

const ARTISTS_SERVICE_URL = process.env.ARTISTS_SERVICE_URL || "http://artists-service:4003";

// Shim: calls /bands/my/all when available (new K8s deployment),
// falls back to /bands/my wrapping single result as array.
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return NextResponse.json({ bands: [] }, { status: 200 });

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Try new endpoint first
  const res = await fetch(`${ARTISTS_SERVICE_URL}/bands/my/all`, { headers });
  if (res.ok) {
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  }

  // Fallback: old single-band endpoint
  const fallback = await fetch(`${ARTISTS_SERVICE_URL}/bands/my`, { headers });
  if (!fallback.ok) return NextResponse.json({ bands: [] }, { status: 200 });
  const band = await fallback.json();
  const bands = band && band.id ? [band] : [];
  return NextResponse.json({ bands }, { status: 200 });
}
