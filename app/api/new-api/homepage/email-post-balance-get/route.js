import dbConnect from '@/db/connect';
import User from '@/models/user.model';
import { NextResponse } from 'next/server';


export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email প্রয়োজন।' },
        { status: 400 }
      );
    }

    await dbConnect();
    const user = await User.findOne({ email }).select('wallet currency').lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User পাওয়া যায়নি।' },
        { status: 404 }
      );
    }

    const balance = Number(user?.wallet?.main ?? 0);
    const currency = user?.currency || 'BDT';

    return NextResponse.json({ success: true, data: { balance, currency } });
  } catch {
    return NextResponse.json(
      { success: false, message: 'ব্যালেন্স লোডে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
