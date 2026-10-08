import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'EMPLOYEE' || session.user.role === 'DIRECTOR') {
      // Employees see all pending/reviewed documents
      const documents = await prisma.document.findMany({
        include: {
          client: { select: { name: true, email: true } },
          reviewer: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ documents });
    } else {
      // Clients see their own documents
      const documents = await prisma.document.findMany({
        where: { clientId: session.user.id },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ documents });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
