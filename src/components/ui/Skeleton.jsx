import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-slate-800/80 rounded-xl ${className}`} />
  );
};

export const SkeletonLine = ({ className = '' }) => {
  return (
    <div className="space-y-2.5 w-full">
      <Skeleton className={`h-4 w-3/4 ${className}`} />
      <Skeleton className={`h-3 w-1/2 ${className}`} />
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-slate-800/80">
      <div className="flex justify-between items-center">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-8 h-4 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-8 rounded-lg" />
        <Skeleton className="w-32 h-4 rounded" />
      </div>
    </div>
  );
};

export const SkeletonChart = () => {
  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border border-slate-800/80 h-80">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5 w-1/3">
          <Skeleton className="h-4 rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      <div className="flex-1 flex items-end gap-3 mt-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton
            key={i}
            className="w-full rounded-t-lg"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
};
