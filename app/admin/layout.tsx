'use client';

import React from 'react';
import AdminNav from '../components/admin/AdminNav';
import AdminAuthProvider from '../components/admin/AdminAuthProvider';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Skip rendering the admin layout for the login page
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <AdminAuthProvider>
      <div className="flex h-screen">
        <div className="hidden md:flex md:w-64 md:flex-col">
          <AdminNav />
        </div>
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:clr-surface-a0">
            {children}
          </main>
        </div>
      </div>
    </AdminAuthProvider>
  );
}
