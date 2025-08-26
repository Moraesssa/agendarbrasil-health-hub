import React, { useState, useEffect } from 'react';

const MedicoDashboard = () => {
    const [dashboardData, setDashboardData] = useState({
        appointmentsToday: 0,
        pendingNotifications: 0,
        quickMetrics: {
            patientsSeen: 0,
            avgConsultationTime: '0m'
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching dashboard data
        const fetchDashboardData = async () => {
            setLoading(true);
            // In a real application, you would fetch data from an API here.
            // For example: const response = await fetch('/api/doctor/dashboard');
            // const data = await response.json();

            // Simulating data with a delay
            setTimeout(() => {
                setDashboardData({
                    appointmentsToday: 5,
                    pendingNotifications: 2,
                    quickMetrics: {
                        patientsSeen: 3,
                        avgConsultationTime: '25m'
                    }
                });
                setLoading(false);
            }, 1000); // Simulate 1 second delay
        };

        fetchDashboardData();
    }, []); // Empty dependency array means this effect runs once on mount

    return (
        <div>
            <h2>Dashboard do Médico</h2>
            {loading ? (
                <p>Carregando dashboard...</p>
            ) : (
                <div>
                    <p>Visão geral do dia, notificações e métricas rápidas.</p>
                    <div>
                        <h3>Resumo do Dia:</h3>
                        <p>Consultas Agendadas Hoje: {dashboardData.appointmentsToday}</p>
                        <p>Notificações Pendentes: {dashboardData.pendingNotifications}</p>
                    </div>
                    <div>
                        <h3>Métricas Rápidas:</h3>
                        <p>Pacientes Atendidos: {dashboardData.quickMetrics.patientsSeen}</p>
                        <p>Tempo Médio de Consulta: {dashboardData.quickMetrics.avgConsultationTime}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicoDashboard;
