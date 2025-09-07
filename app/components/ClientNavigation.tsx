'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/contexts/LanguageContext';
import { Icon } from '@/app/components/ui/Icon';
import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from "next-auth/react";

const ClientNavigation = () => {
  const pathname = usePathname();
  const { t, locale, changeLanguage } = useTranslation();
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatches
  if (!mounted) {
    return (
      <nav className="minecraft-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg">
                  {/* Sky Island SVG */}
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 32 32">
                    {/* Floating grass blocks */}
                    <rect x="4" y="20" width="3" height="3" fill="currentColor" opacity="0.9"/>
                    <rect x="8" y="18" width="3" height="3" fill="currentColor" opacity="0.7"/>
                    <rect x="25" y="19" width="2" height="2" fill="currentColor" opacity="0.6"/>
                    
                    {/* Main island base */}
                    <path d="M6 24 L26 24 L24 26 L8 26 Z" fill="currentColor" opacity="0.8"/>
                    
                    {/* Island grass layer */}
                    <rect x="8" y="22" width="16" height="2" fill="currentColor"/>
                    
                    {/* Trees/vegetation */}
                    <rect x="12" y="18" width="2" height="4" fill="currentColor" opacity="0.9"/>
                    <rect x="11" y="16" width="4" height="2" fill="currentColor" opacity="0.7"/>
                    
                    <rect x="18" y="19" width="2" height="3" fill="currentColor" opacity="0.9"/>
                    <rect x="17" y="17" width="4" height="2" fill="currentColor" opacity="0.7"/>
                    
                    {/* Small floating blocks */}
                    <rect x="14" y="12" width="2" height="2" fill="currentColor" opacity="0.6"/>
                    <rect x="20" y="14" width="2" height="2" fill="currentColor" opacity="0.5"/>
                    <rect x="10" y="14" width="1" height="1" fill="currentColor" opacity="0.5"/>
                    
                    {/* Clouds */}
                    <ellipse cx="6" cy="8" rx="3" ry="1.5" fill="currentColor" opacity="0.3"/>
                    <ellipse cx="26" cy="10" rx="2" ry="1" fill="currentColor" opacity="0.3"/>
                  </svg>
                  
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-20 rounded-xl"></div>
                </div>
                <span className="minecraft-gradient-text text-xl font-bold">
                  {t.nav.serverName}
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-2">
              <div className="animate-pulse bg-slate-200 rounded-lg h-8 w-32"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const navItems = [
    { name: t.nav.home, path: '/' },
    { name: t.nav.wiki, path: '/wiki' },
    { name: t.nav.blog, path: '/blog' },
    { name: t.nav.forum, path: '/forum' },
    { name: t.nav.dex, path: '/dex' },
  ];

  return (
    <nav className="minecraft-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center relative overflow-hidden shadow-lg">
                {/* Sky Island SVG */}
                <Icon name="skyIsland" className="w-8 h-8 text-white" />
                
                {/* Subtle glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white opacity-20 rounded-xl"></div>
              </div>
              <span className="minecraft-gradient-text text-xl font-bold">
                {t.nav.serverName}
              </span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === item.path
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.name}
              </Link>
            ))}
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <Icon name="language" className="w-4 h-4" />
                <span>{locale === 'zh-TW' ? '繁' : 'EN'}</span>
                <Icon name="chevronDown" className={`w-3 h-3 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showLanguageMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                  <button
                    onClick={() => {
                      changeLanguage('zh-TW');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      locale === 'zh-TW' ? 'text-emerald-600 font-medium' : 'text-slate-700'
                    }`}
                  >
                    繁體中文
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('en');
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors ${
                      locale === 'en' ? 'text-emerald-600 font-medium' : 'text-slate-700'
                    }`}
                  >
                    English
                  </button>
                </div>
              )}
            </div>

            {/* Auth Section */}
            <div className="ml-4 flex items-center space-x-2">
              {status === "loading" ? (
                <div className="animate-pulse bg-slate-200 rounded-lg h-8 w-16"></div>
              ) : session ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {(session.user?.avatar || session.user?.image) && (
                      <Image
                        src={session.user?.avatar || session.user?.image || ''}
                        alt="Avatar"
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm font-medium text-slate-700">
                      {session.user?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    {t.auth.signOut}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('discord')}
                  className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Icon name="discord" className="w-4 h-4" />
                  <span>{t.auth.signIn}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default ClientNavigation;