/**
 * ComparisonExportShare Component
 * Funcionalidades avançadas de exportação e compartilhamento de comparações
 */

import React, { useState, useCallback } from 'react';
import { 
  Share2, 
  Download, 
  Copy, 
  Mail, 
  MessageCircle,
  FileText,
  Image,
  Link,
  QrCode,
  Printer,
  Save,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LocationWithTimeSlots } from '@/types/location';
import { 
  formatPhoneNumber,
  formatAddress,
  generateMapsUrl
} from '@/utils/locationUtils';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

interface ComparisonExportShareProps {
  locations: LocationWithTimeSlots[];
  comparisonTitle?: string;
  className?: string;
}

interface ShareData {
  title: string;
  locations: LocationWithTimeSlots[];
  summary: string;
  url?: string;
  customMessage?: string;
}

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<'svg'>>;
  extension: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Dados estruturados para desenvolvedores',
    icon: FileText,
    extension: 'json'
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Planilha compatível com Excel',
    icon: FileText,
    extension: 'csv'
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Documento formatado para impressão',
    icon: FileText,
    extension: 'pdf'
  }
];

export const ComparisonExportShare: React.FC<ComparisonExportShareProps> = ({
  locations,
  comparisonTitle = 'Comparação de Estabelecimentos',
  className
}) => {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  // Gerar resumo da comparação
  const comparisonSummary = useCallback(() => {
    if (locations.length === 0) return '';
    
    const locationNames = locations.map(loc => loc.nome_local).join(', ');
    const totalSlots = locations.reduce((sum, loc) => sum + loc.available_slots_count, 0);
    const openCount = locations.filter(loc => loc.is_open_now).length;
    
    return `Comparação de ${locations.length} estabelecimentos: ${locationNames}. Total de ${totalSlots} horários disponíveis. ${openCount} estabelecimento${openCount !== 1 ? 's' : ''} aberto${openCount !== 1 ? 's' : ''} agora.`;
  }, [locations]);

  // Gerar dados para compartilhamento
  const generateShareData = useCallback((): ShareData => ({
    title: comparisonTitle,
    locations,
    summary: comparisonSummary(),
    url: window.location.href,
    customMessage
  }), [comparisonTitle, locations, comparisonSummary, customMessage]);

  // Exportar como JSON
  const exportAsJSON = useCallback(() => {
    const exportData = {
      title: comparisonTitle,
      exportedAt: new Date().toISOString(),
      locations: locations.map(loc => ({
        nome: loc.nome_local,
        endereco: formatAddress(loc),
        telefone: loc.telefone ? formatPhoneNumber(loc.telefone) : null,
        email: loc.email,
        website: loc.website,
        status: loc.status,
        horarios_disponiveis: loc.available_slots_count,
        aberto_agora: loc.is_open_now,
        facilidades: loc.facilidades.filter(f => f.available).map(f => ({
          tipo: f.type,
          detalhes: f.details,
          custo: f.cost
        })),
        distancia_km: loc.distance_km,
        coordenadas: loc.coordenadas,
        horario_funcionamento: loc.horario_funcionamento,
        ultima_atualizacao: loc.ultima_atualizacao
      })),
      resumo: comparisonSummary(),
      total_estabelecimentos: locations.length,
      total_horarios: locations.reduce((sum, loc) => sum + loc.available_slots_count, 0)
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparacao-estabelecimentos-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado como JSON!",
      description: "O arquivo foi baixado com sucesso.",
    });
  }, [comparisonTitle, locations, comparisonSummary]);

  // Exportar como CSV
  const exportAsCSV = useCallback(() => {
    const headers = [
      'Nome',
      'Endereço',
      'Telefone',
      'Email',
      'Status',
      'Horários Disponíveis',
      'Aberto Agora',
      'Facilidades',
      'Distância (km)',
      'Última Atualização'
    ];

    const rows = locations.map(loc => [
      loc.nome_local,
      formatAddress(loc),
      loc.telefone ? formatPhoneNumber(loc.telefone) : '',
      loc.email || '',
      loc.status,
      loc.available_slots_count.toString(),
      loc.is_open_now ? 'Sim' : 'Não',
      loc.facilidades.filter(f => f.available).map(f => f.type).join('; '),
      loc.distance_km?.toString() || '',
      new Date(loc.ultima_atualizacao).toLocaleDateString('pt-BR')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `comparacao-estabelecimentos-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Exportado como CSV!",
      description: "O arquivo foi baixado com sucesso.",
    });
  }, [locations]);

  // Compartilhar via sistema nativo
  const shareViaSystem = useCallback(async () => {
    const shareData = generateShareData();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: shareData.title,
          text: `${shareData.summary}\n\n${shareData.customMessage || ''}`,
          url: shareData.url
        });
        
        toast({
          title: "Compartilhado!",
          description: "Comparação compartilhada com sucesso.",
        });
      } else {
        throw new Error('Sistema de compartilhamento não suportado');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Fallback para copiar para clipboard
      await copyToClipboard();
    }
  }, [generateShareData]);

  // Copiar para clipboard
  const copyToClipboard = useCallback(async () => {
    const shareData = generateShareData();
    const textToShare = `${shareData.title}\n\n${shareData.summary}\n\n${shareData.customMessage || ''}\n\n${shareData.url || ''}`;
    
    try {
      await navigator.clipboard.writeText(textToShare);
      toast({
        title: "Copiado!",
        description: "Comparação copiada para a área de transferência.",
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar para a área de transferência.",
        variant: "destructive"
      });
    }
  }, [generateShareData]);

  // Compartilhar via WhatsApp
  const shareViaWhatsApp = useCallback(() => {
    const shareData = generateShareData();
    const message = `${shareData.title}\n\n${shareData.summary}\n\n${shareData.customMessage || ''}\n\n${shareData.url || ''}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Abrindo WhatsApp...",
      description: "A comparação será compartilhada via WhatsApp.",
    });
  }, [generateShareData]);

  // Compartilhar via email
  const shareViaEmail = useCallback(() => {
    const shareData = generateShareData();
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(`${shareData.summary}\n\n${shareData.customMessage || ''}\n\nDetalhes:\n${locations.map(loc => 
      `• ${loc.nome_local}\n  ${formatAddress(loc)}\n  ${loc.telefone ? formatPhoneNumber(loc.telefone) : 'Telefone não informado'}\n  ${loc.available_slots_count} horário${loc.available_slots_count !== 1 ? 's' : ''} disponível${loc.available_slots_count !== 1 ? 'eis' : ''}\n`
    ).join('\n')}\n\n${shareData.url || ''}`);
    
    const emailUrl = recipientEmail 
      ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
    
    window.open(emailUrl, '_blank');
    
    toast({
      title: "Abrindo cliente de email...",
      description: "A comparação será enviada por email.",
    });
  }, [generateShareData, locations, recipientEmail]);

  // Imprimir comparação
  const printComparison = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const shareData = generateShareData();
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${shareData.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; border-bottom: 2px solid #f97316; padding-bottom: 10px; }
            h2 { color: #666; margin-top: 30px; }
            .location { margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .location-name { font-weight: bold; font-size: 18px; color: #333; }
            .location-details { margin-top: 10px; }
            .facility { display: inline-block; background: #f3f4f6; padding: 4px 8px; margin: 2px; border-radius: 4px; font-size: 12px; }
            .summary { background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>${shareData.title}</h1>
          <div class="summary">
            <strong>Resumo:</strong> ${shareData.summary}
          </div>
          ${shareData.customMessage ? `<p><strong>Observações:</strong> ${shareData.customMessage}</p>` : ''}
          <h2>Estabelecimentos Comparados</h2>
          ${locations.map(loc => `
            <div class="location">
              <div class="location-name">${loc.nome_local}</div>
              <div class="location-details">
                <p><strong>Endereço:</strong> ${formatAddress(loc)}</p>
                ${loc.telefone ? `<p><strong>Telefone:</strong> ${formatPhoneNumber(loc.telefone)}</p>` : ''}
                ${loc.email ? `<p><strong>Email:</strong> ${loc.email}</p>` : ''}
                <p><strong>Status:</strong> ${loc.status} ${loc.is_open_now ? '(Aberto agora)' : '(Fechado agora)'}</p>
                <p><strong>Horários disponíveis:</strong> ${loc.available_slots_count}</p>
                ${loc.distance_km ? `<p><strong>Distância:</strong> ${loc.distance_km.toFixed(1)}km</p>` : ''}
                <div>
                  <strong>Facilidades:</strong>
                  ${loc.facilidades.filter(f => f.available).map(f => `<span class="facility">${f.type}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
          <p style="margin-top: 30px; font-size: 12px; color: #666;">
            Gerado em ${new Date().toLocaleString('pt-BR')} - AgendarBrasil Health Hub
          </p>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    
    toast({
      title: "Preparando impressão...",
      description: "A comparação está sendo preparada para impressão.",
    });
  }, [generateShareData, locations]);

  if (locations.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Botão de Exportar */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={exportAsJSON}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar como JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportAsCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Exportar como CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={printComparison}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Comparação
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Botão de Compartilhar */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Compartilhar</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-orange-600" />
              Compartilhar Comparação
            </DialogTitle>
            <DialogDescription>
              Compartilhe esta comparação de estabelecimentos com outras pessoas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Resumo da Comparação */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                {comparisonSummary()}
              </p>
            </div>

            {/* Mensagem Personalizada */}
            <div className="space-y-2">
              <Label htmlFor="custom-message">Mensagem personalizada (opcional)</Label>
              <Textarea
                id="custom-message"
                placeholder="Adicione uma mensagem personalizada..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Email do Destinatário (para email) */}
            <div className="space-y-2">
              <Label htmlFor="recipient-email">Email do destinatário (opcional)</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="exemplo@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>

            {/* Opções de Compartilhamento */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={shareViaSystem}
                className="flex items-center gap-2 h-12"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Sistema</span>
              </Button>

              <Button
                variant="outline"
                onClick={copyToClipboard}
                className="flex items-center gap-2 h-12"
              >
                <Copy className="h-4 w-4" />
                <span className="text-sm">Copiar</span>
              </Button>

              <Button
                variant="outline"
                onClick={shareViaWhatsApp}
                className="flex items-center gap-2 h-12"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="flex items-center gap-2 h-12"
              >
                <Mail className="h-4 w-4" />
                <span className="text-sm">Email</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComparisonExportShare;