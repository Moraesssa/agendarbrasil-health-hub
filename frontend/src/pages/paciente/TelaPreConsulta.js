import React, { useState, useEffect } from 'react';

const TelaPreConsulta = () => {
    const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
    const [equipmentCheck, setEquipmentCheck] = useState({
        camera: false,
        microphone: false,
        internet: false
    });
    const [preparationList, setPreparationList] = useState({
        documentsReady: false,
        environmentClear: false
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate countdown timer
        const timer = setInterval(() => {
            setCountdown(prevCountdown => {
                if (prevCountdown <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prevCountdown - 1;
            });
        }, 1000);

        // Simulate fetching initial check states
        const fetchCheckStates = async () => {
            setLoading(true);
            // In a real application, you would fetch data from an API here.
            setTimeout(() => {
                setEquipmentCheck({
                    camera: true,
                    microphone: true,
                    internet: false // Simulate a potential issue
                });
                setPreparationList({
                    documentsReady: true,
                    environmentClear: false // Simulate another potential issue
                });
                setLoading(false);
            }, 1000); // Simulate 1 second delay
        };

        fetchCheckStates();

        return () => clearInterval(timer); // Cleanup interval on component unmount
    }, []);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleEquipmentCheckChange = (e) => {
        const { name, checked } = e.target;
        setEquipmentCheck(prevState => ({
            ...prevState,
            [name]: checked
        }));
    };

    const handlePreparationListChange = (e) => {
        const { name, checked } = e.target;
        setPreparationList(prevState => ({
            ...prevState,
            [name]: checked
        }));
    };

    const isReadyForConsultation = () => {
        return Object.values(equipmentCheck).every(Boolean) &&
               Object.values(preparationList).every(Boolean);
    };

    return (
        <div>
            <h2>Tela de Pré-Consulta</h2>
            {loading ? (
                <p>Carregando informações de pré-consulta...</p>
            ) : (
                <div>
                    <p>Contagem regressiva, teste de equipamento e checklist de preparação.</p>
                    
                    <h3>Tempo Restante para a Consulta:</h3>
                    <p style={{ fontSize: '2em', fontWeight: 'bold' }}>{formatTime(countdown)}</p>

                    <h3>Teste de Equipamento:</h3>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="camera"
                                checked={equipmentCheck.camera}
                                onChange={handleEquipmentCheckChange}
                            />
                            Câmera
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="microphone"
                                checked={equipmentCheck.microphone}
                                onChange={handleEquipmentCheckChange}
                            />
                            Microfone
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="internet"
                                checked={equipmentCheck.internet}
                                onChange={handleEquipmentCheckChange}
                            />
                            Conexão com a Internet
                        </label>
                    </div>

                    <h3>Checklist de Preparação:</h3>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="documentsReady"
                                checked={preparationList.documentsReady}
                                onChange={handlePreparationListChange}
                            />
                            Documentos à mão
                        </label>
                    </div>
                    <div>
                        <label>
                            <input
                                type="checkbox"
                                name="environmentClear"
                                checked={preparationList.environmentClear}
                                onChange={handlePreparationListChange}
                            />
                            Ambiente tranquilo e iluminado
                        </label>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        {isReadyForConsultation() ? (
                            <p style={{ color: 'green', fontWeight: 'bold' }}>
                                Você está pronto para a consulta!
                            </p>
                        ) : (
                            <p style={{ color: 'red' }}>
                                Por favor, complete todos os itens para iniciar a consulta.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelaPreConsulta;
