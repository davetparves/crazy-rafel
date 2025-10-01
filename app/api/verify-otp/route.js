// /app/api/verify-otp/route.js
import dbConnect from '@/db/connect'
import TempUser from '@/models/temp.model'
import User from '@/models/user.model'
import Transaction from '@/models/transaction.model'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const COOKIE_NAME = 'auth_token'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const REFERRAL_BONUS_TK = 20
const WELCOME_BONUS_TK = 20

// username generator: take fullName, normalize, then append 1->2->3 digit numeric suffix until unique
async function generateUniqueUsername(fullName) {
  const base = (fullName || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 12) || 'user'

  if (!(await User.exists({ username: base }))) {
    return base
  }

  const lengths = [1, 2, 3]
  for (const len of lengths) {
    const max = Math.pow(10, len)
    for (let i = 0; i < max; i++) {
      const suffix = i.toString().padStart(len, '0')
      const candidate = `${base}${suffix}`
      const exists = await User.exists({ username: candidate })
      if (!exists) return candidate
    }
  }

  const fallback = `${base}${Date.now().toString().slice(-5)}`
  return fallback
}

export async function POST(req) {
  let session
  try {
    const body = await req.json()
    const email = body?.email?.toLowerCase()?.trim()
    const otp = String(body?.otp || '').trim()

    if (!email || !otp) {
      return NextResponse.json({ success: false, message: 'ইমেইল ও OTP প্রয়োজন' }, { status: 400 })
    }

    await dbConnect()

    const temp = await TempUser.findOne({ email })
    if (!temp) {
      return NextResponse.json({ success: false, message: 'এই ইমেইলে কোনো টেম্প ইউজার পাওয়া যায়নি।' }, { status: 404 })
    }

    if (!temp.otpExpiresAt || Date.now() > temp.otpExpiresAt.getTime()) {
      return NextResponse.json({ success: false, message: 'OTP এর সময় শেষ। নতুন OTP নিন।' }, { status: 400 })
    }

    const dbOtp = String(temp.otp || '').trim()
    if (otp !== dbOtp) {
      return NextResponse.json({ success: false, message: 'OTP সঠিক নয়।' }, { status: 400 })
    }

    session = await mongoose.startSession()
    session.startTransaction()

    let user = await User.findOne({ email }).session(session)
    let created = false
    let referrerDoc = null

    if (!user) {
      // Ensure unique username + referral code
      const username = await generateUniqueUsername(temp.name)
      const referralCode = username.toUpperCase()

      // IMPORTANT: hash in production
      user = await User.create(
        [
          {
            fullName: temp.name,
            email: temp.email,
            username,
            password: temp.password, // ⚠️ hash this in production
            referralCode,
            referredBy: temp.referral || null,
            emailVerifiedAt: new Date(),
          },
        ],
        { session }
      )
      user = user[0]
      created = true

      // Welcome bonus (ensure at least 20)
      await User.updateOne(
        { _id: user._id },
        { $max: { 'wallet.bonus': WELCOME_BONUS_TK } },
        { session }
      )

      // Welcome transaction
      const welcomeTx = await Transaction.create(
        [
          {
            userId: user._id,
            type: 'welcome',
            amount: WELCOME_BONUS_TK,
            currency: 'BDT',
            note: 'Welcome bonus on signup',
          },
        ],
        { session }
      )
      const welcomeTxId = welcomeTx[0]._id

      await User.updateOne(
        { _id: user._id },
        { $push: { transactions: { transactionId: welcomeTxId, createdAt: new Date() } } },
        { session }
      )

      // If referral present, credit the referrer
      if (temp.referral) {
        const referrer = await User.findOne({ referralCode: temp.referral })
          .select('_id fullName email referralCode')
          .session(session)

        if (referrer?._id) {
          // add new user into referrer's list (no dup)
          await User.updateOne(
            { _id: referrer._id },
            { $addToSet: { myReferList: user._id } },
            { session }
          )

          // ✅ NEW: set new user's referredBy = referrer's _id (as string to match schema)
          await User.updateOne(
            { _id: user._id },
            { $set: { referredBy: String(referrer._id) } },
            { session }
          )

          // credit 20 tk to referrer's wallet.referral
          await User.updateOne(
            { _id: referrer._id },
            { $inc: { 'wallet.referral': REFERRAL_BONUS_TK } },
            { session }
          )

          // create referral transaction for referrer
          const refTx = await Transaction.create(
            [
              {
                userId: referrer._id,
                type: 'referral',
                amount: REFERRAL_BONUS_TK,
                currency: 'BDT',
                note: `Referral bonus for inviting ${user.fullName || 'user'}`,
              },
            ],
            { session }
          )
          const refTxId = refTx[0]._id

          // push transaction id to referrer
          await User.updateOne(
            { _id: referrer._id },
            { $push: { transactions: { transactionId: refTxId, createdAt: new Date() } } },
            { session }
          )

          referrerDoc = referrer
        }
      }
    } else {
      // Existing user: just mark email verified if not already
      if (!user.emailVerifiedAt) {
        await User.updateOne(
          { _id: user._id },
          { $set: { emailVerifiedAt: new Date() } },
          { session }
        )
      }
    }

    // Clear temp user(s)
    await TempUser.deleteMany({ email }).session(session)

    // Commit DB ops
    await session.commitTransaction()
    session.endSession()

    // fresh copy for response
    user = await User.findOne({ email }).select('_id fullName email role referralCode createdAt').lean()

    // JWT
    const payload = {
      _id: String(user._id),
      email: user.email,
      role: (user.role || 'user').toLowerCase(),
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })

    const res = NextResponse.json(
      {
        success: true,
        message: created ? 'User created successfully' : 'User already exists',
        user: {
          _id: String(user._id),
          name: user.fullName,
          email: user.email,
          role: user.role || 'user',
          referralCode: user.referralCode ?? null,
          createdAt: user.createdAt,
        },
        referrer: referrerDoc
          ? {
              _id: String(referrerDoc._id),
              name: referrerDoc.fullName,
              email: referrerDoc.email,
              referralCode: referrerDoc.referralCode,
            }
          : null,
      },
      { status: 200 }
    )

    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return res
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction()
        session.endSession()
      } catch {}
    }
    console.error(err)
    return NextResponse.json(
      { success: false, message: 'এরর হয়েছে', error: err?.message || String(err) },
      { status: 500 }
    )
  }
}
