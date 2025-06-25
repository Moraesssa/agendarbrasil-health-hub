
import React from 'react';

const UserTypeHeader = () => {
  return (
    <>
      {/* Enhanced Logo and Instructions */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-8">
          <div className="relative group">
            {/* Main Logo Container */}
            <div className="relative">
              <img 
                src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                alt="AgendarBrasil Logo" 
                className="w-40 h-40 object-cover rounded-3xl shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:shadow-4xl group-hover:shadow-blue-300/40 border-4 border-white/20" 
              />
              
              {/* Animated Gradient Border */}
              <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-3xl opacity-30 group-hover:opacity-60 blur-lg transition-all duration-700 animate-pulse"></div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-3xl backdrop-blur-sm"></div>
              
              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-1000 rounded-3xl transform -skew-x-12 translate-x-full group-hover:translate-x-[-200%]"></div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-100"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-gradient-to-r from-green-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce delay-300"></div>
          </div>
        </div>
        
        {/* Enhanced Premium Typography */}
        <div className="relative mb-8 overflow-hidden">
          {/* Background text effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-6xl md:text-7xl font-black text-gray-100 select-none pointer-events-none transform scale-110 blur-sm opacity-50">
              AgendarBrasil
            </h1>
          </div>
          
          {/* Main title with advanced effects */}
          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4">
              <span className="block">
                <span className="inline-block bg-gradient-to-r from-blue-800 via-blue-600 to-blue-800 bg-clip-text text-transparent animate-pulse">
                  Bem-vindo ao
                </span>
              </span>
              <span className="block mt-2 relative">
                <span className="inline-block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 bg-clip-text text-transparent font-extrabold tracking-tight">
                  AgendarBrasil!
                </span>
                {/* Decorative underline */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full opacity-80 animate-pulse"></div>
                {/* Secondary underline for depth */}
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-blue-300 to-green-300 rounded-full opacity-60 blur-sm"></div>
              </span>
            </h1>
            
            {/* Floating accent elements */}
            <div className="absolute top-0 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-75 animation-delay-300"></div>
            <div className="absolute bottom-0 left-1/3 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-75 animation-delay-600"></div>
          </div>
          
          {/* Ambient glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 blur-3xl rounded-full transform scale-150 opacity-50 animate-pulse"></div>
        </div>
        
        <p className="text-gray-600 text-lg mb-4 font-medium">Para começar, nos diga como você pretende usar nossa plataforma:</p>
        
        {/* Enhanced Step Indicator */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">1</div>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full opacity-30 blur-sm animate-pulse"></div>
          </div>
          <div className="w-16 h-2 bg-gradient-to-r from-blue-200 to-gray-300 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium shadow-md">2</div>
          <div className="w-16 h-2 bg-gray-300 rounded-full"></div>
          <div className="w-10 h-10 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium shadow-md">3</div>
        </div>
        <p className="text-sm text-gray-500 font-medium">Etapa 1 de 3: Escolha seu tipo de usuário</p>
      </div>
    </>
  );
};

export default UserTypeHeader;
