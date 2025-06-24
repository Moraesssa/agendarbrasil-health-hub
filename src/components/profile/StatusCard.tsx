
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Stethoscope } from "lucide-react";
import { BaseUser } from "@/types/user";

interface StatusCardProps {
  userData: BaseUser;
}

export const StatusCard = ({ userData }: StatusCardProps) => {
  const isDoctor = userData.userType === 'medico';
  
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {isDoctor ? (
            <>
              <Stethoscope className="w-5 h-5 text-green-600" />
              Status Profissional
            </>
          ) : (
            <>
              <Heart className="w-5 h-5 text-green-600" />
              Status da Conta
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isDoctor && (
          <>
            <div>
              <label className="text-sm font-medium text-gray-600">Especialidades</label>
              <p className="text-gray-900">{userData.especialidades?.join(', ') || 'Não informado'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">CRM</label>
              <p className="text-gray-900">{userData.crm || 'Não informado'}</p>
            </div>
          </>
        )}
        <div>
          <label className="text-sm font-medium text-gray-600">Tipo de Usuário</label>
          <p className="text-gray-900 capitalize">{userData.userType}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Cadastro Completo</label>
          <p className="text-gray-900">
            {userData.onboardingCompleted ? 'Sim' : 'Não'}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <Badge variant="outline" className={isDoctor ? "border-green-200 text-green-700" : "border-green-200 text-green-700"}>
            Ativo
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
