import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    
    // Check if user is DIRECTOR
    if (!session || session.user.role !== 'DIRECTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const employeeCount = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const onlineEmployees = await prisma.user.count({ 
      where: { role: 'EMPLOYEE', status: 'ONLINE' } 
    });
    const pendingDocuments = await prisma.document.count({ where: { status: 'PENDING' } });
    const queueLength = await prisma.queueTicket.count({ where: { status: 'WAITING' } });

    return NextResponse.json({
      employeeCount,
      onlineEmployees,
      pendingDocuments,
      queueLength,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
