import { useState } from "react";
import { Navigation } from "@/components/ui/navigation";
import { VerseCard } from "@/components/ui/verse-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarDays, BookOpen, Clock, PlayCircle, CheckCircle2, Target } from "lucide-react";

const currentVerse = {
  verse: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
  reference: "Proverbs 3:5-6",
  translation: "NIV",
  contextBefore: "My son, do not forget my teaching, but keep my commands in your heart, for they will prolong your life many years and bring you peace and prosperity.",
  contextAfter: "Do not be wise in your own eyes; fear the LORD and shun evil. This will bring health to your body and nourishment to your bones.",
  background: "Written by King Solomon, this passage is part of his wisdom literature instructing his son (and all readers) to trust completely in God's guidance rather than relying solely on human wisdom.",
  weekDay: 3,
  weekOf: "November 25, 2024"
};

const dailyExercises = {
  1: [
    { id: 1, name: "Typing Practice", description: "Type the verse to build muscle memory", icon: "keyboard", completed: true },
    { id: 2, name: "Fill in the Blanks", description: "Complete missing words", icon: "edit", completed: true }
  ],
  2: [
    { id: 3, name: "Word Order", description: "Arrange words in correct sequence", icon: "shuffle", completed: true },
    { id: 4, name: "Multiple Choice", description: "Choose correct words from options", icon: "check", completed: true }
  ],
  3: [
    { id: 5, name: "Typing Practice", description: "Type the verse to build muscle memory", icon: "keyboard", completed: false },
    { id: 6, name: "Audio Recall", description: "Listen and repeat the verse", icon: "headphones", completed: false }
  ],
  4: [
    { id: 7, name: "Memory Test", description: "Recite from memory", icon: "brain", completed: false },
    { id: 8, name: "Speed Challenge", description: "Type verse under time pressure", icon: "timer", completed: false }
  ],
  5: [
    { id: 9, name: "First Letter Hints", description: "Type with only first letters shown", icon: "eye", completed: false },
    { id: 10, name: "Reflection", description: "Write personal reflection", icon: "pen", completed: false }
  ],
  6: [
    { id: 11, name: "Review Mix", description: "Mixed exercises from the week", icon: "repeat", completed: false },
    { id: 12, name: "Context Match", description: "Match verse with context", icon: "link", completed: false }
  ],
  7: [
    { id: 13, name: "Final Test", description: "Complete verse from memory", icon: "award", completed: false },
    { id: 14, name: "Teaching", description: "Explain verse to others", icon: "users", completed: false }
  ]
};

const Verses = () => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  return (
    <>
      <Navigation />
      <main className="pt-20 min-h-screen bg-gradient-peaceful">
        <div className="container mx-auto px-4 py-8">
          {/* Current Week Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">This Week's Verse</h1>
                <p className="text-muted-foreground">Week of {currentVerse.weekOf}</p>
              </div>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <CalendarDays className="w-4 h-4" />
                <span>Day {currentVerse.weekDay} of 7</span>
              </Badge>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Verse Display */}
            <div className="lg:col-span-2 space-y-6">
              <VerseCard
                verse={currentVerse.verse}
                reference={currentVerse.reference}
                translation={currentVerse.translation}
                isHighlighted={true}
                showContext={true}
                contextBefore={currentVerse.contextBefore}
                contextAfter={currentVerse.contextAfter}
              />

              {/* Background Information */}
              <Card className="p-6 bg-card/50 backdrop-blur-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Background & Context</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {currentVerse.background}
                </p>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Week Progress */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Week Progress</h3>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all hover:shadow-sm ${
                        selectedDay === day
                          ? 'bg-primary/20 border-2 border-primary/40'
                          : day <= currentVerse.weekDay
                          ? 'bg-primary/10 border border-primary/20 hover:bg-primary/15'
                          : 'bg-muted/30 border border-border/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          day < currentVerse.weekDay
                            ? 'bg-success text-success-foreground'
                            : day === currentVerse.weekDay
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {day < currentVerse.weekDay ? '✓' : day}
                        </div>
                        <span className={`text-sm font-medium ${
                          day <= currentVerse.weekDay ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          Day {day}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {day === currentVerse.weekDay && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                        {selectedDay === day && (
                          <Target className="w-4 h-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Selected Day Exercises */}
                {selectedDay && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      Day {selectedDay} Exercises
                    </h4>
                    <div className="space-y-2">
                      {dailyExercises[selectedDay as keyof typeof dailyExercises]?.map((exercise) => (
                        <div
                          key={exercise.id}
                          className={`flex items-center justify-between p-2 rounded-md text-xs ${
                            exercise.completed
                              ? 'bg-success/10 text-success-foreground'
                              : 'bg-muted/50 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {exercise.completed ? (
                              <CheckCircle2 className="w-3 h-3 text-success" />
                            ) : (
                              <PlayCircle className="w-3 h-3" />
                            )}
                            <span className="font-medium">{exercise.name}</span>
                          </div>
                          <Badge variant={exercise.completed ? "default" : "outline"} className="text-xs">
                            {exercise.completed ? "Done" : "Start"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>

              {/* Today's Practice */}
              <Card className="p-6 bg-gradient-celestial">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Today's Practice</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready for today's memorization exercise?
                </p>
                <Button className="w-full" size="sm">
                  Start Practice Session
                </Button>
              </Card>

              {/* Quick Stats */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">This Week</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Exercises Completed</span>
                    <span className="text-sm font-medium text-foreground">4 of 7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Average Accuracy</span>
                    <span className="text-sm font-medium text-foreground">92%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Time Practiced</span>
                    <span className="text-sm font-medium text-foreground">18 min</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Verses;