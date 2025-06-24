
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, User } from "lucide-react";
import { BaseUser } from "@/types/user";

interface ContactInfoCardProps {
  userData: BaseUser;
}

export const ContactInfoCard = ({ userData }: ContactInfoCardProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="w-5 h-5 text-blue-600" />
          Informações de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-600">Email</label>
          <p className="text-gray-900">{userData.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Membro desde</label>
          <p className="text-gray-900">
            {new Date(userData.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Último acesso</label>
          <p className="text-gray-900">
            {new Date(userData.lastLogin).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
