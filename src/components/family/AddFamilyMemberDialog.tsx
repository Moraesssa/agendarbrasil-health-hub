
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { UserPlus, Loader2 } from 'lucide-react';
import { AddFamilyMemberData } from '@/types/family';

const addFamilyMemberSchema = z.object({
  email: z.string().email('Email inválido'),
  relationship: z.enum(['spouse', 'child', 'parent', 'sibling', 'other']),
  permission_level: z.enum(['admin', 'manager', 'viewer']),
  can_schedule: z.boolean(),
  can_view_history: z.boolean(),
  can_cancel: z.boolean(),
});

interface AddFamilyMemberDialogProps {
  onAdd: (data: AddFamilyMemberData) => Promise<boolean>;
  isSubmitting?: boolean;
}

const relationshipLabels = {
  spouse: 'Cônjuge',
  child: 'Filho(a)',
  parent: 'Pai/Mãe',
  sibling: 'Irmão/Irmã',
  other: 'Outro'
};

const permissionLabels = {
  admin: 'Administrador',
  manager: 'Gerenciador',
  viewer: 'Visualizador'
};

export const AddFamilyMemberDialog = ({ onAdd, isSubmitting = false }: AddFamilyMemberDialogProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<AddFamilyMemberData>({
    resolver: zodResolver(addFamilyMemberSchema),
    defaultValues: {
      email: '',
      relationship: 'other',
      permission_level: 'viewer',
      can_schedule: false,
      can_view_history: true,
      can_cancel: false,
    },
  });

  const handleSubmit = async (data: AddFamilyMemberData) => {
    const success = await onAdd(data);
    if (success) {
      setOpen(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Adicionar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Membro da Família</DialogTitle>
          <DialogDescription>
            Adicione um membro da família para gerenciar consultas em conjunto.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationship"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relacionamento</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o relacionamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(relationshipLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permission_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível de Permissão</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o nível" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(permissionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormField
                control={form.control}
                name="can_schedule"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Pode agendar consultas</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_view_history"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Pode ver histórico</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="can_cancel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Pode cancelar consultas</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Adicionar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
