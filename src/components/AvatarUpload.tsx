
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  currentPhotoUrl?: string;
  userId: string;
  displayName: string;
  onPhotoUpdate: (newPhotoUrl: string) => void;
}

export const AvatarUpload = ({ 
  currentPhotoUrl, 
  userId, 
  displayName,
  onPhotoUpdate 
}: AvatarUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho do arquivo (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Nome do arquivo usando o ID do usuário como pasta
      const fileExtension = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExtension}`;

      // Upload para o bucket avatars
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true // Substitui o arquivo se já existir
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública da imagem
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newPhotoUrl = urlData.publicUrl;

      // Atualizar a tabela profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: newPhotoUrl })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Notificar o componente pai sobre a atualização
      onPhotoUpdate(newPhotoUrl);

      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso!",
      });

    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao atualizar a foto de perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="relative group">
      <Avatar className="w-20 h-20">
        <AvatarImage 
          src={currentPhotoUrl} 
          alt={displayName}
        />
        <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
          {displayName?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      
      {/* Overlay com botão de editar */}
      <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <Button
          onClick={handleFileSelect}
          disabled={isUploading}
          size="sm"
          className="rounded-full w-8 h-8 p-0"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Edit className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
