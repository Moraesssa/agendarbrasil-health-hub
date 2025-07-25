
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Download, Trash2, Eye, Calendar } from 'lucide-react';
import { PatientDocument, DOCUMENT_TYPES } from '@/types/documents';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentListProps {
  documents: PatientDocument[];
  loading: boolean;
  onDelete: (documentId: string) => Promise<boolean>;
  onGetUrl: (storagePath: string) => Promise<string>;
}

export const DocumentList = ({ documents, loading, onDelete, onGetUrl }: DocumentListProps) => {
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  const handleView = async (document: PatientDocument) => {
    try {
      setLoadingUrl(document.id);
      const url = await onGetUrl(document.storage_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error getting document URL:', error);
    } finally {
      setLoadingUrl(null);
    }
  };

  const handleDownload = async (document: PatientDocument) => {
    try {
      setLoadingUrl(document.id);
      const url = await onGetUrl(document.storage_path);
      
      // Create temporary link to download file
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.document_name;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    } finally {
      setLoadingUrl(null);
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES[type as keyof typeof DOCUMENT_TYPES] || type;
  };

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      exame_laboratorial: 'bg-blue-100 text-blue-800 border-blue-200',
      laudo_imagem: 'bg-purple-100 text-purple-800 border-purple-200',
      receita_medica: 'bg-green-100 text-green-800 border-green-200',
      atestado_medico: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      relatorio_medico: 'bg-orange-100 text-orange-800 border-orange-200',
      cartao_vacina: 'bg-pink-100 text-pink-800 border-pink-200',
      outro: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type] || colors.outro;
  };

  if (loading) {
    return (
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5" />
            Meus Documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileText className="h-5 w-5 text-blue-600" />
          Meus Documentos
          {documents.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {documents.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {documents.length === 0 ? (
          <div className="text-center py-8 space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="text-muted-foreground mb-2">Nenhum documento enviado ainda</p>
              <p className="text-sm text-muted-foreground/80">
                Comece enviando seus exames e documentos médicos
              </p>
            </div>
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground text-sm leading-snug truncate mb-1">
                    {document.document_name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {format(new Date(document.uploaded_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <Badge className={`text-xs w-fit ${getDocumentTypeColor(document.document_type)}`}>
                    {getDocumentTypeLabel(document.document_type)}
                  </Badge>
                </div>
              </div>
              
              {/* Mobile-first button layout */}
              <div className="flex flex-col xs:flex-row gap-1.5 xs:gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(document)}
                  disabled={loadingUrl === document.id}
                  className="h-8 px-2 xs:px-3 text-xs gap-1.5 min-w-0"
                >
                  <Eye className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden xs:inline">Ver</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(document)}
                  disabled={loadingUrl === document.id}
                  className="h-8 px-2 xs:px-3 text-xs gap-1.5 min-w-0"
                >
                  <Download className="h-3 w-3 flex-shrink-0" />
                  <span className="hidden xs:inline">
                    {loadingUrl === document.id ? '...' : 'Baixar'}
                  </span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-2 xs:px-3 text-xs gap-1.5 min-w-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 flex-shrink-0" />
                      <span className="hidden xs:inline">Excluir</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="mx-4 max-w-sm sm:max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                      <AlertDialogDescription className="text-sm">
                        Tem certeza de que deseja excluir o documento "{document.document_name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col xs:flex-row gap-2">
                      <AlertDialogCancel className="w-full xs:w-auto">Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(document.id)}
                        className="w-full xs:w-auto bg-red-600 hover:bg-red-700"
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
