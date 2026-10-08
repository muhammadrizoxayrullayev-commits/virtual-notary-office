'use client';

import VirtualOfficeContainer from '@/components/VirtualOfficeContainer';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OfficePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="h-screen flex items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // Redirecting...
  }

  return <VirtualOfficeContainer />;
}
