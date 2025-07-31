import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, RotateCcw, CheckCircle2, XCircle } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ReferenceQuizProps {
  reference: string;
  verse: string;
  onComplete?: (timeSpent: number, accuracy: number) => void;
}

export const ReferenceQuiz = ({ reference, verse, onComplete }: ReferenceQuizProps) => {
  const [startTime] = useState(Date.now());
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Parse the reference (e.g., "Proverbs 3:5-6")
  const parseReference = (ref: string) => {
    const match = ref.match(/^(\d?\s?\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (match) {
      return {
        book: match[1],
        chapter: match[2],
        startVerse: match[3],
        endVerse: match[4] || match[3]
      };
    }
    return { book: '', chapter: '', startVerse: '', endVerse: '' };
  };

  const correctRef = parseReference(reference);

  const questions = [
    {
      question: "Which book is this verse from?",
      options: [correctRef.book, "Psalms", "Romans", "John"],
      correct: correctRef.book
    },
    {
      question: "What chapter is this verse in?",
      options: [correctRef.chapter, "2", "4", "7"],
      correct: correctRef.chapter
    },
    {
      question: "What verse(s) does this reference?",
      options: [
        correctRef.endVerse !== correctRef.startVerse ? 
          `${correctRef.startVerse}-${correctRef.endVerse}` : 
          correctRef.startVerse,
        "1-2", "8", "12-13"
      ],
      correct: correctRef.endVerse !== correctRef.startVerse ? 
        `${correctRef.startVerse}-${correctRef.endVerse}` : 
        correctRef.startVerse
    }
  ];

  // Shuffle options for each question
  const shuffledQuestions = questions.map(q => ({
    ...q,
    options: [...q.options].sort(() => Math.random() - 0.5)
  }));

  const handleAnswer = (answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = answer;
    setUserAnswers(newAnswers);

    if (currentQuestion < shuffledQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz complete
      setTimeout(() => {
        setShowResults(true);
        setIsComplete(true);
        const timeSpent = Date.now() - startTime;
        const accuracy = calculateAccuracy(newAnswers);
        onComplete?.(timeSpent, accuracy);
      }, 500);
    }
  };

  const calculateAccuracy = (answers: string[]) => {
    const correct = answers.filter((answer, index) => 
      answer === shuffledQuestions[index].correct
    ).length;
    return Math.round((correct / shuffledQuestions.length) * 100);
  };

  const reset = () => {
    setCurrentQuestion(0);
    setUserAnswers([]);
    setIsComplete(false);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle>Reference Quiz Results</CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Try Again
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center p-6 bg-gradient-celestial rounded-lg">
            <h3 className="text-2xl font-bold text-foreground mb-2">
              Score: {calculateAccuracy(userAnswers)}%
            </h3>
            <p className="text-muted-foreground">
              You got {userAnswers.filter((answer, index) => 
                answer === shuffledQuestions[index].correct
              ).length} out of {shuffledQuestions.length} questions correct
            </p>
          </div>

          <div className="space-y-4">
            {shuffledQuestions.map((question, index) => {
              const userAnswer = userAnswers[index];
              const isCorrect = userAnswer === question.correct;
              
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start space-x-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-success mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{question.question}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your answer: <span className={isCorrect ? 'text-success' : 'text-destructive'}>
                          {userAnswer}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-success mt-1">
                          Correct answer: {question.correct}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Badge variant="secondary" className="text-sm">
              Reference: {reference}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <CardTitle>Reference Quiz</CardTitle>
          </div>
          <Badge variant="outline">
            Question {currentQuestion + 1} of {shuffledQuestions.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${((currentQuestion) / shuffledQuestions.length) * 100}%` 
            }}
          />
        </div>

        <div className="text-center p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">The verse you're learning:</p>
          <p className="text-sm italic">"{verse.substring(0, 50)}..."</p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">
            {shuffledQuestions[currentQuestion]?.question}
          </h3>
          
          <RadioGroup onValueChange={handleAnswer} className="space-y-3">
            {shuffledQuestions[currentQuestion]?.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
};