import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const players = await prisma.player.findMany();
    const debts = await prisma.debt.findMany();
    return NextResponse.json({ players, debts });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { players } = await request.json();
    
    // Reset everything
    await prisma.debt.deleteMany();
    await prisma.player.deleteMany();

    // Create new players
    const createdPlayers = [];
    for (const name of players) {
      const p = await prisma.player.create({ data: { name } });
      createdPlayers.push(p);
    }

    return NextResponse.json({ players: createdPlayers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.debt.deleteMany();
    await prisma.player.deleteMany();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
