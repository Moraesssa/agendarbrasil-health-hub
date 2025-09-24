import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SupportCardProps {
  loading?: boolean;
}

export const SupportCard = ({ loading }: SupportCardProps) => {
  return (
    <Card className="border-blue-100/80 bg-gradient-to-br from-blue-50 via-white to-emerald-50 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold text-slate-900">
          <LifeBuoy className="h-5 w-5 text-blue-500" />
          Suporte dedicado
        </CardTitle>
        <CardDescription>
          Precisa de ajuda? Nossa equipe está pronta para atender você.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        <p>
          Entre em contato com nosso time de suporte para resolver dúvidas
          técnicas, configurar integrações ou otimizar o uso da plataforma.
        </p>
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start border-blue-200"
            disabled={loading}
            asChild
          >
            <a href="mailto:suporte@agendarbrasil.com" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              suporte@agendarbrasil.com
            </a>
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start border-blue-200"
            disabled={loading}
            asChild
          >
            <a
              href="https://wa.me/550800000000"
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Atendimento via WhatsApp
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};