
import { useState } from "react";
import { Calendar, Clock, MapPin, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Agendamento = () => {
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const specialties = [
    "Cardiologia", "Dermatologia", "Endocrinologia", "Gastroenterologia",
    "Ginecologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Psiquiatria"
  ];

  const doctors = {
    "Cardiologia": ["Dr. Ana Silva", "Dr. João Costa", "Dra. Maria Santos"],
    "Dermatologia": ["Dr. Pedro Lima", "Dra. Sofia Oliveira"],
    "Endocrinologia": ["Dra. Carla Ferreira", "Dr. Miguel Rodrigues"]
  };

  const availableTimes = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];

  const handleAgendamento = () => {
    if (!selectedSpecialty || !selectedDoctor || !selectedDate || !selectedTime) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Consulta Agendada!",
      description: `${selectedDoctor} - ${selectedDate} às ${selectedTime}`
    });
    
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-blue-900">Agendar Consulta</h1>
          <p className="text-gray-600">Escolha a especialidade, médico e horário</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário de Agendamento */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Dados da Consulta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Especialidade */}
              <div>
                <label className="block text-sm font-medium mb-2">Especialidade</label>
                <select 
                  className="w-full p-3 border rounded-lg"
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                >
                  <option value="">Selecione uma especialidade</option>
                  {specialties.map(specialty => (
                    <option key={specialty} value={specialty}>{specialty}</option>
                  ))}
                </select>
              </div>

              {/* Médico */}
              {selectedSpecialty && (
                <div>
                  <label className="block text-sm font-medium mb-2">Médico</label>
                  <select 
                    className="w-full p-3 border rounded-lg"
                    value={selectedDoctor}
                    onChange={(e) => setSelectedDoctor(e.target.value)}
                  >
                    <option value="">Selecione um médico</option>
                    {(doctors[selectedSpecialty as keyof typeof doctors] || []).map(doctor => (
                      <option key={doctor} value={doctor}>{doctor}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Data */}
              <div>
                <label className="block text-sm font-medium mb-2">Data</label>
                <input 
                  type="date"
                  className="w-full p-3 border rounded-lg"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Horário */}
              {selectedDate && (
                <div>
                  <label className="block text-sm font-medium mb-2">Horário</label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedTime(time)}
                        className="text-sm"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Button 
                onClick={handleAgendamento}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                Confirmar Agendamento
              </Button>
            </CardContent>
          </Card>

          {/* Resumo */}
          {selectedSpecialty && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Resumo do Agendamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <User className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium">Especialidade</p>
                    <p className="text-sm text-gray-600">{selectedSpecialty}</p>
                  </div>
                </div>

                {selectedDoctor && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <User className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Médico</p>
                      <p className="text-sm text-gray-600">{selectedDoctor}</p>
                    </div>
                  </div>
                )}

                {selectedDate && (
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Data</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                )}

                {selectedTime && (
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Horário</p>
                      <p className="text-sm text-gray-600">{selectedTime}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Agendamento;
