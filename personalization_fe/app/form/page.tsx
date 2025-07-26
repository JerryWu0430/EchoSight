"use client"
import { WaitlistWrapper } from "@/components/box";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

// Static form content
const staticFormData = {
  title: "Feedback Preferences",
  subtitle: "Help us customize your EarEye experience by telling us about your preferences for object detection and sound feedback.",
};

type FormState = "idle" | "loading" | "success" | "error";
type FormData = {
  feedbackObjects: string;
  ignoreObjects: string;
  soundType: string;
  frequency: string;
  email: string;
};

const questions = [
  {
    id: "feedbackObjects",
    title: "What object types do you want feedback from?",
    type: "text" as const,
    placeholder: "e.g., cars, dogs, bins, people, bicycles",
    required: false,
  },
  {
    id: "ignoreObjects", 
    title: "What object types do you want to ignore?",
    type: "text" as const,
    placeholder: "e.g., small objects, plants, static items",
    required: false,
  },
  {
    id: "soundType",
    title: "What kind of sound do you prefer?",
    type: "radio" as const,
    options: [
      { value: "musical", label: "Musical" },
      { value: "whistle", label: "Whistle" },
      { value: "beep", label: "Beep" },
    ],
    required: true,
  },
  {
    id: "frequency",
    title: "How often do you want sound feedback?",
    type: "radio" as const,
    options: [
      { value: "frequent", label: "Frequent" },
      { value: "occasional", label: "Occasional" },
      { value: "minimal", label: "Minimal" },
    ],
    required: true,
  },
  {
    id: "email",
    title: "What's your email address?",
    type: "email" as const,
    placeholder: "your@email.com",
    required: true,
  },
];

export default function FormPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    feedbackObjects: "",
    ignoreObjects: "",
    soundType: "",
    frequency: "",
    email: "",
  });
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string>("");

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;
  const isFirstStep = currentStep === 0;

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateCurrentStep = (): boolean => {
    const question = currentQuestion;
    const value = formData[question.id as keyof FormData];
    
    if (question.required && !value) {
      setError(`Please ${question.type === 'radio' ? 'select an option' : 'enter a value'} for this question.`);
      return false;
    }
    
    if (question.type === 'email' && value && !value.includes('@')) {
      setError("Please enter a valid email address.");
      return false;
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
      
      console.log("Feedback preferences submission:", formData);
      setState("success");
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setState("idle");
        setCurrentStep(0);
        setFormData({
          feedbackObjects: "",
          ignoreObjects: "",
          soundType: "",
          frequency: "",
          email: "",
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
          
          {/* Text/Email Input */}
          {(currentQuestion.type === "text" || currentQuestion.type === "email") && (
            <input
              type={currentQuestion.type}
              value={formData[currentQuestion.id as keyof FormData]}
              onChange={(e) => updateFormData(currentQuestion.id as keyof FormData, e.target.value)}
              className="w-full px-4 py-3 bg-gray-11/5 rounded-lg text-gray-12 placeholder:text-gray-9 border border-gray-11/10 focus:outline-none focus:ring-2 focus:ring-slate-8 text-center"
              placeholder={currentQuestion.placeholder}
              disabled={state === "loading"}
            />
          )}
          
          {/* Radio Options */}
          {currentQuestion.type === "radio" && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="flex items-center justify-center">
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    value={option.value}
                    checked={formData[currentQuestion.id as keyof FormData] === option.value}
                    onChange={(e) => updateFormData(currentQuestion.id as keyof FormData, e.target.value)}
                    className="mr-3 text-slate-8 focus:ring-slate-8"
                    disabled={state === "loading"}
                  />
                  <span className="text-slate-11 text-lg">{option.label}</span>
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
    </WaitlistWrapper>
  );
} 