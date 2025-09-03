import React from 'react';
import { Icon } from '@/app/components/ui/Icon';

// Define valid icon names based on the Icon component
type IconName = 'home' | 'chevronRight' | 'chevronDown' | 'arrow' | 'user' | 'users' | 'clock' | 'warning' | 'alertTriangle' | 'checkCircle' | 'check' | 'lock' | 'plus' | 'edit' | 'heart' | 'bookmark' | 'share' | 'thumbsUp' | 'eye' | 'star' | 'document' | 'news' | 'chat' | 'image' | 'link' | 'bold' | 'italic' | 'strikethrough' | 'listBullet' | 'listNumbered' | 'quote' | 'codeBlock' | 'search' | 'download' | 'language' | 'translate' | 'listMore' | 'gamepad' | 'minecraft' | 'location' | 'fire' | 'discord' | 'skyIsland';

interface WelcomeSectionProps {
  title: string;
  description: string;
  icon: IconName; // Icon name from Icon component
  children?: React.ReactNode; // For additional content like stats
  className?: string;
}

export function WelcomeSection({ 
  title, 
  description, 
  icon, 
  children,
  className = '' 
}: WelcomeSectionProps) {
  return (
    <div className={`minecraft-panel p-8 mb-12 ${className}`}>
      <div className={`flex items-center space-x-3 ${children ? 'mb-6' : 'mb-4'}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <Icon name={icon} className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <p className={`text-slate-600 leading-relaxed ${children ? 'mb-6' : ''}`}>
        {description}
      </p>
      
      {children}
    </div>
  );
}