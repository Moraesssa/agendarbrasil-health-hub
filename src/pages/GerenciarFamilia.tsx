
import { useState } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { PatientSidebar } from '@/components/PatientSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, AlertCircle } from 'lucide-react';
import { useFamilyManagement } from '@/hooks/useFamilyManagement';
import { AddFamilyMemberDialog } from '@/components/family/AddFamilyMemberDialog';
import { FamilyMemberCard } from '@/components/family/FamilyMemberCard';
import { PageLoader } from '@/components/PageLoader';

const GerenciarFamilia = () => {
  const {
    familyMembers,
    loading,
    isSubmitting,
    addFamilyMember,
    updateFamilyMember,
    removeFamilyMember
  } = useFamilyManagement();

  if (loading) {
    return <PageLoader message="Carregando informações da família..." />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-green-50 to-blue-50">
        <PatientSidebar />
        <SidebarInset className="flex-1">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-green-100/50 bg-white/95 backdrop-blur-md shadow-sm px-6">
            <SidebarTrigger className="text-green-600 hover:bg-green-50" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-800 to-blue-600 bg-clip-text text-transparent">
                Gerenciar Família
              </h1>
              <p className="text-sm text-gray-600">
                Gerencie os membros da sua família e suas permissões
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Header com estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="flex items-center p-6">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Membros</p>
                      <p className="text-2xl font-bold">{familyMembers.length}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="flex items-center p-6">
                    <UserPlus className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Podem Agendar</p>
                      <p className="text-2xl font-bold">
                        {familyMembers.filter(m => m.can_schedule).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="flex items-center p-6">
                    <AlertCircle className="h-8 w-8 text-amber-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Administradores</p>
                      <p className="text-2xl font-bold">
                        {familyMembers.filter(m => m.permission_level === 'admin').length}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seção principal */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-green-600" />
                        Membros da Família
                      </CardTitle>
                      <CardDescription>
                        Gerencie os membros da sua família e suas permissões para agendamento de consultas
                      </CardDescription>
                    </div>
                    <AddFamilyMemberDialog 
                      onAdd={addFamilyMember}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {familyMembers.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-gray-900">
                        Nenhum membro adicionado
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Comece adicionando membros da sua família para gerenciar consultas em conjunto.
                      </p>
                      <div className="mt-6">
                        <AddFamilyMemberDialog 
                          onAdd={addFamilyMember}
                          isSubmitting={isSubmitting}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {familyMembers.map((member) => (
                        <FamilyMemberCard
                          key={member.id}
                          member={member}
                          onUpdate={updateFamilyMember}
                          onRemove={removeFamilyMember}
                          isSubmitting={isSubmitting}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Seção de ajuda */}
              <Card className="bg-green-50 border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Como funciona?</CardTitle>
                </CardHeader>
                <CardContent className="text-green-800 space-y-2">
                  <p>• <strong>Administrador:</strong> Pode gerenciar todos os membros e suas permissões</p>
                  <p>• <strong>Gerenciador:</strong> Pode agendar e cancelar consultas para todos os membros</p>
                  <p>• <strong>Visualizador:</strong> Pode apenas visualizar as consultas dos membros</p>
                  <p className="text-sm mt-4">
                    Os membros adicionados devem já possuir uma conta na plataforma.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default GerenciarFamilia;
