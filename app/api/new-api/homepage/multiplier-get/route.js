import dbConnect from '@/db/connect';
import Multiplier from '@/models/multiplier.model';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const docs = await Multiplier
      .find({ name: { $in: ['single', 'double', 'triple'] } }, 'name value')
      .lean();


    const data = { single: null, double: null, triple: null };
    for (const d of docs) data[d.name] = d.value;

    return NextResponse.json({ success: true, data });
  } catch (error)  {

    
    return NextResponse.json(
      { success: false, message: 'মাল্টিপ্লায়ার লোডে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
