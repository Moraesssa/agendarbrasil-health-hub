
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const AuthDebugInfo = () => {
  const { user, userData, loading } = useAuth();

  // Só mostra em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm text-yellow-800">Debug - Estado de Autenticação</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <Badge variant={user ? "default" : "destructive"}>
              {loading ? "Carregando..." : user ? "Logado" : "Não logado"}
            </Badge>
          </div>
          
          {user && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Email:</span>
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">User ID:</span>
                <span className="font-mono text-xs">{user.id}</span>
              </div>
            </>
          )}
          
          {userData && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Tipo:</span>
                <Badge variant={userData.userType === 'paciente' ? "default" : "secondary"}>
                  {userData.userType || "Não definido"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Nome:</span>
                <span>{userData.displayName || "Não informado"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-medium">Onboarding:</span>
                <Badge variant={userData.onboardingCompleted ? "default" : "destructive"}>
                  {userData.onboardingCompleted ? "Completo" : "Pendente"}
                </Badge>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
