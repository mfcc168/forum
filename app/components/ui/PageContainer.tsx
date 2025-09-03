import React from 'react';

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`min-h-screen ${className}`}>
      <main className="max-w-7xl mx-auto px-4 py-12">
        {children}
      </main>
    </div>
  );
}