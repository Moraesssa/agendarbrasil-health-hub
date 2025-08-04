/**
 * Location Data Validation Utilities
 * Provides comprehensive validation for location data integrity and consistency
 */

import { logger } from '@/utils/logger';
import { 
  EnhancedLocation, 
  LocationValidationResult, 
  LocationFacility,
  LocationCoordinates,
  WeeklySchedule,
  OperatingHours
} from '@/types/location';

interface ValidationRule<T> {
  name: string;
  validator: (value: T) => boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationContext {
  location: Partial<EnhancedLocation>;
  fieldPath: string;
  validationTime: Date;
}

class LocationValidator {
  private rules = new Map<string, ValidationRule<any>[]>();
  private customValidators = new Map<string, (value: any, context: ValidationContext) => Promise<boolean>>();

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Validate a complete location object
   */
  async validateLocation(location: Partial<EnhancedLocation>): Promise<LocationValidationResult> {
    const errors: LocationValidationResult['errors'] = [];
    const warnings: string[] = [];
    const context: ValidationContext = {
      location,
      fieldPath: '',
      validationTime: new Date()
    };

    logger.info('Starting location validation', 'locationValidator', { locationId: location.id });

    // Validate required fields
    const requiredFields = this.getRequiredFields();
    for (const field of requiredFields) {
      if (!location[field]) {
        errors.push({
          field,
          message: `Campo obrigatório não preenchido: ${this.getFieldDisplayName(field)}`,
          severity: 'error'
        });
      }
    }

    // Validate individual fields
    for (const [fieldName, fieldRules] of this.rules.entries()) {
      const value = location[fieldName as keyof EnhancedLocation];
      
      if (value !== undefined) {
        context.fieldPath = fieldName;
        
        for (const rule of fieldRules) {
          try {
            const isValid = await this.executeValidationRule(rule, value, context);
            
            if (!isValid) {
              errors.push({
                field: fieldName as keyof EnhancedLocation,
                message: rule.message,
                severity: rule.severity
              });
            }
          } catch (error) {
            logger.error('Validation rule execution failed', 'locationValidator', {
              rule: rule.name,
              field: fieldName,
              error
            });
            
            warnings.push(`Erro na validação do campo ${fieldName}: ${rule.name}`);
          }
        }
      }
    }

    // Cross-field validations
    const crossFieldErrors = await this.performCrossFieldValidations(location, context);
    errors.push(...crossFieldErrors);

    // Business logic validations
    const businessErrors = await this.performBusinessValidations(location, context);
    errors.push(...businessErrors);

    // Data consistency checks
    const consistencyWarnings = await this.checkDataConsistency(location, context);
    warnings.push(...consistencyWarnings);

    const result: LocationValidationResult = {
      is_valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };

    logger.info('Location validation completed', 'locationValidator', {
      locationId: location.id,
      isValid: result.is_valid,
      errorCount: errors.length,
      warningCount: warnings.length
    });

    return result;
  }

  /**
   * Validate specific field
   */
  async validateField(
    fieldName: keyof EnhancedLocation, 
    value: any, 
    location?: Partial<EnhancedLocation>
  ): Promise<LocationValidationResult> {
    const context: ValidationContext = {
      location: location || {},
      fieldPath: fieldName,
      validationTime: new Date()
    };

    const errors: LocationValidationResult['errors'] = [];
    const warnings: string[] = [];

    const fieldRules = this.rules.get(fieldName) || [];
    
    for (const rule of fieldRules) {
      try {
        const isValid = await this.executeValidationRule(rule, value, context);
        
        if (!isValid) {
          errors.push({
            field: fieldName,
            message: rule.message,
            severity: rule.severity
          });
        }
      } catch (error) {
        logger.error('Field validation failed', 'locationValidator', {
          field: fieldName,
          rule: rule.name,
          error
        });
        
        warnings.push(`Erro na validação: ${rule.name}`);
      }
    }

    return {
      is_valid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
      warnings
    };
  }

  /**
   * Add custom validation rule
   */
  addValidationRule<T>(
    fieldName: string, 
    rule: ValidationRule<T>
  ): void {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    
    this.rules.get(fieldName)!.push(rule);
    
    logger.info('Custom validation rule added', 'locationValidator', {
      fieldName,
      ruleName: rule.name
    });
  }

  /**
   * Add custom async validator
   */
  addCustomValidator(
    name: string,
    validator: (value: any, context: ValidationContext) => Promise<boolean>
  ): void {
    this.customValidators.set(name, validator);
    
    logger.info('Custom validator added', 'locationValidator', { name });
  }

  /**
   * Get validation statistics
   */
  getValidationStats(): {
    totalRules: number;
    rulesByField: Record<string, number>;
    customValidators: number;
  } {
    const rulesByField: Record<string, number> = {};
    
    for (const [field, rules] of this.rules.entries()) {
      rulesByField[field] = rules.length;
    }

    return {
      totalRules: Array.from(this.rules.values()).reduce((total, rules) => total + rules.length, 0),
      rulesByField,
      customValidators: this.customValidators.size
    };
  }

