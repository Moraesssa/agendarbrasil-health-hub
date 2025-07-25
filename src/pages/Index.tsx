import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-4 mb-6">
            <img 
              src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
              alt="AgendarBrasil Logo" 
              className="w-16 h-16 object-cover rounded-xl shadow-lg" 
            />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-800 to-green-600 bg-clip-text text-transparent">
              AgendarBrasil
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Plataforma completa para gestão de consultas médicas, atestados e prescrições
          </p>
        </div>

        {user ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Bem-vindo, {user.email}!
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Portal do Médico
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Gerencie sua agenda, pacientes, prescrições e atestados
                  </p>
                  <Link 
                    to="/dashboard-medico" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Acessar Dashboard
                  </Link>
                </div>
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">
                    Portal do Paciente
                  </h3>
                  <p className="text-green-700 mb-4">
                    Acesse suas consultas, receitas e histórico médico
                  </p>
                  <Link 
                    to="/dashboard-familiar" 
                    className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Acessar Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Comece agora
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Sou Médico
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Gerencie sua prática médica de forma eficiente
                  </p>
                  <Link 
                    to="/cadastro-medico" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Cadastrar como Médico
                  </Link>
                </div>
                <div className="bg-green-50 p-6 rounded-lg text-center">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">
                    Sou Paciente
                  </h3>
                  <p className="text-green-700 mb-4">
                    Acesse seus dados médicos e agende consultas
                  </p>
                  <Link 
                    to="/cadastro-paciente" 
                    className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Cadastrar como Paciente
                  </Link>
                </div>
              </div>
              <div className="text-center mt-6">
                <p className="text-gray-600 mb-4">Já tem uma conta?</p>
                <Link 
                  to="/login" 
                  className="inline-block bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Fazer Login
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Seção de Validação de Documentos - Acesso Público */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-yellow-200">
            <div className="text-center">
              <Shield className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Validação de Documentos
              </h2>
              <p className="text-gray-600 mb-6">
                Valide a autenticidade de receitas e atestados médicos
              </p>
              <Link 
                to="/validar-documento" 
                className="inline-block bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Validar Documento
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
