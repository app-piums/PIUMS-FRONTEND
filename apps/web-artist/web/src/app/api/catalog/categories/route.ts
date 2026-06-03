import { NextRequest, NextResponse } from 'next/server';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4004';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth_token')?.value;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${CATALOG_SERVICE_URL}/api/categories`, { headers });
    const data = await res.json().catch(() => []);

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
