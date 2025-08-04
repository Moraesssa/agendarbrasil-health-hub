// Location Feedback Form Component
// replaced by kiro @2025-02-08T19:30:00Z

import React, { useState, useEffect } from 'react';
import { Star, Send, AlertCircle, CheckCircle, MessageCircle, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackSubmission } from '@/types/locationAnalytics';
import locationAnalyticsService from '@/services/locationAnalyticsService';

interface LocationFeedbackFormProps {
  locationId: string;
  locationName: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  initialType?: 'rating' | 'correction' | 'suggestion';
}

const LocationFeedbackForm: React.FC<LocationFeedbackFormProps> = ({
  locationId,
  locationName,
  onSubmitSuccess,
  onCancel,
  initialType = 'rating'
}) => {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState<'rating' | 'correction' | 'suggestion'>(initialType);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [correctionField, setCorrectionField] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [existingRating, setExistingRating] = useState<number | null>(null);

  useEffect(() => {
    if (user && feedbackType === 'rating') {
      loadExistingRating();
    }
  }, [user, locationId, feedbackType]);

  const loadExistingRating = async () => {
    if (!user) return;
    
    try {
      const existing = await locationAnalyticsService.getUserLocationRating(locationId, user.id);
      if (existing) {
        setExistingRating(existing.rating);
        setRating(existing.rating);
        setComment(existing.comment || '');
        setCategory(existing.category || '');
      }
    } catch (error) {
      console.error('Erro ao carregar avaliação existente:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('Você precisa estar logado para enviar feedback');
      return;
    }

    if (feedbackType === 'rating' && rating === 0) {
      alert('Por favor, selecione uma avaliação');
      return;
    }

    if (feedbackType === 'correction' && (!correctionField || !currentValue || !suggestedValue)) {
      alert('Por favor, preencha todos os campos da correção');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const feedbackData: FeedbackSubmission = {
        locationId,
        feedbackType,
        rating: feedbackType === 'rating' ? rating : undefined,
        comment: comment.trim() || undefined,
        category: category || undefined,
        correctionData: feedbackType === 'correction' ? {
          fieldName: correctionField,
          currentValue,
          suggestedValue
        } : undefined
      };

      await locationAnalyticsService.submitFeedback(feedbackData);
      
      setSubmitStatus('success');
      
      // Reset form
      if (feedbackType !== 'rating') {
        setRating(0);
        setComment('');
        setCategory('');
        setCorrectionField('');
        setCurrentValue('');
        setSuggestedValue('');
      }

      setTimeout(() => {
        onSubmitSuccess?.();
      }, 1500);

    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarRating = () => (
    <div className="space-y-2">
      <Label>Avaliação *</Label>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="p-1 rounded transition-colors hover:bg-gray-100"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 && (
            <>
              {rating === 1 && 'Muito ruim'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </>
          )}
        </span>
      </div>
      {existingRating && (
        <p className="text-xs text-blue-600">
          Você já avaliou este local com {existingRating} estrelas. Esta avaliação substituirá a anterior.
        </p>
      )}
    </div>
  );

  const renderCorrectionFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="correctionField">Campo a ser corrigido *</Label>
        <Select value={correctionField} onValueChange={setCorrectionField}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="endereco">Endereço</SelectItem>
            <SelectItem value="telefone">Telefone</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="horario_funcionamento">Horário de Funcionamento</SelectItem>
            <SelectItem value="facilidades">Facilidades</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="outros">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="currentValue">Informação atual *</Label>
        <Input
          id="currentValue"
          value={currentValue}
          onChange={(e) => setCurrentValue(e.target.value)}
          placeholder="Como está atualmente"
        />
      </div>

      <div>
        <Label htmlFor="suggestedValue">Correção sugerida *</Label>
        <Input
          id="suggestedValue"
          value={suggestedValue}
          onChange={(e) => setSuggestedValue(e.target.value)}
          placeholder="Como deveria ser"
        />
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="text-center py-8">
        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Faça login para enviar feedback
        </h3>
        <p className="text-gray-600">
          Você precisa estar logado para avaliar ou reportar informações sobre este local.
        </p>
      </div>
    );
  }

  if (submitStatus === 'success') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Feedback enviado com sucesso!
        </h3>
        <p className="text-gray-600">
          {feedbackType === 'rating' && 'Obrigado pela sua avaliação.'}
          {feedbackType === 'correction' && 'Sua correção será analisada pela nossa equipe.'}
          {feedbackType === 'suggestion' && 'Sua sugestão foi recebida e será analisada.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Feedback para {locationName}
        </h3>
        <p className="text-sm text-gray-600">
          Ajude outros usuários compartilhando sua experiência ou reportando informações incorretas.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant={feedbackType === 'rating' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeedbackType('rating')}
          className="flex items-center gap-2"
        >
          <Star className="w-4 h-4" />
          Avaliar
        </Button>
        <Button
          type="button"
          variant={feedbackType === 'correction' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeedbackType('correction')}
          className="flex items-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Corrigir Info
        </Button>
        <Button
          type="button"
          variant={feedbackType === 'suggestion' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeedbackType('suggestion')}
          className="flex items-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          Sugerir
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {feedbackType === 'rating' && renderStarRating()}
        {feedbackType === 'correction' && renderCorrectionFields()}

        {feedbackType !== 'correction' && (
          <div>
            <Label htmlFor="category">Categoria (opcional)</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="facilities">Facilidades</SelectItem>
                <SelectItem value="contact">Contato</SelectItem>
                <SelectItem value="hours">Horários</SelectItem>
                <SelectItem value="accessibility">Acessibilidade</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label htmlFor="comment">
            {feedbackType === 'rating' ? 'Comentário (opcional)' : 
             feedbackType === 'correction' ? 'Detalhes da correção' : 
             'Sua sugestão *'}
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              feedbackType === 'rating' ? 'Conte sobre sua experiência...' :
              feedbackType === 'correction' ? 'Explique melhor a correção necessária...' :
              'Descreva sua sugestão...'
            }
            rows={3}
            required={feedbackType === 'suggestion'}
          />
        </div>

        {submitStatus === 'error' && (
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            Erro ao enviar feedback. Tente novamente.
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LocationFeedbackForm;