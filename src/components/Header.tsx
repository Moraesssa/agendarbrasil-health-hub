import { Bell, Menu, Search, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const {
    user,
    logout
  } = useAuth();
  const navigate = useNavigate();
  const handleAuthAction = () => {
    if (user) {
      logout();
    } else {
      navigate("/login");
    }
  };
  return <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-blue-100">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer">
            <div className="relative">
              <img 
                alt="AgendarBrasil Logo" 
                src="/lovable-uploads/c5b5dd2b-14c7-467f-b27b-c0f0805a4306.png" 
                className="w-14 h-14 sm:w-16 sm:h-16 lg:w-18 lg:h-18 object-cover rounded-xl shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-200/50" 
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-blue-500/20 to-green-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="relative">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent leading-tight group-hover:from-blue-900 group-hover:via-blue-700 group-hover:to-green-700 transition-all duration-300">
                AgendarBrasil
              </h1>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block mt-0.5 font-medium group-hover:text-gray-700 transition-colors duration-300">
                🏥 Sua saúde em primeiro lugar
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {user && <>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-11 sm:w-11 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 sm:h-11 sm:w-11 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold animate-bounce">
                    3
                  </Badge>
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-11 sm:w-11 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                  <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </>}
            
            <Button onClick={handleAuthAction} variant={user ? "outline" : "default"} size="sm" className={user ? "border-red-200 hover:bg-red-50 text-red-600" : "bg-blue-500 hover:bg-blue-600 text-white"}>
              <LogIn className="h-4 w-4 mr-2" />
              {user ? "Sair" : "Entrar"}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-green-500"></div>
    </header>;
};

export default Header;
