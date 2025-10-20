import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, MapPin } from 'lucide-react';

export default function GerenciarLocaisV2() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Locais de Atendimento</h1>
            <p className="text-muted-foreground">Configure os locais onde você atende</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Local
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Seus Locais de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Funcionalidade em desenvolvimento</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
