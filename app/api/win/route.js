// /app/api/win/route.js
import dbConnect from '@/db/connect'
import Result from '@/models/result.model'
import ResultList from '@/models/resultList.model'
import Transaction from '@/models/transaction.model'
import User from '@/models/user.model'
import UserNumberList from '@/models/userNumberList.model'
import { NextResponse } from 'next/server'


export async function POST(req) {
  try {
    await dbConnect()
    const { email, id } = await req.json()

    if (!id) {
      return NextResponse.json({ ok: false, message: 'id is required' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ ok: false, message: 'email is required' }, { status: 400 })
    }

    const admin = await User.findOne({ email }).lean()
    if (!admin) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 })
    if (admin.role !== 'admin') {
      return NextResponse.json({ ok: false, message: 'You are a user' }, { status: 403 })
    }

    // 1) Result fetch
    const resultDoc = await Result.findById(id)
    if (!resultDoc) return NextResponse.json({ ok: false, message: 'Result not found' }, { status: 404 })

    const { single, double, triple } = resultDoc.numbers || {}

    // 2) Pending bets
    const pendingBets = await UserNumberList.find({ status: 'pending' }).lean()

    let winCount = 0
    let lossCount = 0

    // 3) Process each bet
    for (const bet of pendingBets) {
      const { _id: betId, userId, betType, number, prize } = bet

      // Decide win/loss
      let isWin = false
      if (betType === 'single') isWin = Number(number) === Number(single)
      else if (betType === 'double') isWin = Number(number) === Number(double)
      else if (betType === 'triple') isWin = Number(number) === Number(triple)

      const noteWin = `আপনি ${betType} নম্বরে ${number} দিয়ে বেট করেছিলেন, প্রাইজ ${prize} টাকা পেয়েছেন।`
      const noteLoss = `আপনি ${betType} নম্বরে ${number} দিয়ে বেট করেছিলেন, এই রাউন্ডে কোনো প্রাইজ নেই।`

      if (isWin) {
        // a) mark win
        await UserNumberList.updateOne({ _id: betId }, { $set: { status: 'win' } })

        // b) transaction
        const tx = await Transaction.create({
          userId,
          type: 'win',
          amount: prize,
          currency: 'BDT',
          note: noteWin,
        })

        // c) user wallet + counters + tx link
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: { 'wallet.main': prize, totalWins: 1, totalWinAmount: prize },
            $push: { transactions: { transactionId: tx._id, createdAt: new Date() } },
          },
          { new: false }
        )

        winCount++
      } else {
        // a) mark loss
        await UserNumberList.updateOne({ _id: betId }, { $set: { status: 'loss' } })

        // b) transaction (no balance change)
        const tx = await Transaction.create({
          userId,
          type: 'loss',
          amount: 0,
          currency: 'BDT',
          note: noteLoss,
        })

        // c) user counters + tx link
        await User.findByIdAndUpdate(
          userId,
          {
            $inc: { totalLosses: 1 },
            $push: { transactions: { transactionId: tx._id, createdAt: new Date() } },
          },
          { new: false }
        )

        lossCount++
      }
    }

    // 4) Result -> draw, mirror to ResultList, then delete original
    // (i) status draw (optional—যেহেতু ডিলিট করবো, তবু কন্সিস্টেন্সির জন্য)
    resultDoc.status = 'draw'
    await resultDoc.save()

    // (ii) ResultList create
    const listDoc = await ResultList.create({
      numbers: { single, double, triple },
      status: 'draw',
    })

    // (iii) delete original result
    await Result.findByIdAndDelete(id)

    return NextResponse.json({
      ok: true,
      message: 'Win/Loss processed. Result closed as draw.',
      stats: { winCount, lossCount },
      data: { resultListId: listDoc._id, numbers: listDoc.numbers },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ ok: false, message: err?.message || 'WIN route failed' }, { status: 500 })
  }
}
