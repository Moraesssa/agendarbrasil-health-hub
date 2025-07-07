import { useState, useEffect } from 'react';
import { PatientDocument } from '@/types/documents';
import { documentService } from '@/services/documentService';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import { useAuth } from '@/contexts/AuthContext';

export const useDocuments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadDocuments = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await documentService.getDocuments();
      setDocuments(data);
    } catch (error) {
      logger.error("Error loading documents", "useDocuments", error);
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar seus documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (file: File, documentName: string, documentType: string) => {
    try {
      setUploading(true);
      const newDocument = await documentService.uploadDocument(file, documentName, documentType);
      setDocuments(prev => [newDocument, ...prev]);
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error uploading document", "useDocuments", error);
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string) => {
    try {
      await documentService.deleteDocument(documentId);
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      toast({
        title: "Documento removido",
        description: "O documento foi removido com sucesso",
      });
      return true;
    } catch (error) {
      logger.error("Error deleting document", "useDocuments", error);
      toast({
        title: "Erro ao remover documento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
      return false;
    }
  };

  const getDocumentUrl = async (storagePath: string): Promise<string> => {
    try {
      return await documentService.getDocumentUrl(storagePath);
    } catch (error) {
      logger.error("Error getting document URL", "useDocuments", error);
      throw error;
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [user]);

  return {
    documents,
    loading,
    uploading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    refetch: loadDocuments
  };
};