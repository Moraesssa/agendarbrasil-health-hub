
import { useState, useEffect } from 'react';
import { Heart, HeartOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toggleFaviconAnimation } from '@/lib/faviconUtils';

export const FaviconController = () => {
  const [isAnimated, setIsAnimated] = useState(true);

  useEffect(() => {
    const savedSetting = localStorage.getItem('favicon-animation');
    setIsAnimated(savedSetting !== 'false');
  }, []);

  const handleToggle = () => {
    const newSetting = toggleFaviconAnimation();
    setIsAnimated(newSetting);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="p-2 hover:bg-accent"
          >
            {isAnimated ? (
              <Heart className="h-4 w-4 text-red-500" />
            ) : (
              <HeartOff className="h-4 w-4 text-gray-400" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isAnimated ? 'Desativar' : 'Ativar'} animação do favicon
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
