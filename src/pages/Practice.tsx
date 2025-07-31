import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/ui/navigation";
import { TypingExercise } from "@/components/ui/typing-exercise";
import { FillBlanksExercise } from "@/components/ui/fill-blanks-exercise";
import { ReferenceQuiz } from "@/components/ui/reference-quiz";
import { ReflectionExercise } from "@/components/ui/reflection-exercise";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Brain, Heart, RotateCcw } from "lucide-react";

const currentVerse = {
  verse: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  reference: "Proverbs 3:5-6",
  translation: "NIV"
};

const exerciseTypes = [
  {
    id: "typing",
    name: "Type the Verse",
    description: "Type out the complete verse from memory",
    icon: Target,
    difficulty: "Medium",
    color: "bg-primary"
  },
  {
    id: "reference",
    name: "Reference Quiz",
    description: "Can you remember the book, chapter, and verse?",
    icon: BookOpen,
    difficulty: "Easy",
    color: "bg-success"
  },
  {
    id: "fill-blanks",
    name: "Fill in the Blanks",
    description: "Complete the verse with missing words",
    icon: Brain,
    difficulty: "Hard",
    color: "bg-warning"
  },
  {
    id: "reflection",
    name: "Personal Reflection",
    description: "How does this verse apply to your life?",
    icon: Heart,
    difficulty: "Thoughtful",
    color: "bg-accent"
  }
];

const Practice = () => {
  const [searchParams] = useSearchParams();
  const [selectedExercise, setSelectedExercise] = useState<string | null>(
    searchParams.get('exercise') || null
  );
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  const handleExerciseComplete = (exerciseId: string, timeSpent: number, accuracy: number) => {
    setCompletedExercises(prev => [...prev, exerciseId]);
    // Here you would typically save progress to backend
    console.log(`Exercise ${exerciseId} completed in ${timeSpent}ms with ${accuracy}% accuracy`);
  };

  const resetProgress = () => {
    setCompletedExercises([]);
    setSelectedExercise(null);
  };

  // Render individual exercises
  const renderExercise = () => {
    const exerciseData = exerciseTypes.find(e => e.id === selectedExercise);
    if (!exerciseData) return null;

    const commonProps = {
      verse: currentVerse.verse,
      reference: currentVerse.reference,
      onComplete: (time: number, accuracy: number) => {
        handleExerciseComplete(selectedExercise!, time, accuracy);
      }
    };

    return (
      <>
        <Navigation />
        <main className="pt-20 min-h-screen bg-gradient-peaceful">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedExercise(null)}
                  className="mb-4"
                >
                  ← Back to Exercises
                </Button>
                <h1 className="text-3xl font-bold text-foreground mb-2">{exerciseData.name}</h1>
                <p className="text-muted-foreground">{exerciseData.description}</p>
              </div>

              {selectedExercise === 'typing' && <TypingExercise {...commonProps} showHints={true} />}
              {selectedExercise === 'fill-blanks' && <FillBlanksExercise {...commonProps} />}
              {selectedExercise === 'reference' && <ReferenceQuiz {...commonProps} />}
              {selectedExercise === 'reflection' && <ReflectionExercise {...commonProps} />}
            </div>
          </div>
        </main>
      </>
    );
  };

  if (selectedExercise) {
    return renderExercise();
  }

  return (
    <>
      <Navigation />
      <main className="pt-20 min-h-screen bg-gradient-peaceful">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Practice Exercises</h1>
                <p className="text-muted-foreground">Choose your learning method for today</p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Day 3 of 7</span>
                </Badge>
                <Button variant="outline" size="sm" onClick={resetProgress}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset Progress
                </Button>
              </div>
            </div>
          </div>

          {/* Current Verse Reference */}
          <Card className="p-6 mb-8 bg-gradient-celestial">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                This Week's Verse
              </h2>
              <p className="text-lg font-medium text-primary mb-1">
                {currentVerse.reference}
              </p>
              <Badge variant="secondary">{currentVerse.translation}</Badge>
            </div>
          </Card>

          {/* Exercise Options */}
          <div className="grid md:grid-cols-2 gap-6">
            {exerciseTypes.map((exercise) => {
              const Icon = exercise.icon;
              const isCompleted = completedExercises.includes(exercise.id);
              
              return (
                <Card
                  key={exercise.id}
                  className={`p-6 cursor-pointer transition-all duration-300 hover:shadow-elevated ${
                    isCompleted ? 'bg-success/10 border-success/30' : 'hover:bg-card/80'
                  }`}
                  onClick={() => setSelectedExercise(exercise.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${exercise.color} ${
                      isCompleted ? 'opacity-75' : ''
                    }`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {exercise.name}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={exercise.difficulty === "Easy" ? "secondary" : 
                                   exercise.difficulty === "Medium" ? "default" : 
                                   exercise.difficulty === "Hard" ? "destructive" : "outline"}
                            className="text-xs"
                          >
                            {exercise.difficulty}
                          </Badge>
                          {isCompleted && (
                            <Badge variant="secondary" className="text-xs bg-success/20 text-success-foreground">
                              ✓ Complete
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-4">
                        {exercise.description}
                      </p>
                      
                      <Button 
                        variant={isCompleted ? "secondary" : "default"}
                        size="sm"
                        className="w-full"
                      >
                        {isCompleted ? "Practice Again" : "Start Exercise"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Progress Summary */}
          <Card className="p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Today's Progress</h3>
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Completed: {completedExercises.length} of {exerciseTypes.length} exercises
              </div>
              <div className="text-sm font-medium text-foreground">
                {Math.round((completedExercises.length / exerciseTypes.length) * 100)}% Complete
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${(completedExercises.length / exerciseTypes.length) * 100}%` 
                }}
              />
            </div>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Practice;