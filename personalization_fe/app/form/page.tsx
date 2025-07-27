"use client"
import { WaitlistWrapper } from "@/components/box";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAppContext } from "@/context";
import { useRouter } from "next/navigation";

// Static form content
const staticFormData = {
  title: "Feedback Preferences",
  subtitle: "Help us customize your EarEye experience with these quick settings.",
};

type FormState = "idle" | "loading" | "success" | "error";
type FormData = {
  audioLevel: number; // 0: low, 1: medium, 2: high
  frequencyLevel: number; // 0: low, 1: medium, 2: high
  noFeedbackFrom: string[]; // Array of objects to ignore
  soundTracks: string[]; // Array of selected sound tracks
};

const questions = [
  {
    id: "audioSettings",
    //title: "Audio Settings",
    type: "dual-slider" as const,
    required: true,
  },
  {
    id: "noFeedbackFrom",
    title: "Select what you don't want feedback from:",
    type: "checkbox-group" as const,
    options: [
      { 
        value: "slow", 
        label: "Slow object", 
        examples: "Cars, bicycles, pedestrians walking slowly"
      },
      { 
        value: "fast", 
        label: "Fast object", 
        examples: "Running people, speeding vehicles, animals"
      },
      { 
        value: "static", 
        label: "Static object", 
        examples: "Walls, furniture, parked cars, trees"
      },
    ],
    required: false,
  },
  {
    id: "soundTracks",
    title: "Choose your preferred sound alerts:",
    type: "sound-grid" as const,
    options: [
      { value: "violin/violin_A3_025_forte_arco-normal", label: "Violin", emoji: "🎻" },
      { value: "flute/flute_A4_025_forte_normal", label: "Flute", emoji: "🎵" },
      { value: "guitar/guitar_A3_very-long_forte_normal", label: "Guitar", emoji: "🎸" },
      { value: "piano/piano_A3_025_forte_normal", label: "Piano", emoji: "🎹" },
      { value: "trumpet/trumpet_A3_025_forte_normal", label: "Trumpet", emoji: "🎺" },
      { value: "percussion/bell tree/bell-tree__025_forte_struck-singly", label: "Bell Tree", emoji: "🔔" },
      { value: "percussion/triangle/triangle__025_forte_struck-singly", label: "Triangle", emoji: "📐" },
      { value: "percussion/wind chimes/wind-chimes__025_forte_struck-singly", label: "Wind Chimes", emoji: "🎐" },
      { value: "percussion/sleigh bells/sleigh-bells__025_forte_shaken", label: "Sleigh Bells", emoji: "🛎️" },
      { value: "percussion/tambourine/tambourine__025_forte_shaken", label: "Tambourine", emoji: "🥁" },
      { value: "cello/cello_A2_025_forte_arco-normal", label: "Cello", emoji: "🎻" },
      { value: "clarinet/clarinet_A3_025_forte_normal", label: "Clarinet", emoji: "🎶" },
      { value: "oboe/oboe_A4_025_forte_normal", label: "Oboe", emoji: "🎼" },
      { value: "french horn/french-horn_A2_025_forte_normal", label: "French Horn", emoji: "📯" },
      { value: "tuba/tuba_A1_025_forte_normal", label: "Tuba", emoji: "🎵" },
      { value: "banjo/banjo_A3_very-long_forte_normal", label: "Banjo", emoji: "🪕" },
      { value: "mandolin/mandolin_A3_very-long_forte_normal", label: "Mandolin", emoji: "🎸" },
      { value: "percussion/vibraslap/vibraslap__025_forte_struck-singly", label: "Vibraslap", emoji: "🎯" },
      { value: "percussion/woodblock/woodblock__025_forte_struck-singly", label: "Woodblock", emoji: "🪵" },
      { value: "percussion/train whistle/train-whistle__025_forte_blown", label: "Train Whistle", emoji: "🚂" }
    ],
    required: true,
  },
];

const audioLevels = ["Low", "Medium", "High"];
const frequencyLevels = ["Low", "Medium", "High"];

