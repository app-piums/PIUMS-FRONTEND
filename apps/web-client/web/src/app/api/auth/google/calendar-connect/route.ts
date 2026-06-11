import { NextRequest, NextResponse } from 'next/server';

// Redirects the browser to the external auth-service Google Calendar OAuth flow.
// Reads JWT from the auth_token cookie so the client never needs to expose it in the URL.
// Passes return_url so the backend callback lands back on the client profile page.
export function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const origin = new URL(request.url).origin;
  const returnUrl = `${origin}/profile/personal?calendarConnected=true`;

  const backendBase = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL ?? 'https://backend.piums.io';
  const target = `${backendBase}/api/auth/google/calendar-connect?token=${encodeURIComponent(token)}&return_url=${encodeURIComponent(returnUrl)}`;
  return NextResponse.redirect(target);
}
