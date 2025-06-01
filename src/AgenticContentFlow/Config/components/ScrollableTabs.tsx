import React, { useRef, useState, useEffect } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScrollableTabsProps {
  children: React.ReactNode;
  className?: string;
}

export const ScrollableTabs: React.FC<ScrollableTabsProps> = ({ children, className }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
    }
  };

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [children]);

  const scrollLeft = () => {
    if (scrollRef.current && canScrollLeft) {
      scrollRef.current.scrollBy({ left: -120, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current && canScrollRight) {
      scrollRef.current.scrollBy({ left: 120, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    checkScrollability();
  };

  return (
    <div className="relative flex items-bottom w-full">
      {/* Left scroll button - always present */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex items-center justify-center h-full w-8 p-0 mr-0 hover:bg-muted rounded-none transition-opacity",
          !canScrollLeft && "opacity-30 cursor-not-allowed"
        )}
        onClick={scrollLeft}
        disabled={!canScrollLeft}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Scrollable tabs container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-x-auto scrollbar-hide flex items-center"
        onScroll={handleScroll}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <TabsList 
  
        >
          {children}
        </TabsList>
      </div>

      {/* Right scroll button - always present */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex items-center justify-center h-full w-8 p-0 ml-0 hover:bg-muted rounded-none transition-opacity",
          !canScrollRight && "opacity-30 cursor-not-allowed"
        )}
        onClick={scrollRight}
        disabled={!canScrollRight}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};