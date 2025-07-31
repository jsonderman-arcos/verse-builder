import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Navigation } from "@/components/ui/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

type BibleOrder = "canonical" | "chronological" | "narrative" | "bookType";

const Settings = () => {
  const [selectedOrder, setSelectedOrder] = useState<BibleOrder>(() => {
    return (localStorage.getItem("bibleOrder") as BibleOrder) || "canonical";
  });

  const restartBible = () => {
    // Clear all Bible progress from localStorage
    const keysToRemove = ["bibleProgress", "completedExercises", "verseProgress", "weekProgress"];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    toast.success("Bible progress restarted! Starting fresh from the beginning.");
  };

  const handleSaveSettings = () => {
    const previousOrder = localStorage.getItem("bibleOrder");
    const hasOrderChanged = previousOrder && previousOrder !== selectedOrder;
    
    // Store in localStorage for now - can be moved to Supabase later
    localStorage.setItem("bibleOrder", selectedOrder);
    
    if (hasOrderChanged) {
      // Automatically restart when order changes
      restartBible();
      toast.success("Bible order changed! Progress restarted for new order.");
    } else {
      toast.success("Bible order preference saved!");
    }
  };

  const orderOptions = [
    {
      value: "canonical" as BibleOrder,
      title: "Canonical Order",
      description: "Traditional order from Genesis to Revelation"
    },
    {
      value: "chronological" as BibleOrder,
      title: "Chronological Order", 
      description: "Timeline of Biblical events as they occurred"
    },
    {
      value: "narrative" as BibleOrder,
      title: "Narrative Order",
      description: "Follows story chronology for narrative continuity"
    },
    {
      value: "bookType" as BibleOrder,
      title: "Book Type Groupings",
      description: "Organized by types: Law, Prophets, Gospels, Epistles, etc."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-slate-100">
            Settings
          </h1>
          
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">
                Bible Book Order
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Choose the order in which you'd like to progress through Bible verses. 
                This will determine your verse sequence until you complete the entire Bible.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RadioGroup
                value={selectedOrder}
                onValueChange={(value) => setSelectedOrder(value as BibleOrder)}
                className="space-y-4"
              >
                {orderOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <RadioGroupItem 
                      value={option.value} 
                      id={option.value}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="text-base font-medium text-slate-800 dark:text-slate-100 cursor-pointer">
                        {option.title}
                      </Label>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </RadioGroup>
              
              <Button 
                onClick={handleSaveSettings}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg border-0 mt-6">
            <CardHeader>
              <CardTitle className="text-slate-800 dark:text-slate-100">
                Reset Progress
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">
                Start fresh with your Bible memorization journey. This will clear all your progress and completed verses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Restart Bible
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to restart?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete all your Bible memorization progress, including completed verses and exercise history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={restartBible}>
                      Yes, restart my progress
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;