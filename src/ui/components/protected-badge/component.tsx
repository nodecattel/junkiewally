import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import cn from 'classnames';

interface ProtectedBadgeProps {
  show: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

const ProtectedBadge: React.FC<ProtectedBadgeProps> = ({ 
  show, 
  className = '', 
  size = 'sm' 
}) => {
  if (!show) return null;

  return (
    <div className={cn(
      "inline-flex items-center px-1 py-0.5 rounded-full bg-green-900/30 border border-green-700/50 text-green-400",
      className
    )}>
      <ShieldCheckIcon className="w-3 h-3" />
    </div>
  );
};

export default ProtectedBadge;
