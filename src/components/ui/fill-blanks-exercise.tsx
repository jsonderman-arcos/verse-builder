import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, RotateCcw, Lightbulb } from "lucide-react";

interface FillBlanksExerciseProps {
  verse: string;
  reference: string;
  onComplete?: (timeSpent: number, accuracy: number) => void;
}

export const FillBlanksExercise = ({ verse, reference, onComplete }: FillBlanksExerciseProps) => {
  const [startTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isComplete, setIsComplete] = useState(false);
  const [showHints, setShowHints] = useState(false);

  // Create blanks for every 4th-6th word (roughly)
  const words = verse.split(' ');
  const blankIndices = words
    .map((_, index) => index)
    .filter((index) => (index + 1) % 5 === 0 || (index + 1) % 6 === 0)
    .slice(0, Math.min(8, Math.floor(words.length / 4))); // Max 8 blanks

  const blankedVerse = words.map((word, index) => {
    if (blankIndices.includes(index)) {
      return '____';
    }
    return word;
  }).join(' ');

  const checkCompletion = () => {
    const allFilled = blankIndices.every(index => 
      userAnswers[index]?.trim().toLowerCase() === words[index].toLowerCase()
    );
    
    if (allFilled && !isComplete) {
      setIsComplete(true);
      const timeSpent = Date.now() - startTime;
      const accuracy = calculateAccuracy();
      onComplete?.(timeSpent, accuracy);
    }
  };

  const calculateAccuracy = () => {
    const correctAnswers = blankIndices.filter(index =>
      userAnswers[index]?.trim().toLowerCase() === words[index].toLowerCase()
    ).length;
    return Math.round((correctAnswers / blankIndices.length) * 100);
  };

  useEffect(() => {
    checkCompletion();
  }, [userAnswers]);

  const handleInputChange = (index: number, value: string) => {
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  const reset = () => {
    setUserAnswers({});
    setIsComplete(false);
    setShowHints(false);
  };

  const getHint = (index: number) => {
    if (!showHints) return '';
    return words[index].charAt(0) + '...';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Fill in the Blanks</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHints(!showHints)}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              {showHints ? 'Hide' : 'Show'} Hints
            </Button>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{reference}</Badge>
          <Badge variant="outline">{blankIndices.length} blanks to fill</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-lg leading-relaxed p-6 bg-muted/30 rounded-lg">
          {words.map((word, index) => {
            if (blankIndices.includes(index)) {
              const userAnswer = userAnswers[index] || '';
              const isCorrect = userAnswer.trim().toLowerCase() === word.toLowerCase();
              
              return (
                <span key={index} className="inline-block mx-1">
                  <Input
                    value={userAnswer}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    placeholder={showHints ? getHint(index) : '____'}
                    className={`inline w-20 h-8 text-center text-sm mx-1 ${
                      isCorrect ? 'border-success bg-success/10' :
                      userAnswer ? 'border-destructive bg-destructive/10' :
                      'border-muted-foreground'
                    }`}
                    disabled={isComplete}
                  />
                </span>
              );
            }
            return <span key={index} className="mx-1">{word}</span>;
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Progress: {Object.keys(userAnswers).length} of {blankIndices.length} blanks filled
          </div>
          <div className="text-sm font-medium">
            Accuracy: {calculateAccuracy()}%
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(Object.keys(userAnswers).length / blankIndices.length) * 100}%` 
            }}
          />
        </div>

        {isComplete && (
          <div className="text-center p-4 bg-success/10 rounded-lg border border-success/20">
            <h3 className="text-lg font-semibold text-success mb-1">Excellent Work!</h3>
            <p className="text-sm text-success/80">
              You completed the exercise with {calculateAccuracy()}% accuracy
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};