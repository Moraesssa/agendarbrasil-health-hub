
import { Controller, useFieldArray, Control } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FormItem, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, AlertCircle } from "lucide-react";
import { LocalAtendimento } from "@/services/locationService";
import { AgendaFormData } from "@/types/agenda";

interface DayScheduleControlProps {
  dia: { key: string; label: string };
  control: Control<AgendaFormData>;
  locais: LocalAtendimento[];
}

export const DayScheduleControl = ({ dia, control, locais }: DayScheduleControlProps) => {
  const { fields, append, remove } = useFieldArray({ control, name: `horarios.${dia.key}` });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dia.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.length === 0 && <p className="text-sm text-gray-500">Nenhum bloco de horário para este dia.</p>}
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="p-4 border rounded-lg space-y-3 bg-slate-50 relative"
            data-testid={`schedule-block-${dia.key}-${index}`}
          >
            <Controller
              control={control}
              name={`horarios.${dia.key}.${index}`}
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Switch checked={value?.ativo || false} onCheckedChange={(checked) => onChange({ ...value, ativo: checked })} />
                      <Label>Atendimento neste bloco</Label>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      data-testid={`remove-schedule-block-${dia.key}-${index}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <div className={`grid md:grid-cols-3 gap-4 ${!value?.ativo ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FormItem>
                      <Label>Início</Label>
                      <Input
                        data-testid={`schedule-start-${dia.key}-${index}`}
                        type="time"
                        value={value?.inicio || ''}
                        onChange={e => onChange({...value, inicio: e.target.value})}
                      />
                    </FormItem>
                    <FormItem>
                      <Label>Fim</Label>
                      <Input
                        data-testid={`schedule-end-${dia.key}-${index}`}
                        type="time"
                        value={value?.fim || ''}
                        onChange={e => onChange({...value, fim: e.target.value})}
                      />
                    </FormItem>
                    <FormItem>
                      <Label>Local</Label>
                      <Select onValueChange={val => onChange({...value, local_id: val})} value={value?.local_id || undefined}>
                        <SelectTrigger data-testid={`schedule-local-select-${dia.key}-${index}`}><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>
                          {locais.map((local: LocalAtendimento) => <SelectItem key={local.id} value={local.id}>{local.nome_local}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>
                  {error && <FormMessage className="text-xs text-red-500">{error.message}</FormMessage>}
                </>
              )}
            />
          </div>
        ))}
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={() => append({ 
            ativo: !(dia.key === 'sabado' || dia.key === 'domingo'),
            inicio: '08:00', 
            fim: '12:00', 
            local_id: null 
          })} 
          disabled={locais.length === 0}
        >
          <Plus className="mr-2 h-4 w-4" /> Adicionar Bloco
        </Button>
      </CardContent>
      {locais.length === 0 && (
        <CardFooter>
          <p className="text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            Você precisa cadastrar um local em "Meus Locais" antes de adicionar horários.
          </p>
        </CardFooter>
      )}
    </Card>
  );
};
