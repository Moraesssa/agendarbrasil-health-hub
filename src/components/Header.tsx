
import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 border-b border-blue-100">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 via-blue-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <span className="text-white font-bold text-lg sm:text-2xl transform -rotate-3">A</span>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="relative">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-green-600 bg-clip-text text-transparent leading-tight">
                AgendarBrasil
              </h1>
              <div className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block mt-0.5 font-medium">
                🏥 Sua saúde em primeiro lugar
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
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
          </div>
        </div>
      </div>
      
      {/* Decorative bottom border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-green-500"></div>
    </header>
  );
};

export default Header;
