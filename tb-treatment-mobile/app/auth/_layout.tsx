import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // You might want to show a loading screen here
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}