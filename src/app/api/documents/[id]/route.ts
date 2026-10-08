import { NextResponse } from 'next/server';
import { PrismaClient, DocumentStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession();
    
    if (!session || session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { status } = await req.json();

    if (!Object.values(DocumentStatus).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Await params for Next.js 15+ dynamic routes (best practice)
    const { id } = await params;

    const document = await prisma.document.update({
      where: { id },
      data: { 
        status: status as DocumentStatus,
        reviewerId: session.user.id
      },
      include: {
        client: { select: { name: true, email: true } }
      }
    });

    // Optionally update the client's queue ticket to COMPLETED if document is approved
    if (status === 'APPROVED' || status === 'REJECTED') {
       await prisma.queueTicket.updateMany({
         where: { clientId: document.clientId, status: 'CALLED' }, // Assuming it was called
         data: { status: 'COMPLETED' }
       });
    }

    return NextResponse.json({ success: true, document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
