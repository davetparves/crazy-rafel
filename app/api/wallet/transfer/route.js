import dbConnect from '@/db/connect'
import IncreaseGrowth from '@/models/increaseGrowth.model'
import Transaction from '@/models/transaction.model'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'

/*
  ✅ Request body:
  {
    "email": "user@example.com",
    "route": [ { "from": "bank" }, { "to": "main" } ], // or { from:"bank", to:"main" }
    "amount": 500,
    "call": 1 | 2  // 1 = default, 2 = confirm without interest (bank → main only)
  }

  🔒 Allowed accounts: "main" | "bonus" | "referral" | "bank"
  - "bank" is nested → wallet.bank.amount
*/

const ALLOWED = new Set(['main', 'bonus', 'referral', 'bank'])
const DAY_MS = 24 * 60 * 60 * 1000

function parseRoute(route) {
  if (!route) return { from: null, to: null }
  if (Array.isArray(route)) {
    const f = route.find((o) => Object.prototype.hasOwnProperty.call(o, 'from'))
    const t = route.find((o) => Object.prototype.hasOwnProperty.call(o, 'to'))
    return { from: f?.from ?? null, to: t?.to ?? null }
  }
  if (typeof route === 'object') {
    return { from: route.from ?? null, to: route.to ?? null }
  }
  return { from: null, to: null }
}

function getAmountFromWallet(user, key) {
  if (key === 'bank') return Number(user?.wallet?.bank?.amount || 0)
  return Number(user?.wallet?.[key] || 0)
}

function setAmountToWallet(updateDoc, key, newValue) {
  if (key === 'bank') {
    updateDoc['wallet.bank.amount'] = newValue
  } else {
    updateDoc[`wallet.${key}`] = newValue
  }
}

function hmsFromMs(ms) {
  const totalSec = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return { h, m, s }
}

