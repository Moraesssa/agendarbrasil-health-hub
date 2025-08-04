/**
 * Location Rating Component
 * Allows users to rate and review locations
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { locationAnalyticsService } from '@/services/locationAnalyticsService';
import { 
  RatingCategory, 
  RATING_CATEGORY_LABELS,
  RATING_LABELS,
  SubmitLocationRatingRequest 
} from '@/types/analytics';
import { EnhancedLocation } from '@/types/location';
import { 
  Star, 
  MapPin, 
  Accessibility, 
  Users, 
  Sparkles, 
  Building,
  Send,
  CheckCircle
} from 'lucide-react';

interface LocationRatingProps {
  location: EnhancedLocation;
  trigger?: React.ReactNode;
  onRatingSubmitted?: () => void;
}

interface RatingFormData {
  overall_rating: number;
  category_ratings: { [K in RatingCategory]?: number };
  review_title?: string;
  review_text?: string;
  visit_date?: string;
  appointment_type?: string;
  is_anonymous: boolean;
}

const CATEGORY_ICONS = {
  localizacao: MapPin,
  facilidades: Building,
  atendimento: Users,
  limpeza: Sparkles,
  acessibilidade: Accessibility
};

const APPOINTMENT_TYPES = {
  consulta: 'Consulta Médica',
  exame: 'Exame',
  procedimento: 'Procedimento'
};

export const LocationRating: React.FC<LocationRatingProps> = ({
  location,
  trigger,
  onRatingSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<RatingFormData>({
    overall_rating: 0,
    category_ratings: {},
    is_anonymous: false
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.overall_rating === 0) {
      toast({
        title: 'Avaliação obrigatória',
        description: 'Por favor, selecione uma avaliação geral.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const request: SubmitLocationRatingRequest = {
        location_id: location.id,
        overall_rating: formData.overall_rating,
        category_ratings: formData.category_ratings,
        review_title: formData.review_title,
        review_text: formData.review_text,
        visit_date: formData.visit_date,
        appointment_type: formData.appointment_type,
        is_anonymous: formData.is_anonymous
      };

      await locationAnalyticsService.submitLocationRating(request);

      setIsSubmitted(true);
      toast({
        title: 'Avaliação enviada!',
        description: 'Obrigado pela sua avaliação. Ela ajudará outros usuários.',
        variant: 'default'
      });

      onRatingSubmitted?.();

      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setFormData({
          overall_rating: 0,
          category_ratings: {},
          is_anonymous: false
        });
      }, 2000);

    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Erro ao enviar avaliação',
        description: 'Ocorreu um erro. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof RatingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateCategoryRating = (category: RatingCategory, rating: number) => {
    setFormData(prev => ({
      ...prev,
      category_ratings: {
        ...prev.category_ratings,
        [category]: rating
      }
    }));
  };

  const renderStarRating = (
    rating: number,
    onRatingChange: (rating: number) => void,
    size: 'sm' | 'md' | 'lg' = 'md'
  ) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6'
    };

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            className={`p-1 rounded transition-colors ${
              rating >= star
                ? 'text-yellow-500 hover:text-yellow-600'
                : 'text-gray-300 hover:text-gray-400'
            }`}
          >
            <Star className={`${sizeClasses[size]} fill-current`} />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-gray-600">
            {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
          </span>
        )}
      </div>
    );
  };

  const renderCategoryRatings = () => {
    return (
      <div className="space-y-4">
        <Label>Avaliações por Categoria (opcional)</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(RATING_CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key as RatingCategory];
            const categoryRating = formData.category_ratings[key as RatingCategory] || 0;
            
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                {renderStarRating(
                  categoryRating,
                  (rating) => updateCategoryRating(key as RatingCategory, rating),
                  'sm'
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Star className="w-4 h-4 mr-2" />
              Avaliar Local
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Avaliação Enviada!</h3>
            <p className="text-gray-600">
              Obrigado pela sua avaliação. Ela ajudará outros usuários a escolher o melhor local.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Star className="w-4 h-4 mr-2" />
            Avaliar Local
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Avaliar Local</DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência em <strong>{location.nome_local}</strong> para ajudar outros usuários.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <div className="space-y-3">
            <Label>Avaliação Geral *</Label>
            {renderStarRating(
              formData.overall_rating,
              (rating) => updateFormData('overall_rating', rating),
              'lg'
            )}
          </div>

          {/* Category Ratings */}
          {renderCategoryRatings()}

          {/* Review Title */}
          <div className="space-y-2">
            <Label>Título da Avaliação (opcional)</Label>
            <Input
              placeholder="Resumo da sua experiência"
              value={formData.review_title || ''}
              onChange={(e) => updateFormData('review_title', e.target.value)}
            />
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label>Comentário (opcional)</Label>
            <Textarea
              placeholder="Conte mais sobre sua experiência neste local"
              value={formData.review_text || ''}
              onChange={(e) => updateFormData('review_text', e.target.value)}
              rows={4}
            />
          </div>

          {/* Visit Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Visita (opcional)</Label>
              <Input
                type="date"
                value={formData.visit_date || ''}
                onChange={(e) => updateFormData('visit_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Atendimento (opcional)</Label>
              <Select
                value={formData.appointment_type}
                onValueChange={(value) => updateFormData('appointment_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(APPOINTMENT_TYPES).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => updateFormData('is_anonymous', checked)}
            />
            <Label htmlFor="anonymous">
              Enviar avaliação anonimamente
            </Label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Avaliação
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationRating;