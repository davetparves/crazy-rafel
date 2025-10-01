// /app/api/users/update-profile/route.js
import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


export async function PATCH(req) {
  try {
    await dbConnect()
    const body = await req.json()
    const { email, fullName, phoneNumber, gender, bio } = body || {}

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }

    const $set = {}
    if (typeof fullName === 'string') $set.fullName = fullName.trim()
    if (typeof phoneNumber === 'string' || phoneNumber === null) $set.phoneNumber = phoneNumber
    if (typeof gender === 'string') $set.gender = gender
    if (typeof bio === 'string' || bio === null) $set.bio = bio || ''
    $set.updatedAt = Date.now()

    const updated = await User.findOneAndUpdate(
      { email: String(email).trim().toLowerCase() },
      { $set },
      { new: true, runValidators: true, context: 'query' }
    ).lean()

    if (!updated) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    // sanitize
    const data = {
      fullName: updated.fullName,
      email: updated.email,
      username: updated.username,
      phoneNumber: updated.phoneNumber,
      gender: updated.gender,
      bio: updated.bio,
      profileImage: updated.profileImage,
      role: updated.role,
      vipLevel: updated.vipLevel,
      walletBalance: updated?.wallet?.main ?? 0,
      totalBets: updated.totalBets,
      totalWinAmount: updated.totalWinAmount,
      totalLossAmount: updated.totalLossAmount,
      biggestWin: updated.biggestWin,
      biggestLoss: updated.biggestLoss,
      loyaltyPoints: updated.loyaltyPoints,
      badges: updated.badges,
      isOnline: updated.isOnline,
    }

    return NextResponse.json({ success: true, data })
  } catch (e) {
    return NextResponse.json(
      { success: false, message: e?.message || 'Something went wrong' },
      { status: 500 }
    )
  }
}
