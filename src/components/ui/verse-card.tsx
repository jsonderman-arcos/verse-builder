import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface VerseCardProps {
  verse: string;
  reference: string;
  translation?: string;
  isHighlighted?: boolean;
  showContext?: boolean;
  contextBefore?: string;
  contextAfter?: string;
  className?: string;
}

export const VerseCard = ({
  verse,
  reference,
  translation = "NIV",
  isHighlighted = false,
  showContext = false,
  contextBefore,
  contextAfter,
  className
}: VerseCardProps) => {
  return (
    <Card className={cn(
      "p-6 bg-gradient-celestial border-border/50 transition-all duration-300",
      isHighlighted && "ring-2 ring-primary/20 shadow-glow",
      className
    )}>
      {showContext && contextBefore && (
        <p className="text-sm text-muted-foreground italic mb-3 leading-relaxed">
          {contextBefore}
        </p>
      )}
      
      <div className="space-y-4">
        <blockquote className={cn(
          "text-lg leading-relaxed font-medium",
          isHighlighted ? "text-primary" : "text-foreground"
        )}>
          "{verse}"
        </blockquote>
        
        <div className="flex items-center justify-between">
          <cite className="text-sm font-semibold text-primary">
            {reference}
          </cite>
          <Badge variant="secondary" className="text-xs">
            {translation}
          </Badge>
        </div>
      </div>

      {showContext && contextAfter && (
        <p className="text-sm text-muted-foreground italic mt-3 leading-relaxed">
          {contextAfter}
        </p>
      )}
    </Card>
  );
};