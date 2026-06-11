import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4001';

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No hay refresh token' }, { status: 401 });
    }

    const authRes = await fetch(`${AUTH_SERVICE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await authRes.json();

    if (!authRes.ok) {
      return NextResponse.json({ message: data.message || 'Error al refrescar sesión' }, { status: authRes.status });
    }

    const isSecure = process.env.HTTPS_ENABLED === 'true';
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 604800,
    };

    const response = NextResponse.json({ ok: true, role: data.role });

    response.cookies.set('auth_token', data.token, cookieOptions);
    response.cookies.set('user_role', data.role, cookieOptions);

    if (data.refreshToken) {
      response.cookies.set('refreshToken', data.refreshToken, cookieOptions);
    }

    return response;
  } catch {
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
