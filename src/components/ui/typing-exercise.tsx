import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, RotateCcw, Lightbulb, Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const [currentRound, setCurrentRound] = useState(1);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [showFirstLetters, setShowFirstLetters] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Create masked verse based on current round
  const getMaskedVerse = () => {
    if (currentRound === 1) return verse; // Full verse for first round
    
    const words = verse.split(" ");
    const maskPercentage = currentRound === 2 ? 0.3 : 0.6; // 30% for round 2, 60% for round 3
    const wordsToMask = Math.floor(words.length * maskPercentage);
    
    // Select random words to mask, but keep first and last words
    const indicesToMask = [];
    const availableIndices = Array.from({length: words.length - 2}, (_, i) => i + 1);
    
    for (let i = 0; i < wordsToMask && availableIndices.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableIndices.length);
      indicesToMask.push(availableIndices.splice(randomIndex, 1)[0]);
    }
    
    return words.map((word, index) => 
      indicesToMask.includes(index) ? "____" : word
    ).join(" ");
  };

  const displayVerse = getMaskedVerse();
  const words = displayVerse.split(" ");
  const userWords = userInput.trim().split(/\s+/);
  const progress = userInput.length > 0 ? (userInput.length / verse.length) * 100 : 0;

  useEffect(() => {
    if (userInput.length === 1 && !startTime) {
      setStartTime(Date.now());
    }
  }, [userInput, startTime]);

  useEffect(() => {
    if (userInput.trim().toLowerCase() === verse.toLowerCase() && !isRoundComplete) {
      setIsRoundComplete(true);
      
      if (currentRound === 3) {
        // All rounds complete
        if (startTime && onComplete) {
          const timeSpent = Date.now() - startTime;
          const accuracy = calculateAccuracy();
          onComplete(timeSpent, accuracy);
        }
      }
    }
  }, [userInput, verse, isRoundComplete, currentRound, startTime, onComplete]);

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
    
    const targetWords = verse.split(" ");
    const targetWord = targetWords[wordIndex]?.toLowerCase().replace(/[^\w]/g, "");
    const userWord = userWords[wordIndex]?.toLowerCase().replace(/[^\w]/g, "");
    
    if (userWord === targetWord) return "correct";
    if (targetWord?.startsWith(userWord)) return "partial";
    return "incorrect";
  };

  const renderVerse = () => {
    return words.map((word, index) => {
      const status = getWordStatus(index);
      const isCurrentWord = index === userWords.length - 1 && !isRoundComplete;
      const isMasked = word === "____";
      
      return (
        <span
          key={index}
          className={cn(
            "transition-all duration-200 px-1 py-0.5 rounded",
            !isMasked && status === "correct" && "bg-success/20 text-success-foreground",
            !isMasked && status === "incorrect" && "bg-destructive/20 text-destructive-foreground",
            !isMasked && status === "partial" && "bg-warning/20 text-warning-foreground",
            !isMasked && status === "upcoming" && "text-muted-foreground",
            isMasked && "bg-muted/40 text-muted-foreground font-mono",
            isCurrentWord && "ring-2 ring-primary/30 bg-primary/10"
          )}
        >
          {isMasked ? (
            "____"
          ) : showFirstLetters && status === "upcoming" ? (
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

  const nextRound = () => {
    setCurrentRound(prev => prev + 1);
    setUserInput("");
    setIsRoundComplete(false);
    textareaRef.current?.focus();
  };

  const reset = () => {
    setUserInput("");
    setCurrentRound(1);
    setIsRoundComplete(false);
    setStartTime(null);
    textareaRef.current?.focus();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks([]);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...uint8Array));

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64 }
      });

      if (error) {
        console.error('Transcription error:', error);
        return;
      }

      if (data && data.text) {
        setUserInput(prev => prev + " " + data.text);
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
    }
  };

  const isComplete = currentRound === 3 && isRoundComplete;

  return (
    <Card className="p-6 space-y-6 bg-gradient-celestial">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Type the Verse</h3>
          <p className="text-sm text-muted-foreground">{reference}</p>
          <Badge variant="outline" className="mt-1">
            Round {currentRound} of 3
          </Badge>
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

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Start typing the verse here..."
              className="flex-1 min-h-[120px] p-4 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              disabled={isComplete}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isComplete}
              className={cn(
                "h-12 w-12 p-0",
                isRecording && "bg-destructive/10 border-destructive hover:bg-destructive/20"
              )}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4 text-destructive" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>
          {isRecording && (
            <p className="text-xs text-muted-foreground">Recording... Click the microphone to stop</p>
          )}
        </div>

        {isRoundComplete && currentRound < 3 && (
          <div className="flex items-center justify-between p-4 bg-success/10 border border-success/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-medium text-success-foreground">
                Round {currentRound} completed!
              </span>
              <Badge variant="secondary" className="ml-2">
                {Math.round(calculateAccuracy())}% accuracy
              </Badge>
            </div>
            <Button onClick={nextRound} size="sm">
              Next Round
            </Button>
          </div>
        )}

        {isComplete && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-success/10 border border-success/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="font-medium text-success-foreground">
              All rounds completed! Excellent work.
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