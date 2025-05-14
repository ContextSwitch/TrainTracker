import React from 'react';
import LoginForm from '../../components/admin/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Login - Train Tracker',
  description: 'Login to the Train Tracker admin panel',
};

export default function AdminLoginPage() {
  return <LoginForm />;
}
