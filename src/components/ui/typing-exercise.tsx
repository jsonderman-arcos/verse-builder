import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, RotateCcw, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypingExerciseProps {
  verse: string;
  reference: string;
  showHints?: boolean;
  onComplete?: (timeSpent: number, accuracy: number) => void;
}

export const TypingExercise = ({ 
  verse, 
  reference, 
  showHints = false,
  onComplete 
}: TypingExerciseProps) => {
  const [userInput, setUserInput] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [showFirstLetters, setShowFirstLetters] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const words = verse.split(" ");
  const userWords = userInput.trim().split(/\s+/);
  const progress = userInput.length > 0 ? (userInput.length / verse.length) * 100 : 0;

  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [userInput, startTime]);

  useEffect(() => {
    if (userInput.trim().toLowerCase() === verse.toLowerCase() && !isComplete) {
      setIsComplete(true);
      if (startTime && onComplete) {
        const timeSpent = Date.now() - startTime;
        const accuracy = calculateAccuracy();
        onComplete(timeSpent, accuracy);
      }
    }
  }, [userInput, verse, isComplete, startTime, onComplete]);

  const calculateAccuracy = () => {
    const targetWords = verse.toLowerCase().split(/\s+/);
    const inputWords = userInput.toLowerCase().split(/\s+/);
    let correct = 0;
    
    for (let i = 0; i < Math.min(targetWords.length, inputWords.length); i++) {
      if (targetWords[i] === inputWords[i]) correct++;
    }
    
    return targetWords.length > 0 ? (correct / targetWords.length) * 100 : 0;
  };

  const getWordStatus = (wordIndex: number) => {
    if (wordIndex >= userWords.length) return "upcoming";
    
    const targetWord = words[wordIndex]?.toLowerCase().replace(/[^\w]/g, "");
    const userWord = userWords[wordIndex]?.toLowerCase().replace(/[^\w]/g, "");
    
    if (userWord === targetWord) return "correct";
    if (targetWord?.startsWith(userWord)) return "partial";
    return "incorrect";
  };

  const renderVerse = () => {
    return words.map((word, index) => {
      const status = getWordStatus(index);
      const isCurrentWord = index === userWords.length - 1 && !isComplete;
      
      return (
        <span
          key={index}
          className={cn(
            "transition-all duration-200 px-1 py-0.5 rounded",
            status === "correct" && "bg-success/20 text-success-foreground",
            status === "incorrect" && "bg-destructive/20 text-destructive-foreground",
            status === "partial" && "bg-warning/20 text-warning-foreground",
            status === "upcoming" && "text-muted-foreground",
            isCurrentWord && "ring-2 ring-primary/30 bg-primary/10"
          )}
        >
          {showFirstLetters && status === "upcoming" ? (
            <>
              <span className="font-semibold text-primary">{word[0]}</span>
              <span className="text-muted-foreground">{"_".repeat(word.length - 1)}</span>
            </>
          ) : (
            word
          )}
          {index < words.length - 1 && " "}
        </span>
      );
    });
  };

  const reset = () => {
    setUserInput("");
    setIsComplete(false);
    setStartTime(null);
    textareaRef.current?.focus();
  };

  return (
    <Card className="p-6 space-y-6 bg-gradient-celestial">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Type the Verse</h3>
          <p className="text-sm text-muted-foreground">{reference}</p>
        </div>
        <div className="flex items-center space-x-2">
          {showHints && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFirstLetters(!showFirstLetters)}
              className="text-xs"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              {showFirstLetters ? "Hide" : "Show"} Hints
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-card/50 rounded-lg border border-border/50">
          <div className="text-lg leading-relaxed font-medium">
            {renderVerse()}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <textarea
          ref={textareaRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Start typing the verse here..."
          className="w-full min-h-[120px] p-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
          disabled={isComplete}
        />

        {isComplete && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-success-foreground">
              Verse completed! Well done.
            </span>
            <Badge variant="secondary" className="ml-2">
              {Math.round(calculateAccuracy())}% accuracy
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};