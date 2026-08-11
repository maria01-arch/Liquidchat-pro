import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Renders a user/chat avatar image, or a blank silhouette placeholder (like
 * every other social/messaging app) when no picture has been set — instead
 * of falling back to a random stock photo, which was the previous behavior
 * and made it look like accounts had pictures they never actually set.
 */
export const Avatar: React.FC<AvatarProps> = ({ src, alt, className = '', onClick }) => {
  if (src) {
    return <img src={src} alt={alt} className={className} onClick={onClick} />;
  }
  return (
    <div
      className={`${className} bg-gray-200 dark:bg-slate-700 flex items-center justify-center shrink-0`}
      onClick={onClick}
      role={alt ? 'img' : undefined}
      aria-label={alt}
    >
      <UserIcon className="w-[55%] h-[55%] text-gray-400 dark:text-slate-400" strokeWidth={1.75} />
    </div>
  );
};
