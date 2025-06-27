interface Horario {
inicio: string;
fim: string;
ativo: boolean;
}

interface HorarioAtendimento {
[key: string]: Horario;
}

interface ConfiguracoesFormProps {
onNext: (data: any) => void;
initialData?: any;
}

const diasDaSemana = [
{ key: "segunda", label: "Segunda-feira" },
{ key: "terca", label: "Terça-feira" },
{ key: "quarta", label: "Quarta-feira" },
{ key: "quinta", label: "Quinta-feira" },
{ key: "sexta", label: "Sexta-feira" },
{ key: "sabado", label: "Sábado" },
{ key: "domingo", label: "Domingo" },
];

const horarioPadrao: HorarioAtendimento = {
segunda: { inicio: '08:00', fim: '18:00', ativo: true },
terca:   { inicio: '08:00', fim: '18:00', ativo: true },
quarta:  { inicio: '08:00', fim: '18:00', ativo: true },
quinta:  { inicio: '08:00', fim: '18:00', ativo: true },
sexta:   { inicio: '08:00', fim: '18:00', ativo: true },
sabado:  { inicio: '08:00', fim: '12:00', ativo: false },
domingo: { inicio: '08:00', fim: '12:00', ativo: false },
};

export const ConfiguracoesForm = ({ onNext, initialData }: ConfiguracoesFormProps) => {
const [formData, setFormData] = useState({
duracaoConsulta: initialData?.duracaoConsulta || 30,
valorConsulta: initialData?.valorConsulta || '',
aceitaConvenio: initialData?.aceitaConvenio || false,
conveniosAceitos: initialData?.conveniosAceitos || []
});

const [horarios, setHorarios] = useState

const handleHorarioChange = (dia: string, campo: keyof Horario, valor: string | boolean) => {
setHorarios(prev => ({
...prev,
[dia]: {
...prev[dia],
[campo]: valor
}
}));
};

const handleSubmit = (e: React.FormEvent) => {
e.preventDefault();
onNext({
configuracoes: {
duracaoConsulta: Number(formData.duracaoConsulta),
valorConsulta: Number(formData.valorConsulta),
aceitaConvenio: formData.aceitaConvenio,
conveniosAceitos: formData.conveniosAceitos,
horarioAtendimento: horarios
}
});
};

return (