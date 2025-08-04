/**
 * SavedLocationPreferences Component
 * Gerenciamento de preferências de busca salvas pelo usuário
 */

import React, { useState } from 'react';
import { 
  Bookmark, 
  BookmarkCheck,
  Trash2, 
  Edit3, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Clock,
  MapPin,
  Filter,
  Star,
  Search,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationFilters } from '@/types/location';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface LocationSearchPreferences {
  id: string;
  name: string;
  searchQuery: string;
  filters: LocationFilters;
  sortBy: string;
  sortOrder: string;
  createdAt: string;
  lastUsed?: string;
  useCount?: number;
}

interface SavedLocationPreferencesProps {
  preferences: LocationSearchPreferences[];
  onLoadPreferences?: (preferences: LocationSearchPreferences) => void;
  onSavePreferences?: (preferences: LocationSearchPreferences) => void;
  onDeletePreferences?: (id: string) => void;
  onUpdatePreferences?: (id: string, updates: Partial<LocationSearchPreferences>) => void;
  className?: string;
}

interface PreferenceCardProps {
  preference: LocationSearchPreferences;
  onLoad?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Componente individual de preferência
const PreferenceCard: React.FC<PreferenceCardProps> = ({
  preference,
  onLoad,
  onEdit,
  onDelete
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) !== 1 ? 's' : ''} atrás`;
    return `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) !== 1 ? 'es' : ''} atrás`;
  };

  const getFilterSummary = () => {
    const summary = [];
    
    if (preference.searchQuery) {
      summary.push(`Busca: "${preference.searchQuery}"`);
    }
    
    if (preference.filters.cidade) {
      summary.push(`Cidade: ${preference.filters.cidade}`);
    }
    
    if (preference.filters.bairro) {
      summary.push(`Bairro: ${preference.filters.bairro}`);
    }
    
    if (preference.filters.max_distance_km) {
      summary.push(`Até ${preference.filters.max_distance_km}km`);
    }
    
    if (preference.filters.open_now) {
      summary.push('Apenas abertos');
    }
    
    if (preference.filters.has_parking) {
      summary.push('Com estacionamento');
    }
    
    if (preference.filters.is_accessible) {
      summary.push('Acessível');
    }
    
    if (preference.filters.facilidades && preference.filters.facilidades.length > 0) {
      summary.push(`${preference.filters.facilidades.length} facilidade${preference.filters.facilidades.length !== 1 ? 's' : ''}`);
    }
    
    return summary.length > 0 ? summary.join(' • ') : 'Sem filtros específicos';
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate flex items-center gap-2">
              <BookmarkCheck className="h-4 w-4 text-orange-600" />
              {preference.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                {getDaysAgo(preference.createdAt)}
              </Badge>
              {preference.useCount && preference.useCount > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Target className="h-3 w-3 mr-1" />
                  {preference.useCount} uso{preference.useCount !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onLoad}>
                <Eye className="h-4 w-4 mr-2" />
                Aplicar Filtros
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Edit3 className="h-4 w-4 mr-2" />
                Editar Nome
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Resumo dos Filtros */}
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 leading-relaxed">
              {getFilterSummary()}
            </p>
          </div>
          
          {/* Ordenação */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Filter className="h-3 w-3" />
            <span>
              Ordenado por {preference.sortBy} ({preference.sortOrder === 'asc' ? 'crescente' : 'decrescente'})
            </span>
          </div>
          
          {/* Data de Criação */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Criado em {formatDate(preference.createdAt)}</span>
            </div>
            {preference.lastUsed && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                <span>Usado em {formatDate(preference.lastUsed)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Aplicar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const SavedLocationPreferences: React.FC<SavedLocationPreferencesProps> = ({
  preferences,
  onLoadPreferences,
  onSavePreferences,
  onDeletePreferences,
  onUpdatePreferences,
  className
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [preferenceToDelete, setPreferenceToDelete] = useState<string | null>(null);
  const [editingPreference, setEditingPreference] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Handle delete confirmation
  const handleDeleteClick = (preferenceId: string) => {
    setPreferenceToDelete(preferenceId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (preferenceToDelete && onDeletePreferences) {
      onDeletePreferences(preferenceToDelete);
      toast({
        title: "Preferência excluída",
        description: "A preferência foi removida com sucesso.",
      });
    }
    setDeleteDialogOpen(false);
    setPreferenceToDelete(null);
  };

  // Handle edit name
  const handleEditClick = (preference: LocationSearchPreferences) => {
    setEditingPreference(preference.id);
    setEditName(preference.name);
  };

  const handleEditSave = () => {
    if (editingPreference && editName.trim() && onUpdatePreferences) {
      onUpdatePreferences(editingPreference, { name: editName.trim() });
      toast({
        title: "Nome atualizado",
        description: "O nome da preferência foi atualizado com sucesso.",
      });
    }
    setEditingPreference(null);
    setEditName('');
  };

  // Handle load preference
  const handleLoadPreference = (preference: LocationSearchPreferences) => {
    if (onLoadPreferences) {
      // Atualizar contador de uso e última utilização
      if (onUpdatePreferences) {
        onUpdatePreferences(preference.id, {
          lastUsed: new Date().toISOString(),
          useCount: (preference.useCount || 0) + 1
        });
      }
      
      onLoadPreferences(preference);
      toast({
        title: "Preferência aplicada",
        description: `Os filtros "${preference.name}" foram aplicados.`,
      });
    }
  };

  // Export preferences
  const handleExport = () => {
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      preferences: preferences,
      totalCount: preferences.length
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `preferencias-busca-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado!",
      description: "As preferências foram exportadas com sucesso.",
    });
  };

  // Import preferences
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importData = JSON.parse(content);
            
            if (importData.preferences && Array.isArray(importData.preferences)) {
              importData.preferences.forEach((pref: LocationSearchPreferences) => {
                if (onSavePreferences) {
                  onSavePreferences({
                    ...pref,
                    id: `imported_${Date.now()}_${Math.random()}`,
                    createdAt: new Date().toISOString()
                  });
                }
              });
              
              toast({
                title: "Importação concluída",
                description: `${importData.preferences.length} preferência${importData.preferences.length !== 1 ? 's' : ''} importada${importData.preferences.length !== 1 ? 's' : ''}.`,
              });
            } else {
              throw new Error('Formato inválido');
            }
          } catch (error) {
            toast({
              title: "Erro na importação",
              description: "Não foi possível importar as preferências. Verifique o formato do arquivo.",
              variant: "destructive"
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Ordenar preferências por uso e data
  const sortedPreferences = [...preferences].sort((a, b) => {
    // Primeiro por uso (mais usadas primeiro)
    const useCountA = a.useCount || 0;
    const useCountB = b.useCount || 0;
    if (useCountA !== useCountB) {
      return useCountB - useCountA;
    }
    
    // Depois por data de última utilização
    if (a.lastUsed && b.lastUsed) {
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    }
    
    // Por último, por data de criação
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <Bookmark className="h-5 w-5 text-orange-600" />
              Preferências Salvas
            </CardTitle>
            {preferences.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {preferences.length} preferência{preferences.length !== 1 ? 's' : ''} salva{preferences.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {preferences.length > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {preferences.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Bookmark className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma preferência salva
            </h3>
            <p className="text-gray-600 mb-4">
              Você ainda não salvou nenhuma preferência de busca. Configure seus filtros favoritos e salve para uso futuro.
            </p>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Preferências
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedPreferences.map((preference) => (
              <PreferenceCard
                key={preference.id}
                preference={preference}
                onLoad={() => handleLoadPreference(preference)}
                onEdit={() => handleEditClick(preference)}
                onDelete={() => handleDeleteClick(preference.id)}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Preferência</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta preferência de busca? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Name Dialog */}
      {editingPreference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Editar Nome da Preferência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome da Preferência
                </Label>
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingPreference(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleEditSave}
                  className="flex-1"
                  disabled={!editName.trim()}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default SavedLocationPreferences;