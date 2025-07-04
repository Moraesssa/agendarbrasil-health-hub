import { useState, useEffect, useCallback } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Edit } from "lucide-react";
import locationService, { LocalAtendimento } from "@/services/locationService";
import { PageLoader } from "@/components/PageLoader";
import { EnderecoForm } from "@/components/onboarding/forms/EnderecoForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const GerenciarLocais = () => {
    const [locais, setLocais] = useState<LocalAtendimento[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchLocais = useCallback(async () => {
        try {
            setLoading(true);
            const data = await locationService.getLocations();
            setLocais(data);
        } catch (error) {
            toast({ title: "Erro ao buscar locais", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchLocais();
    }, [fetchLocais]);
    
    const handleAddLocal = async (formData: any) => {
        try {
            await locationService.addLocation({
                nome_local: formData.nome_local,
                endereco: formData.endereco,
                telefone: formData.telefone,
            });
            toast({ title: "Local adicionado com sucesso!" });
            setIsDialogOpen(false);
            fetchLocais(); // Atualiza a lista
        } catch (error) {
            toast({ title: "Erro ao adicionar local", description: (error as Error).message, variant: "destructive" });
        }
    };


    if (loading) return <PageLoader message="Carregando locais..." />;

    return (
        <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-green-50">
                <AppSidebar />
                <SidebarInset className="flex-1">
                    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b bg-white/95 px-6">
                        <SidebarTrigger />
                        <h1 className="text-2xl font-bold text-gray-800">Meus Locais de Atendimento</h1>
                    </header>
                    <main className="p-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Locais Cadastrados</CardTitle>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button><Plus className="mr-2 h-4 w-4" /> Adicionar Local</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Adicionar Novo Local</DialogTitle>
                                        </DialogHeader>
                                        <NovoLocalForm onSubmit={handleAddLocal} />
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {locais.length === 0 ? (
                                    <p>Nenhum local de atendimento cadastrado.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {locais.map(local => (
                                            <div key={local.id} className="p-4 border rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{local.nome_local}</p>
                                                    <p className="text-sm text-gray-600">{local.endereco.logradouro}, {local.endereco.numero}</p>
                                                </div>
                                                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
};

// Formulário para adicionar um novo local
const NovoLocalForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
    const [nomeLocal, setNomeLocal] = useState('');
    const [telefone, setTelefone] = useState('');
    
    const handleNext = (data: any) => {
        onSubmit({
            nome_local: nomeLocal,
            telefone: telefone,
            endereco: data.endereco
        });
    }

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="nome_local">Nome do Local</Label>
                <Input id="nome_local" value={nomeLocal} onChange={e => setNomeLocal(e.target.value)} placeholder="Ex: Clínica Centro" />
            </div>
             <div>
                <Label htmlFor="telefone">Telefone (Opcional)</Label>
                <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(XX) XXXX-XXXX" />
            </div>
            <EnderecoForm onNext={handleNext} />
        </div>
    );
};


export default GerenciarLocais;