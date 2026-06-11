import { NextRequest, NextResponse } from 'next/server';

const GATEWAY_URL = process.env.GATEWAY_INTERNAL_URL || process.env.GATEWAY_URL || 'http://host.docker.internal:80';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/catalog/services?${searchParams.toString()}`,
      { headers: { 'Content-Type': 'application/json' } }
    );
    const data = await res.json().catch(() => ({ services: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ services: [] }, { status: 200 });
  }
}
