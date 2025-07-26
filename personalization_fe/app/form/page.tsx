"use client"
import { WaitlistWrapper } from "@/components/box";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

// Static form content
const staticFormData = {
  title: "Feedback Preferences",
  subtitle: "Help us customize your EarEye experience with these quick settings.",
};

type FormState = "idle" | "loading" | "success" | "error";
type FormData = {
  audioLevel: number; // 0: low, 1: medium, 2: high
  noFeedbackFrom: string[]; // Array of objects to ignore
  soundTracks: string[]; // Array of selected sound tracks
};

const questions = [
  {
    id: "audioLevel",
    title: "What audio level do you prefer?",
    type: "slider" as const,
    required: true,
  },
  {
    id: "noFeedbackFrom",
    title: "Select what you don't want feedback from:",
    type: "checkbox-group" as const,
    options: [
      { value: "slow", label: "Slow object" },
      { value: "fast", label: "Fast object" },
      { value: "static", label: "Static object" },
    ],
    required: false,
  },
  {
    id: "soundTracks",
    title: "Choose your preferred sample sound tracks:",
    type: "sound-grid" as const,
    options: [
      { value: "gentle-chime", label: "Gentle Chime", emoji: "🔔" },
      { value: "soft-beep", label: "Soft Beep", emoji: "📢" },
      { value: "musical-tone", label: "Musical Tone", emoji: "🎵" },
      { value: "nature-sound", label: "Nature Sound", emoji: "🌿" },
      { value: "whistle", label: "Whistle", emoji: "🎶" },
      { value: "click", label: "Click", emoji: "👆" },
      { value: "voice-alert", label: "Voice Alert", emoji: "🗣️" },
      { value: "harmonic", label: "Harmonic", emoji: "🎼" },
    ],
    required: true,
  },
];

const audioLevels = ["Low", "Medium", "High"];

