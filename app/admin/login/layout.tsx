import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - Train Tracker',
  description: 'Login to the Train Tracker admin panel',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 dark:bg-gray-900 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
