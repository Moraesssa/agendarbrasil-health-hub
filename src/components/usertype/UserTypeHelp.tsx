
import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const UserTypeHelp = () => {
  return (
    <div className="text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <HelpCircle className="w-5 h-5 text-yellow-600" />
          <h4 className="font-semibold text-yellow-800">Não tem certeza?</h4>
        </div>
        <p className="text-sm text-yellow-700 mb-3">
          Você pode alterar esta configuração depois no seu perfil. Escolha a opção que melhor se adequa ao seu uso principal.
        </p>
        <Button variant="outline" size="sm" className="text-yellow-700 border-yellow-300">
          Preciso de ajuda para decidir
        </Button>
      </div>
    </div>
  );
};

export default UserTypeHelp;
