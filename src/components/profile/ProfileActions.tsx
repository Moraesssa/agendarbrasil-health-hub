
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, BarChart3, Settings, Heart, FileText } from "lucide-react";

interface ProfileAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline';
  className?: string;
}

interface ProfileActionsProps {
  actions: ProfileAction[];
  title?: string;
}

export const ProfileActions = ({ actions, title = "Ações Rápidas" }: ProfileActionsProps) => {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant={action.variant || 'default'}
              className={`h-auto py-4 flex-col gap-2 ${action.className || ''}`}
            >
              <action.icon className="w-6 h-6" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
