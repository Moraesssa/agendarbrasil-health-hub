/**
 * SavedComparisons Component
 * Displays and manages saved location comparisons
 */

import React, { useState } from 'react';
import { 
  Building, 
  Calendar, 
  Trash2, 
  Edit3, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  FileText,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocationComparison, SavedComparison } from '@/hooks/useLocationComparison';
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
import { toast } from '@/components/ui/use-toast';

interface SavedComparisonsProps {
  onLoadComparison?: (locationIds: string[]) => void;
  className?: string;
}

interface ComparisonCardProps {
  comparison: SavedComparison;
  onLoad?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Individual comparison card component
const ComparisonCard: React.FC<ComparisonCardProps> = ({
  comparison,
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

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {comparison.name}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Building className="h-3 w-3 mr-1" />
                {comparison.locationIds.length} estabelecimento{comparison.locationIds.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                <Clock className="h-3 w-3 mr-1" />
                {getDaysAgo(comparison.createdAt)}
              </Badge>
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
                Carregar Comparação
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
        {comparison.notes && (
          <div className="mb-3 p-2 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 line-clamp-2">
              {comparison.notes}
            </p>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Criado em {formatDate(comparison.createdAt)}</span>
          </div>
        </div>
        
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoad}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            Carregar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const SavedComparisons: React.FC<SavedComparisonsProps> = ({
  onLoadComparison,
  className
}) => {
  const {
    savedComparisons,
    isLoading,
    deleteComparison,
    updateComparison,
    getComparisonStats,
    exportComparisons,
    importComparisons,
    clearAllComparisons
  } = useLocationComparison();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comparisonToDelete, setComparisonToDelete] = useState<string | null>(null);
  const [editingComparison, setEditingComparison] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const stats = getComparisonStats();

  // Handle delete confirmation
  const handleDeleteClick = (comparisonId: string) => {
    setComparisonToDelete(comparisonId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (comparisonToDelete) {
      const success = deleteComparison(comparisonToDelete);
      if (success) {
        toast({
          title: "Comparação excluída",
          description: "A comparação foi removida com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao excluir",
          description: "Não foi possível excluir a comparação.",
          variant: "destructive"
        });
      }
    }
    setDeleteDialogOpen(false);
    setComparisonToDelete(null);
  };

  // Handle edit name
  const handleEditClick = (comparison: SavedComparison) => {
    setEditingComparison(comparison.id);
    setEditName(comparison.name);
  };

  const handleEditSave = () => {
    if (editingComparison && editName.trim()) {
      const success = updateComparison(editingComparison, { name: editName.trim() });
      if (success) {
        toast({
          title: "Nome atualizado",
          description: "O nome da comparação foi atualizado com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível atualizar o nome da comparação.",
          variant: "destructive"
        });
      }
    }
    setEditingComparison(null);
    setEditName('');
  };

  // Handle load comparison
  const handleLoadComparison = (comparison: SavedComparison) => {
    if (onLoadComparison) {
      onLoadComparison(comparison.locationIds);
      toast({
        title: "Comparação carregada",
        description: `A comparação "${comparison.name}" foi carregada.`,
      });
    }
  };

  // Handle import
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const success = await importComparisons(file);
        if (success) {
          toast({
            title: "Importação concluída",
            description: "As comparações foram importadas com sucesso.",
          });
        } else {
          toast({
            title: "Erro na importação",
            description: "Não foi possível importar as comparações.",
            variant: "destructive"
          });
        }
      }
    };
    input.click();
  };

  // Handle export
  const handleExport = () => {
    const success = exportComparisons();
    if (success) {
      toast({
        title: "Exportação concluída",
        description: "As comparações foram exportadas com sucesso.",
      });
    } else {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar as comparações.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
              <FileText className="h-5 w-5 text-orange-600" />
              Comparações Salvas
            </CardTitle>
            {stats.totalComparisons > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {stats.totalComparisons} comparação{stats.totalComparisons !== 1 ? 'ões' : ''} salva{stats.totalComparisons !== 1 ? 's' : ''} • 
                {stats.recentComparisons} recente{stats.recentComparisons !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {savedComparisons.length > 0 && (
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
        {savedComparisons.length === 0 ? (
          <div className="text-center py-12">
            <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma comparação salva
            </h3>
            <p className="text-gray-600 mb-4">
              Você ainda não salvou nenhuma comparação de estabelecimentos.
            </p>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Importar Comparações
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedComparisons.map((comparison) => (
              <ComparisonCard
                key={comparison.id}
                comparison={comparison}
                onLoad={() => handleLoadComparison(comparison)}
                onEdit={() => handleEditClick(comparison)}
                onDelete={() => handleDeleteClick(comparison.id)}
              />
            ))}
          </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Comparação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta comparação? Esta ação não pode ser desfeita.
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
      {editingComparison && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit3 className="h-5 w-5" />
                Editar Nome da Comparação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome da Comparação
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingComparison(null)}
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

export default SavedComparisons;