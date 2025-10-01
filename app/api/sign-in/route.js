// ✅ /app/api/sign-in/route.js  (bcrypt ছাড়া — only plain compare)
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// 🔑 JWT settings
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const COOKIE_NAME = 'auth_token'

// 🔁 role → redirect map
const roleRedirect = (role) => {
  if (role === 'admin') return '/admins'
  if (role === 'agent') return '/agents'
  return '/users/home'
}

export async function POST(req) {
  try {
    const body = await req.json()
    const email = body?.email?.toLowerCase()?.trim()
    const password = String(body?.password || '')

    // ✅ basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল ও পাসওয়ার্ড প্রয়োজন' },
        { status: 400 }
      )
    }

    await dbConnect()

    // 🔎 find user
    const user = await User.findOne({ email })
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      )
    }

    // 🔐 NO bcrypt — plain compare only
    const match = user.password === password
    if (!match) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়' },
        { status: 401 }
      )
    }

    // 🏷️ role and redirect
    const role = user.role || 'user'
    const redirectTo = roleRedirect(role)

    // 🧾 create JWT
    const token = jwt.sign(
      { _id: String(user._id), email: user.email, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // ✅ set cookie + response
    const res = NextResponse.json(
      {
        success: true,
        message: 'Signed in successfully',
        redirectTo,
        user: {
          _id: String(user._id),
          email: user.email,
          role,
          name: user.fullName ?? user.name ?? null,
        },
      },
      { status: 200 }
    )

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return res
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'সাইন-ইন করতে সমস্যা হয়েছে', error: err?.message || String(err) },
      { status: 500 }
    )
  }
}
