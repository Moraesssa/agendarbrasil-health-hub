// ... (imports)
import { MapPin } from 'lucide-react';
// ...

interface AppointmentSummaryProps {
    // ... (outras props)
    selectedLocal: { nome_local: string; endereco: any } | null;
}

export const AppointmentSummary = ({ 
    // ... (outras props)
    selectedLocal
}: AppointmentSummaryProps) => {
    
    // ...
    const locationText = selectedLocal ? `${selectedLocal.nome_local} (${selectedLocal.endereco.cidade}, ${selectedLocal.endereco.uf})` : null;

    return (
        <Card>
            {/* ... */}
            <CardContent>
                 {/* ... (outras infos) */}
                 <InfoRow icon={MapPin} label="Local" value={locationText} isCompleted={!!locationText}/>
                 {/* ... */}
            </CardContent>
        </Card>
    );
};