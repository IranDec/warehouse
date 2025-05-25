import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 md:flex md:items-center md:justify-between p-6 pb-0 md:p-8 md:pb-0", className)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          {Icon && <Icon className="h-8 w-8 text-primary mr-3 shrink-0" />}
          <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl">
            {title}
          </h1>
        </div>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="mt-4 flex items-center gap-2 md:mt-0 md:ml-4">{actions}</div>}
    </div>
  );
}
