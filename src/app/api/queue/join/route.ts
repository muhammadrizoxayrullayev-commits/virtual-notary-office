import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user already has a ticket
    const existingTicket = await prisma.queueTicket.findUnique({
      where: { clientId: session.user.id }
    });

    if (existingTicket && existingTicket.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'You are already in the queue', ticket: existingTicket }, { status: 400 });
    }

    const newTicket = await prisma.queueTicket.create({
      data: {
        clientId: session.user.id,
        status: 'WAITING',
      }
    });

    return NextResponse.json({ success: true, ticket: newTicket });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join queue' }, { status: 500 });
  }
}