export default function FormPage() {
  const { hasCompletedForm, completeForm } = useAppContext();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    audioLevel: 1, // Default to medium
    frequencyLevel: 1, // Default to medium
    noFeedbackFrom: [],
    soundTracks: [],
  });
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState<string>("");

  // Redirect to main page if form is already completed
  useEffect(() => {
    if (hasCompletedForm) {
      router.push('/');
    }
  }, [hasCompletedForm, router]);

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

  const playAudioSample = async (soundType: string) => {
    try {
      // Create new Audio element
      const audio = new Audio(`/audio/all-samples/${soundType}.mp3`);
      
      // Set volume to a reasonable level
      audio.volume = 0.3;
      
      // Play the audio
      await audio.play();
      
      // Clean up after playback
      audio.onended = () => {
        audio.remove();
      };
    } catch (error) {
      console.error('Error playing audio sample:', error);
    }
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
      
      // Complete the form using context
      completeForm(formData);
      
      setState("success");
      
      // Redirect to main page after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
      
    } catch (err) {
      setError("There was an error submitting your preferences. Please try again.");
      setState("error");
    }
  };

  // Show loading if form is already completed
  if (hasCompletedForm) {
    return (
      <WaitlistWrapper>
        <div className="text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <h1 className="text-2xl font-medium text-slate-12">Redirecting...</h1>
          <p className="text-slate-10">You've already completed the setup form.</p>
        </div>
      </WaitlistWrapper>
    );
  }

  if (state === "success") {
    return (
      <WaitlistWrapper>
        <div className="text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h1 className="text-2xl font-medium text-slate-12">Thank You!</h1>
          <p className="text-slate-10">Your preferences have been submitted successfully.</p>
          <p className="text-slate-10 text-sm">Redirecting to main page...</p>
        </div>
      </WaitlistWrapper>
    );
  }

  return (
    <WaitlistWrapper>
      {/* Fixed Header Section */}
      <div className="w-full space-y-4">
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
              </div>
              <div className="w-full bg-gray-6 rounded-full h-2">
                <div 
                  className="bg-slate-9 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(currentStep / (questions.length - 1)) * 100}%` }}
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
      </div>
      
      {/* Question Content - Stationary Container */}
      <div className="w-full space-y-6 h-[500px] overflow-y-auto">
        <div className="text-center">
          <h2 className="text-lg font-medium text-slate-12 mb-6">
            {currentQuestion.title}
          </h2>
          
          {/* Dual Slider - Audio Level and Frequency */}
          {currentQuestion.type === "dual-slider" && (
            <div className="space-y-8">
              {/* Audio Level Slider */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-12 text-left">Audio Level</h3>
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
              </div>

              {/* Frequency Level Slider */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-slate-12 text-left">Frequency Level</h3>
                <div className="w-full max-w-2xl mx-auto">
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={formData.frequencyLevel}
                    onChange={(e) => updateFormData("frequencyLevel", parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-6 rounded-lg appearance-none cursor-pointer slider"
                    disabled={state === "loading"}
                  />
                  <div className="flex justify-between text-sm text-slate-10 mt-2">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Checkbox Group */}
          {currentQuestion.type === "checkbox-group" && currentQuestion.options && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {currentQuestion.options.map((option) => (
                <label key={option.value} className="flex items-start justify-start text-left p-4 border border-gray-6 rounded-lg hover:bg-gray-2 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={(formData[currentQuestion.id as keyof FormData] as string[]).includes(option.value)}
                    onChange={(e) => handleCheckboxChange(currentQuestion.id as keyof FormData, option.value, e.target.checked)}
                    className="mr-3 mt-1 text-slate-8 focus:ring-slate-8"
                    disabled={state === "loading"}
                  />
                  <div className="flex-1">
                    <div className="text-slate-11 text-base font-medium">{option.label}</div>
                    <div className="text-slate-10 text-sm mt-1">{option.examples}</div>
                  </div>
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