import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, Calendar, CreditCard } from "lucide-react";

interface StatusFilterProps {
  onStatusChange: (status: string[]) => void;
  activeStatuses: string[];
}

export function ConsultasStatusFilter({ onStatusChange, activeStatuses }: StatusFilterProps) {
  const statusOptions = [
    { 
      value: 'agendada', 
      label: 'Agendadas', 
      icon: Calendar, 
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
    },
    { 
      value: 'confirmada', 
      label: 'Confirmadas', 
      icon: CheckCircle, 
      color: 'bg-green-100 text-green-700 hover:bg-green-200' 
    },
    { 
      value: 'realizada', 
      label: 'Realizadas', 
      icon: CheckCircle, 
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
    },
    { 
      value: 'cancelada', 
      label: 'Canceladas', 
      icon: XCircle, 
      color: 'bg-red-100 text-red-700 hover:bg-red-200' 
    },
    { 
      value: 'pendente_pagamento', 
      label: 'Pagamento Pendente', 
      icon: CreditCard, 
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
    }
  ];

  const toggleStatus = (status: string) => {
    const newStatuses = activeStatuses.includes(status)
      ? activeStatuses.filter(s => s !== status)
      : [...activeStatuses, status];
    onStatusChange(newStatuses);
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg border">
      <span className="text-sm font-medium text-muted-foreground mr-2">Filtrar por status:</span>
      {statusOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeStatuses.includes(option.value);
        
        return (
          <Button
            key={option.value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => toggleStatus(option.value)}
            className={`h-8 ${isActive ? '' : option.color} transition-all`}
          >
            <Icon className="h-3 w-3 mr-1" />
            {option.label}
            {isActive && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                ✓
              </Badge>
            )}
          </Button>
        );
      })}
      
      {activeStatuses.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onStatusChange([])}
          className="h-8 text-muted-foreground"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}