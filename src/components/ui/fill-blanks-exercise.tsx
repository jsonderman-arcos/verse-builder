import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Brain, RotateCcw, Lightbulb } from "lucide-react";

interface FillBlanksExerciseProps {
  verse: string;
  reference: string;
  day?: number; // 1-7 for progressive difficulty
  onComplete?: (timeSpent: number, accuracy: number) => void;
}

export const FillBlanksExercise = ({ verse, reference, day = 4, onComplete }: FillBlanksExerciseProps) => {
  const [startTime] = useState(Date.now());
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [isComplete, setIsComplete] = useState(false);

  // Calculate difficulty percentage based on day (10% to 60%)
  const difficultyPercentage = Math.min(60, 10 + (day - 1) * 8.33);
  
  const words = verse.split(' ');
  
  // Smart word selection: prioritize important words
  const getWordImportance = (word: string, index: number) => {
    const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
    // Skip very short words and common articles/prepositions
    if (cleanWord.length <= 2) return 0;
    if (['the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by'].includes(cleanWord)) return 1;
    // Prioritize longer, more meaningful words
    return cleanWord.length + (index % 3 === 0 ? 1 : 0); // Add slight preference for even distribution
  };

  // Create blanks based on difficulty percentage
  const targetBlanks = Math.max(1, Math.floor((words.length * difficultyPercentage) / 100));
  const wordImportances = words.map((word, index) => ({ word, index, importance: getWordImportance(word, index) }));
  wordImportances.sort((a, b) => b.importance - a.importance);
  
  const blankIndices = wordImportances
    .slice(0, targetBlanks)
    .map(item => item.index)
    .sort((a, b) => a - b); // Sort back to original order

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
    // Ensure the first letter is always present
    const originalWord = words[index];
    const firstLetter = originalWord.charAt(0).toUpperCase();
    
    if (value.length === 0 || !value.startsWith(firstLetter)) {
      value = firstLetter + value.replace(firstLetter, '');
    }
    
    setUserAnswers(prev => ({ ...prev, [index]: value }));
  };

  const reset = () => {
    setUserAnswers({});
    setIsComplete(false);
  };

  const getFirstLetterHint = (index: number) => {
    const word = words[index];
    const firstChar = word.charAt(0).toUpperCase();
    return firstChar + '____';
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
            <Badge variant="outline">Day {day}/7</Badge>
            <Badge variant="secondary">{Math.round(difficultyPercentage)}% difficulty</Badge>
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
                    placeholder={getFirstLetterHint(index)}
                    className={`inline w-24 h-8 text-center text-sm mx-1 ${
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