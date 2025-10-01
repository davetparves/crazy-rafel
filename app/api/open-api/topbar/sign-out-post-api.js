// /app/api/open-api/topbar/sign-out-post-api/route.js
import { NextResponse } from 'next/server'

const COOKIE_NAME = 'auth_token'

export async function POST() {
  const res = NextResponse.json({ success: true, message: 'Signed out' })
  res.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return res
}
