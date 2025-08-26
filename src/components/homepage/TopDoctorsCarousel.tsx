import React, { useEffect, useCallback } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { type CarouselApi } from '@/components/ui/carousel';

const topDoctors = [
  {
    id: 1,
    name: "Dr. Carlos Silva",
    specialty: "Cardiologia",
    rating: 4.9,
    avatar: "/placeholder.svg",
    totalReviews: 234
  },
  {
    id: 2,
    name: "Dra. Ana Santos",
    specialty: "Pediatria", 
    rating: 5.0,
    avatar: "/placeholder.svg",
    totalReviews: 189
  },
  {
    id: 3,
    name: "Dr. João Oliveira",
    specialty: "Neurologia",
    rating: 4.8,
    avatar: "/placeholder.svg",
    totalReviews: 167
  },
  {
    id: 4,
    name: "Dra. Maria Costa",
    specialty: "Ginecologia",
    rating: 4.9,
    avatar: "/placeholder.svg",
    totalReviews: 201
  },
  {
    id: 5,
    name: "Dr. Pedro Lima",
    specialty: "Ortopedia",
    rating: 4.7,
    avatar: "/placeholder.svg",
    totalReviews: 143
  }
];

export function TopDoctorsCarousel() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [isAutoplay, setIsAutoplay] = React.useState(true);

  const nextSlide = useCallback(() => {
    if (api && isAutoplay) {
      api.scrollNext();
    }
  }, [api, isAutoplay]);

  useEffect(() => {
    if (!api) return;

    const interval = setInterval(nextSlide, 4000);
    
    return () => clearInterval(interval);
  }, [nextSlide]);

  const handleMouseEnter = () => setIsAutoplay(false);
  const handleMouseLeave = () => setIsAutoplay(true);

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Nossos Médicos Mais Bem Avaliados
        </h2>
        <p className="text-muted-foreground">
          Profissionais de excelência com as melhores avaliações
        </p>
      </div>
      
      <Carousel
        setApi={setApi}
        className="w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {topDoctors.map((doctor) => (
            <CarouselItem key={doctor.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
              <Card className="h-full bg-gradient-to-br from-background to-muted/30 border-muted hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                        <AvatarImage src={doctor.avatar} alt={doctor.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                          {doctor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <Badge className="absolute -top-1 -right-1 bg-primary text-primary-foreground px-2 py-1 text-xs">
                        Top
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg text-foreground">
                        {doctor.name}
                      </h3>
                      <p className="text-muted-foreground font-medium">
                        {doctor.specialty}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-foreground">
                          {doctor.rating}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        ({doctor.totalReviews} avaliações)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}