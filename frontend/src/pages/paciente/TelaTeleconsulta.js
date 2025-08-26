import React, { useState, useEffect } from 'react';

const TelaTeleconsultaPaciente = () => {
    const [videoStreamUrl, setVideoStreamUrl] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate fetching video stream and chat history
        const fetchTeleconsultaData = async () => {
            setLoading(true);
            // In a real application, you would establish a WebRTC connection
            // or fetch a stream URL and chat history from an API.
            // For example:
            // const streamResponse = await fetch('/api/teleconsulta/stream');
            // const streamData = await streamResponse.json();
            // setVideoStreamUrl(streamData.url);
            //
            // const chatResponse = await fetch('/api/teleconsulta/chat');
            // const chatData = await chatResponse.json();
            // setChatMessages(chatData.messages);

            // Simulating data with a delay
            setTimeout(() => {
                setVideoStreamUrl('blob:http://localhost:3000/some-video-id'); // Placeholder URL
                setChatMessages([
                    { id: 401, sender: 'Dr. Ana Souza', text: 'Olá, como você está se sentindo hoje?' },
                    { id: 402, sender: 'Paciente', text: 'Olá doutora, estou bem, um pouco ansioso.' },
                    { id: 403, sender: 'Dr. Ana Souza', text: 'Entendo. Vamos começar?' }
                ]);
                setLoading(false);
            }, 1500); // Simulate 1.5 second delay
        };

        fetchTeleconsultaData();
    }, []);

    const handleSendMessage = () => {
        if (newMessage.trim() === '') return;

        const message = {
            id: chatMessages.length + 1, // Simple ID generation
            sender: 'Paciente',
            text: newMessage
        };

        setChatMessages(prevMessages => [...prevMessages, message]);
        setNewMessage('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    return (
        <div>
            <h2>Tela da Teleconsulta (Visão do Paciente)</h2>
            {loading ? (
                <p>Carregando teleconsulta...</p>
            ) : (
                <div>
                    <p>Interface simples e focada no vídeo, com controles básicos e chat.</p>
                    
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 3 }}>
                            <h3>Vídeo Chamada</h3>
                            {videoStreamUrl ? (
                                <video 
                                    src={videoStreamUrl} 
                                    controls 
                                    autoPlay 
                                    width="100%" 
                                    height="400px"
                                    style={{ backgroundColor: '#000' }} // Black background for video
                                >
                                    Seu navegador não suporta o elemento de vídeo.
                                </video>
                            ) : (
                                <p>Carregando fluxo de vídeo...</p>
                            )}
                        </div>
                        <div style={{ flex: 1, borderLeft: '1px solid #ccc', paddingLeft: '20px' }}>
                            <h3>Chat</h3>
                            <div style={{ height: '350px', overflowY: 'scroll', marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
                                {chatMessages.length > 0 ? (
                                    chatMessages.map(msg => (
                                        <p key={msg.id} style={{ margin: '5px 0', textAlign: msg.sender === 'Paciente' ? 'right' : 'left' }}>
                                            <strong>{msg.sender}:</strong> {msg.text}
                                        </p>
                                    ))
                                ) : (
                                    <p>Nenhuma mensagem no chat.</p>
                                )}
                            </div>
                            <div style={{ display: 'flex' }}>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Digite sua mensagem..."
                                    style={{ flexGrow: 1, marginRight: '10px', padding: '8px' }}
                                />
                                <button onClick={handleSendMessage} style={{ padding: '8px 15px' }}>Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TelaTeleconsultaPaciente;
