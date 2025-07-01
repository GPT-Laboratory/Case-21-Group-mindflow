import { TabsList } from '@/components/ui/tabs';

interface ScrollableTabsProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({ children, className }) => {



  return (

      <div
        className="flex-1 overflow-x-auto scrollbar-hide flex items-center"

      >
        <TabsList 
  
        >
          {children}
        </TabsList>
      </div>

 
  );
};