export default function FormPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    audioLevel: 1, // Default to medium
    noFeedbackFrom: [],
    soundTracks: [],
  });
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string>("");

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isFirstStep = currentStep === 0;

  const updateFormData = (field: keyof FormData, value: number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof FormData, value: string, checked: boolean) => {
    const currentValues = formData[field] as string[];
    if (checked) {
      updateFormData(field, [...currentValues, value]);
    } else {
      updateFormData(field, currentValues.filter(item => item !== value));
    }
  };

  const handleSoundSelect = (soundValue: string) => {
    // Play audio sample (simulate with console for now)
    console.log(`Playing audio sample: ${soundValue}`);
    
    // Toggle selection
    const currentValues = formData.soundTracks;
    const isSelected = currentValues.includes(soundValue);
    
    if (isSelected) {
      updateFormData("soundTracks", currentValues.filter(item => item !== soundValue));
    } else {
      updateFormData("soundTracks", [...currentValues, soundValue]);
    }

    // Simulate audio playback
    playAudioSample(soundValue);
  };

  const playAudioSample = (soundType: string) => {
    // Create a simple beep sound for demonstration
    // In a real app, you'd load actual audio files
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    const frequencies: { [key: string]: number } = {
      "gentle-chime": 800,
      "soft-beep": 440,
      "musical-tone": 523,
      "nature-sound": 200,
      "whistle": 1000,
      "click": 1200,
      "voice-alert": 300,
      "harmonic": 660
    };
    
    oscillator.frequency.setValueAtTime(frequencies[soundType] || 440, audioContext.currentTime);
    oscillator.type = soundType === "nature-sound" ? "sawtooth" : "sine";
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const validateCurrentStep = (): boolean => {
    const question = currentQuestion;
    
    if (question.required) {
      if (question.type === 'checkbox-group' || question.type === 'sound-grid') {
        const arrayValue = formData[question.id as keyof FormData] as string[];
        if (!arrayValue || arrayValue.length === 0) {
          setError("Please select at least one option.");
          return false;
        }
      }
    }
    
    setError("");
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;
    
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(prev => prev + 1);
      setError("");
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    setState("loading");
    setError("");

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log("Feedback preferences submission:", {
        ...formData,
        audioLevelText: audioLevels[formData.audioLevel]
      });
      setState("success");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setState("idle");
        setCurrentStep(0);
        setFormData({
          audioLevel: 1,
          noFeedbackFrom: [],
          soundTracks: [],
        });
      }, 3000);
      
    } catch (err) {
      setError("There was an error submitting your preferences. Please try again.");
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <WaitlistWrapper>
        <div className="text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-medium text-slate-12">Thank You!</h1>
          <p className="text-slate-10">Your preferences have been submitted successfully.</p>
        </div>
      </WaitlistWrapper>
    );
  }

  return (
    <WaitlistWrapper>
      {/* Header */}
      <div className="space-y-1 text-center">
        <h1 className="text-2xl sm:text-3xl font-medium text-slate-12">
          {staticFormData.title}
        </h1>
        <p className="text-slate-10 text-sm">
          {staticFormData.subtitle}
        </p>
      </div>

      {/* Navigation arrows and progress indicator */}
      <div className="w-full space-y-4">
        {/* Navigation arrows */}
        <div className="flex justify-between items-center">
          {/* Previous arrow */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={isFirstStep || state === "loading"}
            className="w-10 h-10 rounded-full bg-gray-11/10 hover:bg-gray-11/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="text-gray-11 w-5 h-5" />
          </button>

          {/* Progress indicator */}
          <div className="flex-1 mx-4">
            <div className="flex justify-between text-xs text-slate-9 mb-2">
              <span>Question {currentStep + 1} of {questions.length}</span>
              <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-6 rounded-full h-2">
              <div 
                className="bg-slate-9 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Next arrow */}
          <button
            type="button"
            onClick={handleNext}
            disabled={state === "loading"}
            className="w-10 h-10 rounded-full bg-gray-12 hover:bg-gray-11 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {state === "loading" ? (
              <span className="text-gray-1 text-sm">...</span>
            ) : isLastStep ? (
              <Check className="text-gray-1 w-5 h-5" />
            ) : (
              <ChevronRight className="text-gray-1 w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Question */}
      <div className="w-full space-y-6">
        <div className="text-center">
          <h2 className="text-lg font-medium text-slate-12 mb-6">
            {currentQuestion.title}
          </h2>
          
          {/* Audio Level Slider */}
          {currentQuestion.type === "slider" && (
            <div className="space-y-4">
              <div className="w-full max-w-2xl mx-auto">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="1"
                  value={formData.audioLevel}
                  onChange={(e) => updateFormData("audioLevel", parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-6 rounded-lg appearance-none cursor-pointer slider"
                  disabled={state === "loading"}
                />
                <div className="flex justify-between text-sm text-slate-10 mt-2">
                  <span>Low</span>
                  <span>Medium</span>
                  <span>High</span>
                </div>
              </div>
              <div className="text-lg font-medium text-slate-12">
                {audioLevels[formData.audioLevel]}
              </div>
            </div>
          )}

          {/* Checkbox Group */}
          {currentQuestion.type === "checkbox-group" && currentQuestion.options && (
            <div className="space-y-3 max-w-2xl mx-auto">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="flex items-center justify-start text-left">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={(formData[currentQuestion.id as keyof FormData] as string[]).includes(option.value)}
                    onChange={(e) => handleCheckboxChange(currentQuestion.id as keyof FormData, option.value, e.target.checked)}
                    className="mr-3 text-slate-8 focus:ring-slate-8"
                    disabled={state === "loading"}
                  />
                  <span className="text-slate-11 text-base">{option.label}</span>
                </label>
              ))}
            </div>
          )}

          {/* Sound Grid */}
          {currentQuestion.type === "sound-grid" && currentQuestion.options && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {currentQuestion.options.map((option) => {
                const isSelected = formData.soundTracks.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSoundSelect(option.value)}
                    disabled={state === "loading"}
                    className={`
                      relative flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200 min-h-[100px]
                      ${isSelected 
                        ? 'border-slate-8 bg-slate-8/10 shadow-md' 
                        : 'border-gray-6 bg-gray-3 hover:border-gray-8 hover:bg-gray-4'
                      }
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                  >
                    <div className="text-3xl mb-2">{option.emoji}</div>
                    <div className="text-sm text-slate-11 text-center font-medium">
                      {option.label}
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-slate-8 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-red-500 text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1e293b;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #1e293b;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </WaitlistWrapper>
  );
} 