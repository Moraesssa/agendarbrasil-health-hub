import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  variant?: 'card' | 'list' | 'grid' | 'form';
  className?: string;
  lines?: number;
}

const SkeletonLine = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)} />
);

export const LoadingSkeleton = ({ 
  variant = 'card', 
  className,
  lines = 3 
}: LoadingSkeletonProps) => {
  switch (variant) {
    case 'card':
      return (
        <Card className={cn("w-full", className)}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <SkeletonLine className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-5 w-3/4" />
                <SkeletonLine className="h-3 w-1/2" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: lines }, (_, i) => (
              <SkeletonLine key={i} className="h-12 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      );

    case 'list':
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
              <SkeletonLine className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonLine className="h-4 w-3/4" />
                <SkeletonLine className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'grid':
      return (
        <div className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3", className)}>
          {Array.from({ length: lines }, (_, i) => (
            <SkeletonLine key={i} className="h-12 rounded-lg" />
          ))}
        </div>
      );

    case 'form':
      return (
        <div className={cn("space-y-4", className)}>
          {Array.from({ length: lines }, (_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine className="h-4 w-1/4" />
              <SkeletonLine className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className={cn("space-y-3", className)}>
          {Array.from({ length: lines }, (_, i) => (
            <SkeletonLine key={i} className="h-4 w-full" />
          ))}
        </div>
      );
  }
};

export const ProgressSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SkeletonLine className="w-8 h-8 rounded-full" />
        <div className="space-y-1">
          <SkeletonLine className="h-4 w-20" />
          <SkeletonLine className="h-3 w-16" />
        </div>
      </div>
      <SkeletonLine className="h-2 w-32 rounded-full" />
    </div>
    <div className="flex justify-center space-x-2">
      {Array.from({ length: 7 }, (_, i) => (
        <SkeletonLine key={i} className="w-3 h-3 rounded-full" />
      ))}
    </div>
  </div>
);

export const NavigationSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b", className)}>
    <div className="container mx-auto px-4 py-3">
      <div className="flex items-center justify-between">
        <SkeletonLine className="w-16 h-8 rounded" />
        <SkeletonLine className="w-12 h-6 rounded" />
        <SkeletonLine className="w-16 h-8 rounded" />
      </div>
    </div>
  </div>
);