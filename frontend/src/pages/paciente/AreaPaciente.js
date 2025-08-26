import React, { useState, useEffect } from 'react';

const AreaPaciente = () => {
    const [patientInfo, setPatientInfo] = useState({
        upcomingAppointments: [],
        history: [],
        documents: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching patient data
        const fetchPatientData = async () => {
            setLoading(true);
            // In a real application, you would fetch data from an API here.
            // For example: const response = await fetch('/api/patient/data');
            // const data = await response.json();

            // Simulating data with a delay
            setTimeout(() => {
                setPatientInfo({
                    upcomingAppointments: [
                        { id: 101, date: '2025-08-27', doctor: 'Dr. Ana Souza', time: '14:00' },
                        { id: 102, date: '2025-08-29', doctor: 'Dr. Bruno Costa', time: '10:30' }
                    ],
                    history: [
                        { id: 201, date: '2025-08-20', doctor: 'Dr. Ana Souza', reason: 'Consulta de rotina' },
                        { id: 202, date: '2025-08-15', doctor: 'Dr. Carlos Lima', reason: 'Retorno' }
                    ],
                    documents: [
                        { id: 301, name: 'Exame de Sangue', date: '2025-08-20' },
                        { id: 302, name: 'Receita Médica', date: '2025-08-15' }
                    ]
                });
                setLoading(false);
            }, 1000); // Simulate 1 second delay
        };

        fetchPatientData();
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <div>
            <h2>Área do Paciente</h2>
            {loading ? (
                <p>Carregando seus dados...</p>
            ) : (
                <div>
                    <p>Visualização de próximas consultas, histórico e acesso a documentos.</p>
                    
                    <h3>Próximas Consultas:</h3>
                    {patientInfo.upcomingAppointments.length > 0 ? (
                        <ul>
                            {patientInfo.upcomingAppointments.map(appt => (
                                <li key={appt.id}>
                                    {appt.date} às {appt.time} com {appt.doctor}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhuma consulta agendada.</p>
                    )}

                    <h3>Histórico de Consultas:</h3>
                    {patientInfo.history.length > 0 ? (
                        <ul>
                            {patientInfo.history.map(hist => (
                                <li key={hist.id}>
                                    {hist.date} - {hist.doctor}: {hist.reason}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhum histórico de consulta encontrado.</p>
                    )}

                    <h3>Documentos:</h3>
                    {patientInfo.documents.length > 0 ? (
                        <ul>
                            {patientInfo.documents.map(doc => (
                                <li key={doc.id}>
                                    {doc.name} ({doc.date})
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>Nenhum documento disponível.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default AreaPaciente;
