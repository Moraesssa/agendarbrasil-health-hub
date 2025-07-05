import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createHealthMetric, getPatientProfileByUserId } from '@/services/healthService';

const formSchema = z.object({
  metric_type: z.enum(['blood_pressure', 'weight', 'blood_glucose']),
  value: z.string().min(1, 'Valor é obrigatório'),
  systolic: z.string().optional(),
  diastolic: z.string().optional(),
  unit: z.string().min(1, 'Unidade é obrigatória'),
}).refine(data => {
    if (data.metric_type === 'blood_pressure') {
        return !!data.systolic && !!data.diastolic;
    }
    return true;
}, {
    message: 'Pressão sistólica e diastólica são obrigatórias',
    path: ['systolic'],
});

type FormValues = z.infer<typeof formSchema>;

const AdicionarMetrica = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      metric_type: 'weight',
      value: '',
      systolic: '',
      diastolic: '',
      unit: 'kg',
    },
  });

  const metricType = form.watch('metric_type');

  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (user) {
        try {
          setIsLoading(true);
          const profile = await getPatientProfileByUserId(user.id);
          if (profile) {
            setPatientId(profile.id);
          } else {
            setError('Perfil de paciente não encontrado.');
            toast({
              title: 'Erro',
              description: 'Não foi possível encontrar o perfil do paciente associado a este usuário.',
              variant: 'destructive',
            });
          }
        } catch (err) {
          setError('Falha ao buscar o perfil do paciente.');
          toast({
            title: 'Erro',
            description: 'Ocorreu um erro ao buscar seus dados. Tente novamente mais tarde.',
            variant: 'destructive',
          });
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setError('Usuário não autenticado.');
        navigate('/login');
      }
    };

    fetchPatientProfile();
  }, [user, navigate, toast]);

  const onSubmit = async (values: FormValues) => {
    console.log('--- DEBUG INÍCIO ---');
    console.log('Usuário autenticado (user):', user);
    console.log('ID do Paciente (patientId state):', patientId);

    if (!user || !patientId) {
        toast({
            title: 'Erro',
            description: 'Dados do paciente não carregados. Não é possível adicionar a métrica.',
            variant: 'destructive',
        });
        return;
    }

    setIsSubmitting(true);

    try {
        const metricData = {
            patient_id: patientId,
            metric_type: values.metric_type,
            value: values.metric_type === 'blood_pressure'
                ? { systolic: Number(values.systolic), diastolic: Number(values.diastolic) }
                : Number(values.value),
            unit: values.unit,
            recorded_at: new Date().toISOString(),
        };

        // Adicione este log logo antes da chamada a createHealthMetric
        console.log('Dados enviados para createHealthMetric (metricData):', metricData);
        console.log('--- DEBUG FIM ---');
        await createHealthMetric(metricData as any);

        toast({
            title: 'Sucesso!',
            description: 'Métrica de saúde adicionada com sucesso.',
        });
        navigate('/historico');
    } catch (error) {
        console.error('Failed to create health metric:', error);
        toast({
            title: 'Erro',
            description: 'Não foi possível adicionar a métrica de saúde. Tente novamente.',
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/historico')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o Histórico
        </Button>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Adicionar Nova Métrica de Saúde</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo para registrar uma nova métrica.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-center mb-4">Carregando dados do paciente...</p>}
            {!isLoading && !patientId && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro de Carregamento</AlertTitle>
                <AlertDescription>
                  Não foi possível encontrar um perfil de paciente associado à sua conta. Não é possível adicionar métricas.
                </AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="metric_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Métrica</FormLabel>
                      <Select onValueChange={(value) => {
                          field.onChange(value);
                          if (value === 'weight') form.setValue('unit', 'kg');
                          else if (value === 'blood_glucose') form.setValue('unit', 'mg/dL');
                          else if (value === 'blood_pressure') form.setValue('unit', 'mmHg');
                      }} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de métrica" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weight">Peso</SelectItem>
                          <SelectItem value="blood_glucose">Glicemia</SelectItem>
                          <SelectItem value="blood_pressure">Pressão Arterial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {metricType === 'blood_pressure' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="systolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pressão Sistólica</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ex: 120" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="diastolic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pressão Diastólica</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Ex: 80" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ) : (
                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Insira o valor" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: kg, mg/dL, mmHg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isLoading || isSubmitting || !patientId} className="w-full">
                  {isSubmitting || isLoading ? 'Carregando...' : 'Salvar Métrica'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdicionarMetrica;