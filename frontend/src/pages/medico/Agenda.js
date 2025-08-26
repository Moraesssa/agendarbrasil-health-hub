import React, { useState, useEffect } from 'react';

const Agenda = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching appointment data
        const fetchAppointments = async () => {
            setLoading(true);
            // In a real application, you would fetch data from an API here.
            // For example: const response = await fetch('/api/appointments');
            // const data = await response.json();
            
            // Simulating data with a delay
            setTimeout(() => {
                setAppointments([
                    { id: 1, time: '09:00', patient: 'João Silva', status: 'Confirmada' },
                    { id: 2, time: '10:00', patient: 'Maria Oliveira', status: 'Confirmada' },
                    { id: 3, time: '11:00', patient: 'Carlos Souza', status: 'Pendente' },
                ]);
                setLoading(false);
            }, 1000); // Simulate 1 second delay
        };

        fetchAppointments();
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <div>
            <h2>Agenda do Médico</h2>
            {loading ? (
                <p>Carregando agenda...</p>
            ) : (
                <div>
                    <p>Visualização em calendário (dia, semana, mês) com bloqueio de horários.</p>
                    <h3>Próximos Compromissos:</h3>
                    {appointments.length > 0 ? (
                        <ul>
                            {appointments.map(appt => (
                                <li key={appt.id}>
                                    {appt.time} - {appt.patient} ({appt.status})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhum compromisso agendado para hoje.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Agenda;
