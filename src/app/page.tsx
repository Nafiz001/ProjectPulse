'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingPage } from '@/components/ui/Loading';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'employee':
            router.push('/employee');
            break;
          case 'client':
            router.push('/client');
            break;
        }
      } else {
        router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  return <LoadingPage />;
}
