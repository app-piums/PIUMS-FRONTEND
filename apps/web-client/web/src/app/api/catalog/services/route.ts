import { NextRequest, NextResponse } from 'next/server';

const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4004';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(
      `${CATALOG_SERVICE_URL}/api/services?${searchParams.toString()}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json().catch(() => ({ services: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ services: [] }, { status: 200 });
  }
}