  // Private methods

  private initializeValidationRules(): void {
    // Basic string validations
    this.addValidationRule('nome_local', {
      name: 'required_string',
      validator: (value: string) => typeof value === 'string' && value.trim().length >= 2,
      message: 'Nome do local deve ter pelo menos 2 caracteres',
      severity: 'error'
    });

    this.addValidationRule('endereco_completo', {
      name: 'required_address',
      validator: (value: string) => typeof value === 'string' && value.trim().length >= 10,
      message: 'Endereço deve ter pelo menos 10 caracteres',
      severity: 'error'
    });

    // Phone validation
    this.addValidationRule('telefone', {
      name: 'phone_format',
      validator: (value?: string) => !value || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(value),
      message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
      severity: 'warning'
    });

    // Email validation
    this.addValidationRule('email', {
      name: 'email_format',
      validator: (value?: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Email deve ter formato válido',
      severity: 'warning'
    });

    // CEP validation
    this.addValidationRule('cep', {
      name: 'cep_format',
      validator: (value?: string) => !value || /^\d{5}-?\d{3}$/.test(value),
      message: 'CEP deve estar no formato XXXXX-XXX',
      severity: 'warning'
    });

    // Coordinates validation
    this.addValidationRule('coordenadas', {
      name: 'coordinates_format',
      validator: (value?: LocationCoordinates) => this.validateCoordinates(value),
      message: 'Coordenadas devem ter latitude e longitude válidas',
      severity: 'warning'
    });

    // Operating hours validation
    this.addValidationRule('horario_funcionamento', {
      name: 'operating_hours',
      validator: (value?: WeeklySchedule) => this.validateOperatingHours(value),
      message: 'Horários de funcionamento devem ter formato válido',
      severity: 'warning'
    });

    // Facilities validation
    this.addValidationRule('facilidades', {
      name: 'facilities_format',
      validator: (value?: LocationFacility[]) => this.validateFacilities(value),
      message: 'Facilidades devem ter formato válido',
      severity: 'info'
    });

    // Status validation
    this.addValidationRule('status', {
      name: 'valid_status',
      validator: (value?: string) => !value || ['ativo', 'temporariamente_fechado', 'manutencao'].includes(value),
      message: 'Status deve ser: ativo, temporariamente_fechado ou manutencao',
      severity: 'error'
    });
  }

  private validateCoordinates(coords?: LocationCoordinates): boolean {
    if (!coords) return true;
    
    return (
      typeof coords.lat === 'number' &&
      typeof coords.lng === 'number' &&
      coords.lat >= -90 && coords.lat <= 90 &&
      coords.lng >= -180 && coords.lng <= 180 &&
      ['exata', 'aproximada'].includes(coords.precisao)
    );
  }

  private validateOperatingHours(schedule?: WeeklySchedule): boolean {
    if (!schedule) return true;

    const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
    
    for (const day of days) {
      const hours = schedule[day as keyof WeeklySchedule];
      if (hours && !this.validateDayHours(hours)) {
        return false;
      }
    }

    return true;
  }

  private validateDayHours(hours: OperatingHours): boolean {
    if (hours.fechado) return true;

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    if (!timeRegex.test(hours.abertura) || !timeRegex.test(hours.fechamento)) {
      return false;
    }

    // Check if opening time is before closing time
    const [openHour, openMin] = hours.abertura.split(':').map(Number);
    const [closeHour, closeMin] = hours.fechamento.split(':').map(Number);
    
    const openMinutes = openHour * 60 + openMin;
    const closeMinutes = closeHour * 60 + closeMin;
    
    return openMinutes < closeMinutes;
  }

  private validateFacilities(facilities?: LocationFacility[]): boolean {
    if (!facilities) return true;

    const validTypes = [
      'estacionamento', 'acessibilidade', 'farmacia', 'laboratorio', 
      'wifi', 'ar_condicionado', 'elevador', 'cafe', 'banheiro_adaptado', 
      'sala_espera_criancas'
    ];

    return facilities.every(facility => 
      validTypes.includes(facility.type) &&
      typeof facility.available === 'boolean'
    );
  }

  private async executeValidationRule(
    rule: ValidationRule<any>, 
    value: any, 
    context: ValidationContext
  ): Promise<boolean> {
    try {
      return rule.validator(value);
    } catch (error) {
      logger.error('Validation rule execution error', 'locationValidator', {
        rule: rule.name,
        error
      });
      return false;
    }
  }

  private async performCrossFieldValidations(
    location: Partial<EnhancedLocation>,
    context: ValidationContext
  ): Promise<LocationValidationResult['errors']> {
    const errors: LocationValidationResult['errors'] = [];

    // Check if closed location has reason
    if (location.status === 'temporariamente_fechado' && !location.motivo_fechamento) {
      errors.push({
        field: 'motivo_fechamento',
        message: 'Local fechado deve ter motivo especificado',
        severity: 'warning'
      });
    }

    // Check if maintenance status has reopening date
    if (location.status === 'manutencao' && !location.previsao_reabertura) {
      errors.push({
        field: 'previsao_reabertura',
        message: 'Local em manutenção deve ter previsão de reabertura',
        severity: 'info'
      });
    }

    // Validate address consistency
    if (location.endereco_completo && location.cidade && location.estado) {
      const addressLower = location.endereco_completo.toLowerCase();
      const cityLower = location.cidade.toLowerCase();
      const stateLower = location.estado.toLowerCase();

      if (!addressLower.includes(cityLower)) {
        errors.push({
          field: 'endereco_completo',
          message: 'Endereço deve conter o nome da cidade',
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  private async performBusinessValidations(
    location: Partial<EnhancedLocation>,
    context: ValidationContext
  ): Promise<LocationValidationResult['errors']> {
    const errors: LocationValidationResult['errors'] = [];

    // Check if location has at least one way to contact
    const hasContact = !!(
      location.telefone || 
      location.whatsapp || 
      location.email
    );

    if (!hasContact) {
      errors.push({
        field: 'telefone',
        message: 'Local deve ter pelo menos uma forma de contato (telefone, WhatsApp ou email)',
        severity: 'warning'
      });
    }

    // Check if location has operating hours
    if (location.horario_funcionamento) {
      const hasAnyOpenDay = Object.values(location.horario_funcionamento).some(
        hours => !hours.fechado
      );

      if (!hasAnyOpenDay) {
        errors.push({
          field: 'horario_funcionamento',
          message: 'Local deve ter pelo menos um dia de funcionamento',
          severity: 'warning'
        });
      }
    }

    return errors;
  }

  private async checkDataConsistency(
    location: Partial<EnhancedLocation>,
    context: ValidationContext
  ): Promise<string[]> {
    const warnings: string[] = [];

    // Check data freshness
    if (location.ultima_atualizacao) {
      const lastUpdate = new Date(location.ultima_atualizacao);
      const now = new Date();
      const daysSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate > 30) {
        warnings.push(`Dados não atualizados há ${Math.floor(daysSinceUpdate)} dias`);
      }
    }

    // Check if verification is recent
    if (location.verificado_em) {
      const lastVerification = new Date(location.verificado_em);
      const now = new Date();
      const daysSinceVerification = (now.getTime() - lastVerification.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceVerification > 90) {
        warnings.push(`Dados não verificados há ${Math.floor(daysSinceVerification)} dias`);
      }
    }

    // Check for missing optional but important fields
    const importantOptionalFields = ['coordenadas', 'website', 'facilidades'];
    const missingFields = importantOptionalFields.filter(field => !location[field as keyof EnhancedLocation]);
    
    if (missingFields.length > 0) {
      warnings.push(`Campos opcionais importantes não preenchidos: ${missingFields.join(', ')}`);
    }

    return warnings;
  }

  private getRequiredFields(): (keyof EnhancedLocation)[] {
    return [
      'nome_local',
      'endereco_completo',
      'cidade',
      'estado'
    ];
  }

  private getFieldDisplayName(field: keyof EnhancedLocation): string {
    const displayNames: Record<string, string> = {
      nome_local: 'Nome do Local',
      endereco_completo: 'Endereço Completo',
      cidade: 'Cidade',
      estado: 'Estado',
      cep: 'CEP',
      telefone: 'Telefone',
      email: 'Email',
      status: 'Status',
      coordenadas: 'Coordenadas',
      horario_funcionamento: 'Horário de Funcionamento',
      facilidades: 'Facilidades'
    };

    return displayNames[field] || field;
  }
}

// Export singleton instance
export const locationValidator = new LocationValidator();

// Export utility functions
export const validationUtils = {
  /**
   * Quick validation for required fields only
   */
  async validateRequired(location: Partial<EnhancedLocation>): Promise<boolean> {
    const validator = new LocationValidator();
    const result = await validator.validateLocation(location);
    return result.errors.filter(e => e.severity === 'error').length === 0;
  },

  /**
   * Validate specific field types
   */
  validatePhone(phone?: string): boolean {
    return !phone || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone);
  },

  validateEmail(email?: string): boolean {
    return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validateCEP(cep?: string): boolean {
    return !cep || /^\d{5}-?\d{3}$/.test(cep);
  },

  /**
   * Format validation error messages for display
   */
  formatValidationErrors(errors: LocationValidationResult['errors']): string[] {
    return errors.map(error => `${error.field}: ${error.message}`);
  }
};

export default locationValidator;