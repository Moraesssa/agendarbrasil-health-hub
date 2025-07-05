
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface SubItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ProfileAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  variant?: 'default' | 'outline';
  className?: string;
  subItems?: SubItem[];
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
          {actions.map((action, index) =>
            action.subItems ? (
              <Popover key={index}>
                <PopoverTrigger asChild>
                  <Button
                    variant={action.variant || 'default'}
                    className={`h-auto py-4 flex-col gap-2 ${action.className || ''}`}
                  >
                    <action.icon className="w-6 h-6" />
                    <span>{action.label}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <ul className="space-y-1">
                    {action.subItems.map((item) => (
                      <li key={item.path}>
                        <Link to={item.path} className="flex items-center p-2 rounded-md hover:bg-gray-100">
                          <item.icon className="w-5 h-5 mr-3" />
                          <span className="flex-1">{item.label}</span>
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            ) : (
              <Button
                key={index}
                onClick={action.onClick}
                variant={action.variant || 'default'}
                className={`h-auto py-4 flex-col gap-2 ${action.className || ''}`}
              >
                <action.icon className="w-6 h-6" />
                <span>{action.label}</span>
              </Button>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
};
