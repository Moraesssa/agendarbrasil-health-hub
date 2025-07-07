import { supabase } from '@/integrations/supabase/client';
import { PatientDocument } from '@/types/documents';
import { logger } from '@/utils/logger';

export const documentService = {
  async getDocuments(): Promise<PatientDocument[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar documentos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      logger.error("Falha ao buscar documentos", "DocumentService", error);
      throw error;
    }
  },

  async uploadDocument(file: File, documentName: string, documentType: string): Promise<PatientDocument> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado");
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentName', documentName);
      formData.append('documentType', documentType);

      const { data, error } = await supabase.functions.invoke('upload-document', {
        body: formData,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(`Erro no upload: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro desconhecido no upload');
      }

      return data.document;
    } catch (error) {
      logger.error("Falha no upload de documento", "DocumentService", error);
      throw error;
    }
  },

  async deleteDocument(documentId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get document to get storage path
      const { data: document, error: fetchError } = await supabase
        .from('patient_documents')
        .select('storage_path')
        .eq('id', documentId)
        .eq('patient_id', user.id)
        .single();

      if (fetchError) {
        throw new Error(`Documento não encontrado: ${fetchError.message}`);
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('health-documents')
        .remove([document.storage_path]);

      if (storageError) {
        logger.error("Erro ao deletar arquivo do storage", "DocumentService", storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_documents')
        .delete()
        .eq('id', documentId)
        .eq('patient_id', user.id);

      if (dbError) {
        throw new Error(`Erro ao deletar documento: ${dbError.message}`);
      }
    } catch (error) {
      logger.error("Falha ao deletar documento", "DocumentService", error);
      throw error;
    }
  },

  async getDocumentUrl(storagePath: string): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from('health-documents')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) {
        throw new Error(`Erro ao gerar URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      logger.error("Falha ao gerar URL do documento", "DocumentService", error);
      throw error;
    }
  }
};