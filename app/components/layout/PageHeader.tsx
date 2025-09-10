import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, description, className = '' }: PageHeaderProps) {
  return (
    <div className={`text-center mb-12 ${className}`}>
      <h1 className="text-5xl md:text-6xl font-bold mb-6">
        <span className="minecraft-gradient-text">{title}</span>
        {subtitle && (
          <>
            <br />
            <span className="text-slate-800">{subtitle}</span>
          </>
        )}
      </h1>
      {description && (
        <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}