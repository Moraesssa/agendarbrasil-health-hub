import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, LucideIcon } from 'lucide-react';

interface ComingSoonFeature {
  icon: LucideIcon;
  label: string;
}

interface ComingSoonPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
  backPath: string;
  backLabel?: string;
  features?: ComingSoonFeature[];
}

export default function ComingSoonPage({
  title,
  description,
  icon: Icon,
  backPath,
  backLabel = 'Voltar',
  features = [],
}: ComingSoonPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto">
          <Icon className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-lg">{description}</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
              <Clock className="w-4 h-4" />
              <span>Em desenvolvimento</span>
            </div>

            {features.length > 0 && (
              <ul className="space-y-3 text-left">
                {features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-accent-foreground" />
                    </div>
                    <span className="text-foreground">{feature.label}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" onClick={() => navigate(backPath)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {backLabel}
        </Button>
      </div>
    </div>
  );
}
