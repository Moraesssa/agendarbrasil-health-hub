import React, { useState, useCallback, useRef } from 'react';
import { ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationWithTimeSlots } from '@/types/location';
import { LocationCard } from './LocationCard';

interface SwipeableLocationCardProps {
  location: LocationWithTimeSlots;
  isSelected?: boolean;
  isInComparison?: boolean;
  onSelect?: () => void;
  onToggleComparison?: () => void;
  onViewMap?: () => void;
  onCall?: () => void;
  onShare?: () => void;
  compact?: boolean;
  className?: string;
}

interface SwipeState {
  startX: number;
  currentX: number;
  isDragging: boolean;
  direction: 'left' | 'right' | null;
}

export const SwipeableLocationCard: React.FC<SwipeableLocationCardProps> = ({
  location,
  isSelected = false,
  isInComparison = false,
  onSelect,
  onToggleComparison,
  onViewMap,
  onCall,
  onShare,
  compact = false,
  className
}) => {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    currentX: 0,
    isDragging: false,
    direction: null
  });
  
  const cardRef = useRef<HTMLDivElement>(null);
  const swipeThreshold = 100; // Minimum distance for swipe action
  const maxSwipeDistance = 150; // Maximum visual feedback distance

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({
      startX: touch.clientX,
      currentX: touch.clientX,
      isDragging: true,
      direction: null
    });
  }, []);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swipeState.isDragging) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    const clampedDelta = Math.max(-maxSwipeDistance, Math.min(maxSwipeDistance, deltaX));
    
    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      direction: deltaX > 0 ? 'right' : 'left'
    }));

    // Apply visual feedback
    if (cardRef.current) {
      cardRef.current.style.transform = `translateX(${clampedDelta}px)`;
      cardRef.current.style.opacity = `${1 - Math.abs(clampedDelta) / maxSwipeDistance * 0.2}`;
    }
  }, [swipeState.isDragging, swipeState.startX]);

  // Handle touch end
  const handleTouchEnd = useCallback(() => {
    if (!swipeState.isDragging) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const shouldTriggerAction = Math.abs(deltaX) > swipeThreshold;

    // Reset visual state
    if (cardRef.current) {
      cardRef.current.style.transform = 'translateX(0px)';
      cardRef.current.style.opacity = '1';
    }

    if (shouldTriggerAction && onToggleComparison) {
      // Right swipe: add to comparison (if not already in)
      // Left swipe: remove from comparison (if already in)
      if ((deltaX > 0 && !isInComparison) || (deltaX < 0 && isInComparison)) {
        onToggleComparison();
      }
    }

    setSwipeState({
      startX: 0,
      currentX: 0,
      isDragging: false,
      direction: null
    });
  }, [swipeState, isInComparison, onToggleComparison]);

  // Calculate swipe progress for visual feedback
  const swipeProgress = swipeState.isDragging 
    ? Math.abs(swipeState.currentX - swipeState.startX) / swipeThreshold
    : 0;

  const showSwipeHint = !swipeState.isDragging && !isInComparison;
  const showSwipeAction = swipeState.isDragging && swipeProgress > 0.3;

  return (
    <div className="relative">
      {/* Swipe Action Background */}
      {showSwipeAction && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center rounded-xl",
          "transition-all duration-150",
          swipeState.direction === 'right' 
            ? "bg-blue-100 border-2 border-blue-300" 
            : "bg-red-100 border-2 border-red-300"
        )}>
          <div className={cn(
            "flex items-center gap-2 font-medium",
            swipeState.direction === 'right' ? "text-blue-700" : "text-red-700"
          )}>
            {swipeState.direction === 'right' ? (
              <>
                <Eye className="h-5 w-5" />
                <span>Adicionar à Comparação</span>
              </>
            ) : (
              <>
                <EyeOff className="h-5 w-5" />
                <span>Remover da Comparação</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Card */}
      <div
        ref={cardRef}
        className={cn(
          "relative transition-transform duration-200",
          swipeState.isDragging && "transition-none",
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          touchAction: 'pan-y' // Allow vertical scrolling but capture horizontal swipes
        }}
      >
        <LocationCard
          location={location}
          isSelected={isSelected}
          onSelect={onSelect}
          onViewMap={onViewMap}
          onCall={onCall}
          onShare={onShare}
          compact={compact}
          className={cn(
            isInComparison && "ring-2 ring-blue-300 bg-blue-50",
            "transition-all duration-200"
          )}
        />

        {/* Swipe Hint */}
        {showSwipeHint && (
          <div className="absolute bottom-2 right-2 opacity-60 pointer-events-none">
            <div className="flex items-center gap-1 text-xs text-gray-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
              <ArrowRight className="h-3 w-3" />
              <span>Deslize</span>
            </div>
          </div>
        )}

        {/* Comparison Status Indicator */}
        {isInComparison && (
          <div className="absolute top-2 right-2 z-10">
            <div className="flex items-center gap-1 text-xs text-blue-700 bg-blue-100 border border-blue-300 px-2 py-1 rounded-full shadow-sm">
              <Eye className="h-3 w-3" />
              <span>Comparando</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SwipeableLocationCard;