export async function POST(req) {
  try {
    await dbConnect()

    const body = await req.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const { from, to } = parseRoute(body?.route)
    const amount = Number(body?.amount)
    const callVal = Number(body?.call ?? 1) // only used for bank → main

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 })
    }
    if (!from || !to) {
      return NextResponse.json({ success: false, message: 'Invalid route (from/to required)' }, { status: 400 })
    }
    if (!ALLOWED.has(from) || !ALLOWED.has(to)) {
      return NextResponse.json({ success: false, message: 'Unsupported account name' }, { status: 400 })
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number' }, { status: 400 })
    }
    if (from === to) {
      return NextResponse.json({ success: false, message: 'from and to cannot be same' }, { status: 400 })
    }

    // 🔎 User
    const user = await User.findOne({ email }).select('wallet currency').lean()
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 })
    }

    const currency = String(user?.currency || 'BDT').toUpperCase()
    const curFromBal = getAmountFromWallet(user, from)
    const curToBal = getAmountFromWallet(user, to)

    // 💰 balance check
    if (curFromBal < amount) {
      return NextResponse.json(
        { success: false, message: 'Insufficient balance in source account' },
        { status: 400 }
      )
    }

    // 🔢 latest rate
    const growth = await IncreaseGrowth.findOne().sort({ createdAt: -1 }).lean()
    const rate = Number(growth?.rate ?? 0) // % per 24h

    const now = Date.now()

    // 👉 BANK → MAIN (existing logic unchanged)
    if (from === 'bank' && to === 'main') {
      const requestTime = user?.wallet?.bank?.requestTime ? new Date(user.wallet.bank.requestTime).getTime() : 0
      const elapsedMs = now - (requestTime || 0)

      if (callVal === 2) {
        const nextFromBal = curFromBal - amount
        const nextToBal = curToBal + amount

        const setDoc = {}
        setAmountToWallet(setDoc, from, nextFromBal)
        setAmountToWallet(setDoc, to, nextToBal)
        setDoc['wallet.bank.requestTime'] = new Date(now) // reset

        const updated = await User.findOneAndUpdate(
          { email },
          { $set: setDoc },
          { new: true }
        ).select('wallet currency').lean()

        if (!updated) {
          return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 })
        }

        const userAfter = await User.findOne({ email }).select('_id').lean()
        const userId = userAfter?._id
        if (!userId) {
          return NextResponse.json({ success: false, message: 'User ID missing' }, { status: 500 })
        }

        const fromNote = `Transferred ${currency} ${amount} from bank to main (early withdrawal - no interest).`
        const toNote = `Transferred ${currency} ${amount} from bank to main (credited to main).`

        const t1 = await Transaction.create({ userId, type: 'transfer', amount: -Math.abs(amount), currency, note: fromNote })
        const t2 = await Transaction.create({ userId, type: 'transfer', amount: Math.abs(amount), currency, note: toNote })

        await User.updateOne(
          { _id: userId },
          {
            $push: {
              transactions: {
                $each: [
                  { transactionId: t1._id, createdAt: t1.createdAt },
                  { transactionId: t2._id, createdAt: t2.createdAt },
                ],
                $position: 0,
              },
            },
          }
        )

        return NextResponse.json({
          success: true,
          message: 'Transfer completed without interest (early withdrawal).',
          data: {
            main: Number(updated.wallet?.main || 0),
            bonus: Number(updated.wallet?.bonus || 0),
            referral: Number(updated.wallet?.referral || 0),
            bank: Number(updated.wallet?.bank?.amount || 0),
            currency,
            requestTime: updated.wallet?.bank?.requestTime || null,
            rate,
          },
        })
      }

      if (elapsedMs >= DAY_MS) {
        const interest = amount * (rate / 100) * (elapsedMs / DAY_MS)
        const interestRounded = Math.max(0, Math.floor(interest * 100) / 100)

        const nextFromBal = curFromBal - amount
        const nextToBal = curToBal + amount + interestRounded

        const setDoc = {}
        setAmountToWallet(setDoc, from, nextFromBal)
        setAmountToWallet(setDoc, to, nextToBal)
        setDoc['wallet.bank.requestTime'] = new Date(now)

        const updated = await User.findOneAndUpdate(
          { email },
          { $set: setDoc },
          { new: true }
        ).select('wallet currency').lean()

        if (!updated) {
          return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 })
        }

        const userAfter = await User.findOne({ email }).select('_id').lean()
        const userId = userAfter?._id
        if (!userId) {
          return NextResponse.json({ success: false, message: 'User ID missing' }, { status: 500 })
        }

        const hrs = Math.floor(elapsedMs / 3600000)
        const mins = Math.floor((elapsedMs % 3600000) / 60000)
        const fromNote = `Transferred ${currency} ${amount} from bank to main (with interest).`
        const toNote = `Credited ${currency} ${amount} to main (principal).`
        const interestNote = `Interest earned ${currency} ${interestRounded} at rate ${rate}% over ${hrs}h ${mins}m on ${currency} ${amount}.`

        const t1 = await Transaction.create({ userId, type: 'transfer', amount: -Math.abs(amount), currency, note: fromNote })
        const t2 = await Transaction.create({ userId, type: 'transfer', amount: Math.abs(amount), currency, note: toNote })
        const t3 = await Transaction.create({ userId, type: 'interest', amount: Math.abs(interestRounded), currency, note: interestNote })

        await User.updateOne(
          { _id: userId },
          {
            $push: {
              transactions: {
                $each: [
                  { transactionId: t1._id, createdAt: t1.createdAt },
                  { transactionId: t2._id, createdAt: t2.createdAt },
                  { transactionId: t3._id, createdAt: t3.createdAt },
                ],
                $position: 0,
              },
            },
          }
        )

        return NextResponse.json({
          success: true,
          message: `Transfer completed with interest. You earned ${currency} ${interestRounded}.`,
          data: {
            main: Number(updated.wallet?.main || 0),
            bonus: Number(updated.wallet?.bonus || 0),
            referral: Number(updated.wallet?.referral || 0),
            bank: Number(updated.wallet?.bank?.amount || 0),
            currency,
            requestTime: updated.wallet?.bank?.requestTime || null,
            rate,
            interest: interestRounded,
          },
        })
      }

      const remainMs = DAY_MS - elapsedMs
      const { h, m, s } = hmsFromMs(remainMs)
      const note = `You must keep funds in bank for at least 24h to earn interest. Please wait ${h}h ${m}m ${s}s more to receive interest. If you don’t want interest, press Confirm to transfer now.`

      return NextResponse.json({
        success: true,
        hold: true,
        message: 'Decision holding',
        note,
        remaining: { hours: h, minutes: m, seconds: s },
        data: {
          main: Number(user.wallet?.main || 0),
          bonus: Number(user.wallet?.bonus || 0),
          referral: Number(user.wallet?.referral || 0),
          bank: Number(user.wallet?.bank?.amount || 0),
          currency,
          requestTime: user.wallet?.bank?.requestTime || null,
          rate,
        },
      })
    }

    // ⭐⭐⭐ MAIN → BANK (প্রথমে পুরনো ব্যাংক ব্যালেন্সে জমে থাকা ইন্টারেস্ট ক্রেডিট, তারপর deposit + requestTime reset)
    if (from === 'main' && to === 'bank') {
      const bankAmount = Number(user?.wallet?.bank?.amount || 0)
      const bankReqTime = user?.wallet?.bank?.requestTime ? new Date(user.wallet.bank.requestTime).getTime() : 0

      let interestRounded = 0
      if (bankAmount > 0 && bankReqTime) {
        const elapsedMs = now - bankReqTime
        if (elapsedMs > 0) {
          const interest = bankAmount * (rate / 100) * (elapsedMs / DAY_MS)
          interestRounded = Math.max(0, Math.floor(interest * 100) / 100) // 2 decimals floor
        }
      }

      // নতুন ব্যালেন্স: main থেকে প্রিন্সিপাল deduct, bank-এ interest + principal add
      const nextMain = curFromBal - amount
      const nextBank = bankAmount + interestRounded + amount

      const setDoc = {}
      setAmountToWallet(setDoc, 'main', nextMain)
      setAmountToWallet(setDoc, 'bank', nextBank)
      setDoc['wallet.bank.requestTime'] = new Date(now) // reset anchor after compounding

      const updated = await User.findOneAndUpdate(
        { email },
        { $set: setDoc },
        { new: true }
      ).select('wallet currency').lean()

      if (!updated) {
        return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 })
      }

      // 🧾 ট্রান্স্যাকশন: transfer (principal) + interest (if any)
      const userAfter = await User.findOne({ email }).select('_id').lean()
      const userId = userAfter?._id
      if (!userId) {
        return NextResponse.json({ success: false, message: 'User ID missing' }, { status: 500 })
      }

      const fromNote = `Transferred ${currency} ${amount} from main to bank.`
      const toNote = `Credited ${currency} ${amount} to bank (principal).`

      const t1 = await Transaction.create({ userId, type: 'transfer', amount: -Math.abs(amount), currency, note: fromNote })
      const t2 = await Transaction.create({ userId, type: 'transfer', amount: Math.abs(amount), currency, note: toNote })

      const txs = [t1, t2]

      if (interestRounded > 0) {
        // elapsed বিবরণ (optional)
        const elapsedMs = Math.max(0, now - (bankReqTime || now))
        const hrs = Math.floor(elapsedMs / 3600000)
        const mins = Math.floor((elapsedMs % 3600000) / 60000)
        const interestNote = `Bank auto-interest ${currency} ${interestRounded} at rate ${rate}% over ${hrs}h ${mins}m on ${currency} ${bankAmount}.`
        const t3 = await Transaction.create({ userId, type: 'interest', amount: Math.abs(interestRounded), currency, note: interestNote })
        txs.push(t3)
      }

      await User.updateOne(
        { _id: userId },
        {
          $push: {
            transactions: {
              $each: txs.map((t) => ({ transactionId: t._id, createdAt: t.createdAt })),
              $position: 0,
            },
          },
        }
      )

      return NextResponse.json({
        success: true,
        message: interestRounded > 0
          ? `Transfer completed. Accrued interest ${currency} ${interestRounded} added to bank.`
          : 'Transfer completed.',
        data: {
          main: Number(updated.wallet?.main || 0),
          bonus: Number(updated.wallet?.bonus || 0),
          referral: Number(updated.wallet?.referral || 0),
          bank: Number(updated.wallet?.bank?.amount || 0),
          currency,
          requestTime: updated.wallet?.bank?.requestTime || null,
          rate,
          interest: interestRounded,
        },
      })
    }

    // 🔄 other simple routes
    const nextFromBal = curFromBal - amount
    const nextToBal = curToBal + amount

    const setDoc = {}
    setAmountToWallet(setDoc, from, nextFromBal)
    setAmountToWallet(setDoc, to, nextToBal)

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: setDoc },
      { new: true }
    ).select('wallet currency').lean()

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Update failed' }, { status: 500 })
    }

    const userAfter = await User.findOne({ email }).select('_id').lean()
    const userId = userAfter?._id
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID missing' }, { status: 500 })
    }

    const fromNote = `Transferred ${currency} ${amount} from ${from} to ${to} (deducted from ${from}).`
    const toNote = `Transferred ${currency} ${amount} from ${from} to ${to} (added to ${to}).`

    const t1 = await Transaction.create({ userId, type: 'transfer', amount: -Math.abs(amount), currency, note: fromNote })
    const t2 = await Transaction.create({ userId, type: 'transfer', amount: Math.abs(amount), currency, note: toNote })

    await User.updateOne(
      { _id: userId },
      {
        $push: {
          transactions: {
            $each: [
              { transactionId: t1._id, createdAt: t1.createdAt },
              { transactionId: t2._id, createdAt: t2.createdAt },
            ],
            $position: 0,
          },
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Transfer completed',
      data: {
        main: Number(updated.wallet?.main || 0),
        bonus: Number(updated.wallet?.bonus || 0),
        referral: Number(updated.wallet?.referral || 0),
        bank: Number(updated.wallet?.bank?.amount || 0),
        currency,
        requestTime: updated.wallet?.bank?.requestTime || null,
        rate,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, message: 'Server error', error: String(err?.message || err) },
      { status: 500 }
    )
  }
}
