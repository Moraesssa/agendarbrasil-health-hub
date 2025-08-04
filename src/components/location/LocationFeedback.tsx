/**
 * Location Feedback Component
 * Allows users to submit feedback and corrections for location information
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { locationAnalyticsService } from '@/services/locationAnalyticsService';
import { 
  FeedbackType, 
  RatingCategory, 
  FEEDBACK_TYPE_LABELS, 
  RATING_CATEGORY_LABELS,
  RATING_LABELS,
  SubmitLocationFeedbackRequest 
} from '@/types/analytics';
import { EnhancedLocation } from '@/types/location';
import { 
  MessageSquare, 
  Star, 
  AlertTriangle, 
  Clock, 
  Phone, 
  MapPin, 
  Accessibility,
  Send,
  CheckCircle
} from 'lucide-react';

interface LocationFeedbackProps {
  location: EnhancedLocation;
  trigger?: React.ReactNode;
  onFeedbackSubmitted?: () => void;
}

interface FeedbackFormData {
  feedback_type: FeedbackType;
  category?: RatingCategory;
  rating?: number;
  title: string;
  description: string;
  suggested_correction?: string;
  contact_email?: string;
  contact_phone?: string;
  is_anonymous: boolean;
}

const FEEDBACK_TYPE_ICONS = {
  informacao_incorreta: AlertTriangle,
  horario_errado: Clock,
  telefone_invalido: Phone,
  endereco_errado: MapPin,
  facilidades_incorretas: Accessibility,
  outro: MessageSquare
};

export const LocationFeedback: React.FC<LocationFeedbackProps> = ({
  location,
  trigger,
  onFeedbackSubmitted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedback_type: 'informacao_incorreta',
    title: '',
    description: '',
    is_anonymous: false
  });

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o título e a descrição.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const request: SubmitLocationFeedbackRequest = {
        location_id: location.id,
        feedback_type: formData.feedback_type,
        title: formData.title,
        description: formData.description,
        rating: formData.rating,
        category: formData.category,
        suggested_correction: formData.suggested_correction,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        is_anonymous: formData.is_anonymous
      };

      await locationAnalyticsService.submitLocationFeedback(request);

      setIsSubmitted(true);
      toast({
        title: 'Feedback enviado!',
        description: 'Obrigado pelo seu feedback. Analisaremos suas informações.',
        variant: 'default'
      });

      onFeedbackSubmitted?.();

      // Reset form after delay
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setFormData({
          feedback_type: 'informacao_incorreta',
          title: '',
          description: '',
          is_anonymous: false
        });
      }, 2000);

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Erro ao enviar feedback',
        description: 'Ocorreu um erro. Tente novamente mais tarde.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof FeedbackFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderStarRating = () => {
    if (!formData.rating && formData.feedback_type !== 'outro') return null;

    return (
      <div className="space-y-2">
        <Label>Avaliação (opcional)</Label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => updateFormData('rating', star)}
              className={`p-1 rounded transition-colors ${
                (formData.rating || 0) >= star
                  ? 'text-yellow-500 hover:text-yellow-600'
                  : 'text-gray-300 hover:text-gray-400'
              }`}
            >
              <Star className="w-5 h-5 fill-current" />
            </button>
          ))}
          {formData.rating && (
            <span className="ml-2 text-sm text-gray-600">
              {RATING_LABELS[formData.rating as keyof typeof RATING_LABELS]}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCategorySelect = () => {
    if (formData.feedback_type !== 'outro' || !formData.rating) return null;

    return (
      <div className="space-y-2">
        <Label>Categoria da Avaliação</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => updateFormData('category', value as RatingCategory)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(RATING_CATEGORY_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderSuggestedCorrection = () => {
    const needsCorrection = [
      'horario_errado',
      'telefone_invalido',
      'endereco_errado',
      'facilidades_incorretas'
    ].includes(formData.feedback_type);

    if (!needsCorrection) return null;

    return (
      <div className="space-y-2">
        <Label>Correção Sugerida (opcional)</Label>
        <Textarea
          placeholder="Como deveria ser a informação correta?"
          value={formData.suggested_correction || ''}
          onChange={(e) => updateFormData('suggested_correction', e.target.value)}
          rows={3}
        />
      </div>
    );
  };

  const renderContactFields = () => {
    if (formData.is_anonymous) return null;

    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Email para contato (opcional)</Label>
          <Input
            type="email"
            placeholder="seu@email.com"
            value={formData.contact_email || ''}
            onChange={(e) => updateFormData('contact_email', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Telefone para contato (opcional)</Label>
          <Input
            type="tel"
            placeholder="(11) 99999-9999"
            value={formData.contact_phone || ''}
            onChange={(e) => updateFormData('contact_phone', e.target.value)}
          />
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
              <MessageSquare className="w-4 h-4 mr-2" />
              Reportar Problema
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Feedback Enviado!</h3>
            <p className="text-gray-600">
              Obrigado pelo seu feedback. Nossa equipe analisará suas informações.
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
            <MessageSquare className="w-4 h-4 mr-2" />
            Reportar Problema
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reportar Problema ou Dar Feedback</DialogTitle>
          <DialogDescription>
            Ajude-nos a manter as informações de <strong>{location.nome_local}</strong> sempre atualizadas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Problema</Label>
            <RadioGroup
              value={formData.feedback_type}
              onValueChange={(value) => updateFormData('feedback_type', value as FeedbackType)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              {Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) => {
                const Icon = FEEDBACK_TYPE_ICONS[key as FeedbackType];
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <RadioGroupItem value={key} id={key} />
                    <Label 
                      htmlFor={key} 
                      className="flex items-center space-x-2 cursor-pointer flex-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Star Rating */}
          {renderStarRating()}

          {/* Category Selection */}
          {renderCategorySelect()}

          {/* Title */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              placeholder="Resumo do problema"
              value={formData.title}
              onChange={(e) => updateFormData('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              placeholder="Descreva o problema em detalhes"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Suggested Correction */}
          {renderSuggestedCorrection()}

          {/* Anonymous Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={formData.is_anonymous}
              onCheckedChange={(checked) => updateFormData('is_anonymous', checked)}
            />
            <Label htmlFor="anonymous">
              Enviar feedback anonimamente
            </Label>
          </div>

          {/* Contact Fields */}
          {renderContactFields()}

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
                  Enviar Feedback
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocationFeedback;