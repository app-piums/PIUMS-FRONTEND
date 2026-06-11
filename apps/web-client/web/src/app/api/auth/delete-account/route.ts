import { NextRequest, NextResponse } from 'next/server';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ message: 'La contraseña es requerida' }, { status: 400 });
    }

    const authToken = request.cookies.get('auth_token')?.value;
    if (!authToken) {
      return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    }

    const response = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ message: data.message || 'Error al eliminar la cuenta' }, { status: response.status });
    }

    const nextResponse = NextResponse.json({ success: true });
    // Clear all auth cookies
    ['auth_token', 'refreshToken', 'user_role', 'onboarding_completed'].forEach(name => {
      nextResponse.cookies.set(name, '', { maxAge: 0, path: '/' });
    });
    return nextResponse;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ message: 'Error interno del servidor' }, { status: 500 });
  }
}
