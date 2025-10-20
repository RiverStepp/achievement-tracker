import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = ({ className, ...props }: TabsPrimitive.TabsListProps) => (
  <TabsPrimitive.List
    className={cn(
      'flex items-center gap-2 rounded-full bg-slate-900/80 p-1 text-sm font-medium',
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({ className, ...props }: TabsPrimitive.TabsTriggerProps) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-2 text-sm transition-all data-[state=active]:bg-brand data-[state=active]:text-white data-[state=inactive]:text-slate-400',
      className
    )}
    {...props}
  />
);

const TabsContent = ({ className, ...props }: TabsPrimitive.TabsContentProps) => (
  <TabsPrimitive.Content className={cn('mt-6', className)} {...props} />
);

export { Tabs, TabsList, TabsTrigger, TabsContent };
