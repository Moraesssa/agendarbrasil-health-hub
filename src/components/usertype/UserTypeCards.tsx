
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Stethoscope } from "lucide-react";

interface UserTypeCardsProps {
  onUserTypeSelection: (type: 'paciente' | 'medico') => void;
  isSubmitting: boolean;
}

const UserTypeCards: React.FC<UserTypeCardsProps> = ({ onUserTypeSelection, isSubmitting }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Paciente Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-blue-300" 
            onClick={() => !isSubmitting && onUserTypeSelection('paciente')}>
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-10 h-10 text-blue-600" />
          </div>
          <CardTitle className="text-xl text-blue-900">Sou Paciente</CardTitle>
          <CardDescription className="text-base">
            Quero agendar consultas e cuidar da minha saúde
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 mb-4"
            onClick={() => onUserTypeSelection('paciente')}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Continuar como Paciente"}
          </Button>
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Como paciente você pode:</h4>
            <ul className="space-y-1 text-xs">
              <li>✓ Agendar consultas online</li>
              <li>✓ Visualizar histórico médico</li>
              <li>✓ Receber lembretes de medicamentos</li>
              <li>✓ Gerenciar seus dados de saúde</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Médico Card */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-green-300" 
            onClick={() => !isSubmitting && onUserTypeSelection('medico')}>
        <CardHeader className="text-center pb-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-900">Sou Médico</CardTitle>
          <CardDescription className="text-base">
            Quero gerenciar minha agenda e atender pacientes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button 
            className="w-full bg-green-500 hover:bg-green-600 mb-4"
            onClick={() => onUserTypeSelection('medico')}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Processando..." : "Continuar como Médico"}
          </Button>
          <div className="text-sm text-gray-600">
            <h4 className="font-semibold mb-2">Como médico você pode:</h4>
            <ul className="space-y-1 text-xs">
              <li>✓ Gerenciar agenda de consultas</li>
              <li>✓ Visualizar dados dos pacientes</li>
              <li>✓ Emitir receitas digitais</li>
              <li>✓ Controlar fluxo do consultório</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserTypeCards;
