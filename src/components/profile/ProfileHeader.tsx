
import { Badge } from "@/components/ui/badge";
import { CardContent, CardHeader, CardTitle, Card } from "@/components/ui/card";
import { AvatarUpload } from "@/components/AvatarUpload";
import { Heart, Stethoscope } from "lucide-react";

interface ProfileHeaderProps {
  displayName: string;
  userType: 'paciente' | 'medico';
  currentPhotoUrl?: string;
  userId: string;
  onPhotoUpdate?: (newPhotoUrl: string) => void;
}

export const ProfileHeader = ({ 
  displayName, 
  userType, 
  currentPhotoUrl, 
  userId,
  onPhotoUpdate 
}: ProfileHeaderProps) => {
  const isDoctor = userType === 'medico';
  
  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center pb-4">
        {onPhotoUpdate ? (
          <div className="flex justify-center mb-4">
            <AvatarUpload
              currentPhotoUrl={currentPhotoUrl}
              userId={userId}
              displayName={displayName}
              onPhotoUpdate={onPhotoUpdate}
            />
          </div>
        ) : (
          <div className={`w-20 h-20 ${isDoctor ? 'bg-green-100' : 'bg-blue-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            {isDoctor ? (
              <Stethoscope className="w-10 h-10 text-green-600" />
            ) : (
              <Heart className="w-10 h-10 text-blue-600" />
            )}
          </div>
        )}
        <CardTitle className={`text-2xl ${isDoctor ? 'text-green-900' : 'text-blue-900'}`}>
          {isDoctor ? `Dr(a). ${displayName}` : displayName}
        </CardTitle>
        <div className="flex justify-center gap-2 mt-2">
          <Badge variant="secondary" className={isDoctor ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}>
            {isDoctor ? (
              <>
                <Stethoscope className="w-3 h-3 mr-1" />
                Médico
              </>
            ) : (
              <>
                <Heart className="w-3 h-3 mr-1" />
                Paciente
              </>
            )}
          </Badge>
          <Badge variant="outline" className={isDoctor ? "border-blue-200 text-blue-700" : "border-green-200 text-green-700"}>
            {isDoctor ? 'Verificado' : 'Ativo'}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );
};
