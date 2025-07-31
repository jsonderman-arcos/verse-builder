import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Heart, RotateCcw, Save } from "lucide-react";

interface ReflectionExerciseProps {
  verse: string;
  reference: string;
  onComplete?: (timeSpent: number, accuracy: number) => void;
}

export const ReflectionExercise = ({ verse, reference, onComplete }: ReflectionExerciseProps) => {
  const [startTime] = useState(Date.now());
  const [reflection, setReflection] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const prompts = [
    "What does this verse mean to you personally?",
    "How can you apply this verse to your current situation?",
    "What specific action will you take based on this verse?",
    "How does this verse change your perspective on something?"
  ];

  const handleSave = () => {
    const newResponses = [...responses];
    newResponses[currentPrompt] = reflection;
    setResponses(newResponses);

    if (currentPrompt < prompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
      setReflection(newResponses[currentPrompt + 1] || "");
    } else {
      // All prompts completed
      setIsComplete(true);
      const timeSpent = Date.now() - startTime;
      const accuracy = 100; // Reflection is always 100% if completed
      onComplete?.(timeSpent, accuracy);
    }
  };

  const reset = () => {
    setCurrentPrompt(0);
    setReflection("");
    setResponses([]);
    setIsComplete(false);
  };

  const goToPrompt = (index: number) => {
    const newResponses = [...responses];
    newResponses[currentPrompt] = reflection;
    setResponses(newResponses);
    setCurrentPrompt(index);
    setReflection(newResponses[index] || "");
  };

  if (isComplete) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-primary" />
              <CardTitle>Your Reflection Complete</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reflect Again
            </Button>
          </div>
          <Badge variant="secondary">{reference}</Badge>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-success/10 rounded-lg border border-success/20">
            <h3 className="text-lg font-semibold text-success mb-2">Reflection Complete!</h3>
            <p className="text-sm text-success/80">
              You've thoughtfully reflected on this verse from multiple perspectives.
            </p>
          </div>

          <div className="space-y-6">
            {prompts.map((prompt, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-medium text-foreground mb-2">{prompt}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {responses[index] || "No response provided"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-primary" />
            <CardTitle>Personal Reflection</CardTitle>
          </div>
          <Badge variant="outline">
            Step {currentPrompt + 1} of {prompts.length}
          </Badge>
        </div>
        <Badge variant="secondary">{reference}</Badge>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentPrompt + 1) / prompts.length) * 100}%` 
            }}
          />
        </div>

        {/* Show verse for reference */}
        <div className="p-4 bg-gradient-celestial rounded-lg">
          <p className="text-center italic text-foreground">
            "{verse}"
          </p>
          <p className="text-center text-sm text-muted-foreground mt-2">
            {reference}
          </p>
        </div>

        {/* Navigation through prompts */}
        <div className="flex flex-wrap gap-2">
          {prompts.map((_, index) => (
            <Button
              key={index}
              variant={index === currentPrompt ? "default" : 
                       responses[index] ? "secondary" : "outline"}
              size="sm"
              onClick={() => goToPrompt(index)}
              className="text-xs"
            >
              {index + 1}
              {responses[index] && index !== currentPrompt && " ✓"}
            </Button>
          ))}
        </div>

        {/* Current prompt */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            {prompts[currentPrompt]}
          </h3>
          
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="Take your time to reflect deeply on this question..."
            className="min-h-32 resize-none"
          />
          
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              {reflection.length} characters
            </div>
            <Button 
              onClick={handleSave}
              disabled={!reflection.trim()}
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {currentPrompt < prompts.length - 1 ? "Save & Continue" : "Complete Reflection"}
              </span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};