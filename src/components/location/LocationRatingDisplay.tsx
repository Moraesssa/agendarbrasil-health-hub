// Location Rating Display Component
// replaced by kiro @2025-02-08T19:30:00Z

import React, { useState, useEffect } from 'react';
import { Star, MessageCircle, Users } from 'lucide-react';
import { LocationFeedback } from '@/types/locationAnalytics';
import locationAnalyticsService from '@/services/locationAnalyticsService';

interface LocationRatingDisplayProps {
  locationId: string;
  showReviews?: boolean;
  compact?: boolean;
  maxReviews?: number;
}

const LocationRatingDisplay: React.FC<LocationRatingDisplayProps> = ({
  locationId,
  showReviews = false,
  compact = false,
  maxReviews = 3
}) => {
  const [rating, setRating] = useState<{ average: number; count: number }>({ average: 0, count: 0 });
  const [feedback, setFeedback] = useState<LocationFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatingData();
  }, [locationId]);

  const loadRatingData = async () => {
    try {
      setLoading(true);
      const [ratingData, feedbackData] = await Promise.all([
        locationAnalyticsService.getLocationRating(locationId),
        showReviews ? locationAnalyticsService.getLocationFeedback(locationId) : Promise.resolve([])
      ]);

      setRating(ratingData);
      setFeedback(feedbackData.slice(0, maxReviews));
    } catch (error) {
      console.error('Erro ao carregar dados de avaliação:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    };

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-4 h-4 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="w-12 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(rating.average, 'sm')}
        <span className="text-sm font-medium text-gray-700">
          {rating.average.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500">
          ({rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'})
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {renderStars(rating.average, 'lg')}
          <span className="text-xl font-bold text-gray-900">
            {rating.average.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-1 text-gray-600">
          <Users className="w-4 h-4" />
          <span className="text-sm">
            {rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'}
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      {rating.count > 0 && (
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = feedback.filter(f => Math.round(f.rating) === stars).length;
            const percentage = rating.count > 0 ? (count / rating.count) * 100 : 0;
            
            return (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-gray-600">{stars}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-600 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent Reviews */}
      {showReviews && feedback.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Avaliações Recentes
          </h4>
          <div className="space-y-3">
            {feedback.map((review) => (
              <div key={review.id} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  {renderStars(review.rating, 'sm')}
                  <span className="text-xs text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                )}
                {review.category && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {review.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {rating.count === 0 && (
        <div className="text-center py-4 text-gray-500">
          <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">Ainda não há avaliações para este local</p>
          <p className="text-xs">Seja o primeiro a avaliar!</p>
        </div>
      )}
    </div>
  );
};

export default LocationRatingDisplay;