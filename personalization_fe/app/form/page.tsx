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
    type: "checkbox-group" as const,
    options: [
      { value: "gentle-chime", label: "Gentle Chime" },
      { value: "soft-beep", label: "Soft Beep" },
      { value: "musical-tone", label: "Musical Tone" },
      { value: "nature-sound", label: "Nature Sound" },
      { value: "whistle", label: "Whistle" },
      { value: "click", label: "Click" },
      { value: "voice-alert", label: "Voice Alert" },
      { value: "harmonic", label: "Harmonic" },
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

  const validateCurrentStep = (): boolean => {
    const question = currentQuestion;
    
    if (question.required) {
      if (question.type === 'checkbox-group') {
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
              <div className="w-full max-w-md mx-auto">
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
            <div className="space-y-3 max-w-md mx-auto">
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