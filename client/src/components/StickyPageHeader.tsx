import type { ReactNode } from 'react';

export default function StickyPageHeader({
  children,
  className = '',
  backgroundClassName = 'bg-gray-50 dark:bg-neutral-950',
}: {
  children: ReactNode;
  className?: string;
  backgroundClassName?: string;
}) {
  return (
    <div
      data-page-header
      className={`sticky top-0 z-40 flow-root shrink-0 ${backgroundClassName} ${className}`}
    >
      {children}
    </div>
  );
}
