import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Book, Heart, Target } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
}

export const HeroSection = ({ onGetStarted }: HeroSectionProps) => {
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-peaceful overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-celestial opacity-50" />
      <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse-gentle" />
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse-gentle" />
      
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-elevated mb-6">
            <Book className="w-10 h-10 text-primary-foreground" />
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="bg-gradient-divine bg-clip-text text-transparent">
              Hide God's Word
            </span>
            <br />
            <span className="text-foreground">In Your Heart</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Master a new Bible verse each week through interactive exercises, 
            progressive difficulty, and meaningful reflection.
          </p>
          
          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-12">
            <div className="flex flex-col items-center space-y-3 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <Target className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-foreground">Progressive Learning</h3>
              <p className="text-sm text-muted-foreground text-center">
                Exercises increase in difficulty throughout the week
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <Book className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-foreground">Contextual Study</h3>
              <p className="text-sm text-muted-foreground text-center">
                Learn verses with their surrounding context and meaning
              </p>
            </div>
            
            <div className="flex flex-col items-center space-y-3 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
              <Heart className="w-8 h-8 text-primary" />
              <h3 className="font-semibold text-foreground">Personal Reflection</h3>
              <p className="text-sm text-muted-foreground text-center">
                Apply verses to your life through guided reflection
              </p>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="pt-8">
            <Button
              onClick={onGetStarted}
              size="lg"
              className="bg-gradient-divine hover:shadow-glow transition-all duration-300 text-lg px-8 py-4 h-auto"
            >
              {user ? "Continue Your Journey" : "Start Memorizing Today"}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
          
          {/* Scripture inspiration */}
          <div className="pt-12 max-w-2xl mx-auto">
            <blockquote className="text-lg italic text-muted-foreground leading-relaxed">
              "I have hidden your word in my heart that I might not sin against you."
            </blockquote>
            <cite className="text-sm font-medium text-primary mt-2 block">
              Psalm 119:11 NIV
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
};