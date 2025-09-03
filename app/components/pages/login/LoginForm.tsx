'use client';

import { signIn, getSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { Icon } from "@/app/components/ui/Icon";

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession();
      if (session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/' });
    } catch {
      // Login error handled by NextAuth
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.auth.welcomeBack || 'Welcome Back'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.auth.signInToAccount || 'Sign in to access your account'}
          </p>
        </div>

        <Button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center gap-3 py-3"
        >
          <Icon name="discord" size="md" />
          {loading ? (t.auth.signingIn || 'Signing in...') : (t.auth.signInWithDiscord || 'Sign in with Discord')}
        </Button>
      </Card>
    </div>
  );
}