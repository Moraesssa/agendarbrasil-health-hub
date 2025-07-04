
import { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const specialtyFormSchema = z.object({
  selectedSpecialties: z.array(z.string()).min(1, "Selecione pelo menos uma especialidade"),
  customSpecialty: z.string().optional()
});

type SpecialtyFormData = z.infer<typeof specialtyFormSchema>;

interface SpecialtyMultiSelectProps {
  initialSpecialties?: string[];
  onChange: (specialties: string[]) => void;
}

export const SpecialtyMultiSelect = ({ 
  initialSpecialties = [], 
  onChange 
}: SpecialtyMultiSelectProps) => {
  const [availableSpecialties, setAvailableSpecialties] = useState<string[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(initialSpecialties);
  const [searchTerm, setSearchTerm] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const loadAvailableSpecialties = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('especialidades_medicas')
        .select('nome')
        .eq('ativa', true)
        .order('nome');

      if (error) {
        console.error("Erro ao carregar especialidades:", error);
        toast({
          title: "Erro ao carregar especialidades",
          description: "Não foi possível carregar a lista de especialidades.",
          variant: "destructive",
        });
        return;
      }

      const specialties = data?.map(item => item.nome) || [];
      setAvailableSpecialties(specialties);
    } catch (error) {
      console.error("Erro ao carregar especialidades:", error);
      toast({
        title: "Erro ao carregar especialidades",
        description: "Erro inesperado ao carregar especialidades.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregar especialidades padronizadas
  useEffect(() => {
    loadAvailableSpecialties();
  }, [loadAvailableSpecialties]);

  // Notificar mudanças para o componente pai
  useEffect(() => {
    onChange(selectedSpecialties);
  }, [selectedSpecialties, onChange]);

  const filteredSpecialties = availableSpecialties.filter(specialty =>
    specialty.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedSpecialties.includes(specialty)
  );

  const addSpecialty = (specialty: string) => {
    if (!selectedSpecialties.includes(specialty)) {
      setSelectedSpecialties([...selectedSpecialties, specialty]);
    }
  };

  const removeSpecialty = (specialty: string) => {
    setSelectedSpecialties(selectedSpecialties.filter(s => s !== specialty));
  };

  const addCustomSpecialty = () => {
    if (customSpecialty.trim() && !selectedSpecialties.includes(customSpecialty.trim())) {
      setSelectedSpecialties([...selectedSpecialties, customSpecialty.trim()]);
      setCustomSpecialty("");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Especialidades</Label>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-gray-500">Carregando especialidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Especialidades Médicas</Label>
      
      {/* Especialidades selecionadas */}
      {selectedSpecialties.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSpecialties.map(specialty => (
            <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
              {specialty}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-500" 
                onClick={() => removeSpecialty(specialty)}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Busca de especialidades */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar especialidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de especialidades disponíveis */}
      {searchTerm && (
        <Card className="max-h-40 overflow-y-auto">
          <CardContent className="p-2">
            {filteredSpecialties.length > 0 ? (
              <div className="space-y-1">
                {filteredSpecialties.map(specialty => (
                  <Button
                    key={specialty}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-8"
                    onClick={() => {
                      addSpecialty(specialty);
                      setSearchTerm("");
                    }}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    {specialty}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 p-2">Nenhuma especialidade encontrada</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Adicionar especialidade customizada */}
      <div className="border-t pt-4">
        <Label className="text-sm text-gray-600">Adicionar especialidade personalizada</Label>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="Digite uma especialidade não listada..."
            value={customSpecialty}
            onChange={(e) => setCustomSpecialty(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustomSpecialty();
              }
            }}
          />
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={addCustomSpecialty}
            disabled={!customSpecialty.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedSpecialties.length === 0 && (
        <p className="text-sm text-red-500">
          Selecione pelo menos uma especialidade
        </p>
      )}
    </div>
  );
};
