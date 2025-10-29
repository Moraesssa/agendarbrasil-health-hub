import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  count?: number;
}

export function LoadingSkeleton({ className, count = 1 }: LoadingSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse bg-muted rounded-md",
            className
          )}
        />
      ))}
    </>
  );
}

export function DoctorCardSkeleton() {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div className="flex items-start gap-4">
        <LoadingSkeleton className="w-20 h-20 rounded-full" />
        <div className="flex-1 space-y-3">
          <LoadingSkeleton className="h-6 w-48" />
          <LoadingSkeleton className="h-4 w-32" />
          <div className="flex gap-2">
            <LoadingSkeleton className="h-6 w-24" />
            <LoadingSkeleton className="h-6 w-24" />
          </div>
        </div>
        <LoadingSkeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
