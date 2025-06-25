
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

interface UserTypeNavigationProps {
  onBackToLogin: () => void;
  onGoHome: () => void;
  isSubmitting: boolean;
}

const UserTypeNavigation: React.FC<UserTypeNavigationProps> = ({ 
  onBackToLogin, 
  onGoHome, 
  isSubmitting 
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <Button
        variant="ghost"
        onClick={onBackToLogin}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
        disabled={isSubmitting}
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar ao Login
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onGoHome}
        className="flex items-center gap-2"
        disabled={isSubmitting}
      >
        <Home className="w-4 h-4" />
        Início
      </Button>
    </div>
  );
};

export default UserTypeNavigation;
