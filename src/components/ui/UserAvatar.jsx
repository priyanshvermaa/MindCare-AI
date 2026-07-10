import React, { useState } from 'react';

export default function UserAvatar({ 
  user, 
  className = "w-10 h-10 rounded-full", 
  textClassName = "text-sm", 
  fallbackClassName = "bg-gradient-to-tr from-[#7C5CFF] to-[#A88BFF] text-white font-black" 
}) {
  const [error, setError] = useState(false);
  
  if (!user) return null;
  
  const name = user.name || 'User';
  const initial = name.charAt(0).toUpperCase();
  
  const getAvatarUrl = () => {
    const pic = user.profilePicture || user.avatar;
    if (!pic) return null;
    if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('data:')) {
      return pic;
    }
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const base = backendUrl.replace(/\/api\/?$/, '');
    return `${base.replace(/\/$/, '')}${pic}`;
  };

  const avatarUrl = getAvatarUrl();

  if (avatarUrl && !error) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} object-cover shrink-0`}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className={`${className} flex items-center justify-center shrink-0 ${fallbackClassName} ${textClassName}`}>
      {initial}
    </div>
  );
}
