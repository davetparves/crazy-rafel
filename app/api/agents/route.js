import dbConnect from '@/db/connect'
import User from '@/models/user.model'
import { NextResponse } from 'next/server'


export async function GET() {
  try {
    await dbConnect()
    const agents = await User.find({ role: 'agent' })
      .select('fullName likeCount isOnline profileImage link') // << link যোগ করা হলো
      .lean()
    return NextResponse.json({ ok: true, agents })
  } catch (e) {
    return NextResponse.json({ ok: false, message: 'Failed to fetch agents' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { agentId, userEmail } = await req.json()
    if (!agentId || !userEmail) {
      return NextResponse.json(
        { ok: false, message: 'agentId and userEmail are required' },
        { status: 400 },
      )
    }

    await dbConnect()
    const user = await User.findOne({ email: userEmail, isActive: true }).select('_id')
    if (!user) return NextResponse.json({ ok: false, message: 'User not found' }, { status: 404 })

    const agent = await User.findOne({ _id: agentId, role: 'agent', isActive: true }).select(
      'likes likeCount',
    )
    if (!agent) return NextResponse.json({ ok: false, message: 'Agent not found' }, { status: 404 })

    const uid = user._id.toString()
    const already = (agent.likes || []).some((l) => l.userId?.toString() === uid)

    if (already) {
      agent.likes = agent.likes.filter((l) => l.userId?.toString() !== uid)
      agent.likeCount = Math.max(0, (agent.likeCount || 0) - 1)
    } else {
      agent.likes.push({ userId: user._id })
      agent.likeCount = (agent.likeCount || 0) + 1
    }

    await agent.save()
    return NextResponse.json({ ok: true, liked: !already, likeCount: agent.likeCount })
  } catch (e) {
    return NextResponse.json({ ok: false, message: 'Failed to toggle like' }, { status: 500 })
  }
}
