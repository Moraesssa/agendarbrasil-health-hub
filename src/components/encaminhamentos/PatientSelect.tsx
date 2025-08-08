import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from '@/components/ui/command';
import { patientService, PatientProfile } from '@/services/patientService';
import { cn } from '@/lib/utils';

export type PatientOption = { id: string; display_name: string; email?: string | null };

interface PatientSelectProps {
  value: PatientOption | null;
  onChange: (patient: PatientOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function PatientSelect({ value, onChange, placeholder = 'Selecionar paciente', disabled }: PatientSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PatientProfile[]>([]);

  // Debounced search
  useEffect(() => {
    let active = true;
    const handler = setTimeout(async () => {
      if (query.trim().length < 2) {
        if (active) setResults([]);
        return;
      }
      setLoading(true);
      const data = await patientService.searchPatients(query);
      if (active) setResults(data);
      setLoading(false);
    }, 300);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [query]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    return value.display_name + (value.email ? ` • ${value.email}` : '');
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar paciente por nome ou email..."
          />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Carregando...' : query.trim().length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum paciente encontrado'}
            </CommandEmpty>
            <CommandGroup heading="Pacientes">
              {results.map((p) => (
                <CommandItem
                  key={p.id}
                  value={`${p.display_name ?? ''} ${p.email ?? ''}`}
                  onSelect={() => {
                    onChange({ id: p.id, display_name: p.display_name ?? 'Paciente', email: p.email });
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value?.id === p.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm">{p.display_name}</span>
                    <span className="text-xs text-muted-foreground">{p.email}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
