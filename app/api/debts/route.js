import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { fromId, toId, delta } = await request.json();
    
    const d1 = await prisma.debt.findUnique({ where: { fromId_toId: { fromId, toId } } });
    const d2 = await prisma.debt.findUnique({ where: { fromId_toId: { fromId: toId, toId: fromId } } });

    let netOwed = (d1?.amount || 0) - (d2?.amount || 0) + delta;

    if (d1) await prisma.debt.delete({ where: { id: d1.id } });
    if (d2) await prisma.debt.delete({ where: { id: d2.id } });

    if (netOwed > 0) {
      await prisma.debt.create({ data: { fromId, toId, amount: netOwed } });
    } else if (netOwed < 0) {
      await prisma.debt.create({ data: { fromId: toId, toId: fromId, amount: -netOwed } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
