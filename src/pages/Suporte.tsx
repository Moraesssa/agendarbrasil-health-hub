import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  LifeBuoy,
  ArrowLeft,
  Mail,
  MessageSquare,
  ChevronDown,
  Send,
  Phone,
  Clock,
  Shield,
  Calendar,
  CreditCard,
  Users,
  Video,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido").max(255, "E-mail muito longo"),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000, "Mensagem deve ter no máximo 1000 caracteres"),
});

type ContactFormData = z.infer<typeof contactSchema>;

const faqCategories = [
  {
    icon: Calendar,
    title: "Agendamento",
    items: [
      {
        question: "Como agendar uma consulta?",
        answer:
          "Acesse a página de Agendamento, selecione a especialidade desejada, escolha o estado e cidade, depois selecione o médico e o horário disponível. Confirme seus dados e finalize o agendamento.",
      },
      {
        question: "Posso cancelar ou remarcar uma consulta?",
        answer:
          "Sim. Acesse seu histórico de consultas e clique em 'Cancelar' ou 'Remarcar'. Recomendamos fazer isso com pelo menos 24 horas de antecedência para evitar cobranças.",
      },
      {
        question: "Como funciona a lista de espera?",
        answer:
          "Quando não há horários disponíveis, você pode entrar na lista de espera. Assim que um horário for liberado, você será notificado automaticamente para confirmar o agendamento.",
      },
    ],
  },
  {
    icon: CreditCard,
    title: "Pagamentos",
    items: [
      {
        question: "Quais formas de pagamento são aceitas?",
        answer:
          "Aceitamos cartões de crédito, débito e PIX. Os pagamentos são processados de forma segura através do Stripe.",
      },
      {
        question: "Como solicitar reembolso?",
        answer:
          "Cancelamentos com mais de 24h de antecedência geram reembolso automático. Para outros casos, entre em contato com nosso suporte informando o número da consulta.",
      },
    ],
  },
  {
    icon: Video,
    title: "Teleconsulta",
    items: [
      {
        question: "Como funciona a teleconsulta?",
        answer:
          "No horário agendado, acesse o link da sala virtual enviado por e-mail. A videochamada acontece diretamente no navegador, sem necessidade de instalar aplicativos.",
      },
      {
        question: "Que equipamentos preciso para a teleconsulta?",
        answer:
          "Você precisa de um computador, tablet ou celular com câmera, microfone e conexão estável à internet. Recomendamos usar Chrome ou Firefox atualizados.",
      },
    ],
  },
  {
    icon: Users,
    title: "Conta e Perfil",
    items: [
      {
        question: "Como cadastrar membros da família?",
        answer:
          'Acesse "Gerenciar Família" no menu. Você pode adicionar dependentes e gerenciar permissões de agendamento, cancelamento e visualização de histórico para cada membro.',
      },
      {
        question: "Como alterar meus dados cadastrais?",
        answer:
          'Acesse seu Perfil clicando no ícone do usuário. Lá você pode atualizar nome, foto, dados de contato e preferências de notificação.',
      },
    ],
  },
  {
    icon: Shield,
    title: "Segurança e Privacidade",
    items: [
      {
        question: "Meus dados estão seguros?",
        answer:
          "Sim. Utilizamos criptografia de ponta a ponta, políticas de segurança em nível de linha (RLS) no banco de dados e seguimos as normas da LGPD para proteção de dados de saúde.",
      },
      {
        question: "Quem pode acessar meus dados médicos?",
        answer:
          "Apenas você e os médicos com quem você tem consultas ativas podem acessar seus dados. Familiares adicionados só visualizam o que você autorizar.",
      },
    ],
  },
];

const Suporte = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    // Simulate sending — in production, call an edge function
    await new Promise((r) => setTimeout(r, 1200));
    setIsSubmitting(false);
    form.reset();
    toast({
      title: "Mensagem enviada!",
      description:
        "Recebemos sua mensagem. Responderemos em até 24 horas úteis.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-foreground">
              Central de Ajuda
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-10">
        {/* Hero */}
        <section className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Como podemos ajudar?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Encontre respostas nas perguntas frequentes ou entre em contato com
            nossa equipe de suporte.
          </p>
        </section>

        {/* Quick contact cards */}
        <section className="grid sm:grid-cols-3 gap-4">
          <Card className="text-center border-border hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-2">
              <Mail className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium text-foreground">E-mail</p>
              <a
                href="mailto:suporte@agendarbrasil.com"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                suporte@agendarbrasil.com
              </a>
            </CardContent>
          </Card>
          <Card className="text-center border-border hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-2">
              <MessageSquare className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium text-foreground">WhatsApp</p>
              <a
                href="https://wa.me/550800000000"
                target="_blank"
                rel="noreferrer noopener"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Iniciar conversa
              </a>
            </CardContent>
          </Card>
          <Card className="text-center border-border hover:shadow-md transition-shadow">
            <CardContent className="pt-6 space-y-2">
              <Clock className="h-8 w-8 mx-auto text-primary" />
              <p className="font-medium text-foreground">Horário</p>
              <p className="text-sm text-muted-foreground">
                Seg–Sex, 8h às 18h
              </p>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">
            Perguntas Frequentes
          </h3>

          <div className="space-y-4">
            {faqCategories.map((cat) => (
              <Card key={cat.title} className="border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                    <cat.icon className="h-5 w-5 text-primary" />
                    {cat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Accordion type="single" collapsible className="w-full">
                    {cat.items.map((item, i) => (
                      <AccordionItem
                        key={i}
                        value={`${cat.title}-${i}`}
                        className="border-border"
                      >
                        <AccordionTrigger className="text-sm text-left text-foreground hover:text-primary">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact Form */}
        <section className="space-y-6 pb-12">
          <h3 className="text-xl font-semibold text-foreground">
            Envie sua mensagem
          </h3>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base text-foreground">
                Formulário de contato
              </CardTitle>
              <CardDescription>
                Preencha os campos abaixo e responderemos em até 24 horas úteis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome completo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-mail</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assunto</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o assunto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="agendamento">
                              Dúvida sobre agendamento
                            </SelectItem>
                            <SelectItem value="pagamento">
                              Problema com pagamento
                            </SelectItem>
                            <SelectItem value="teleconsulta">
                              Teleconsulta
                            </SelectItem>
                            <SelectItem value="conta">
                              Minha conta / Perfil
                            </SelectItem>
                            <SelectItem value="bug">
                              Reportar um problema
                            </SelectItem>
                            <SelectItem value="sugestao">
                              Sugestão de melhoria
                            </SelectItem>
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensagem</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva como podemos ajudar..."
                            className="min-h-[120px] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Enviando..." : "Enviar mensagem"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default Suporte;
