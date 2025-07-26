"use client"
import { WaitlistWrapper } from "@/components/box";
import { useState, useEffect } from "react";
import { Play, RotateCcw } from "lucide-react";
import { useAppContext } from "@/context";
import { useRouter } from "next/navigation";

const soundOptions = [
  "Tone Sound",
  "Chime Sound",
  "Click Sound",
  "Beep Sound",
  "Musical Sound",
  "Nature Sound",
  "Voice Alert",
  "Harmonic Sound"
];

export default function Home() {
  const { hasCompletedForm, formData, logChoices, resetForm } = useAppContext();
  const router = useRouter();
  const [volume, setVolume] = useState(75);
  const [frequency, setFrequency] = useState(50);
  const [objectSounds, setObjectSounds] = useState({
    slow: "Tone Sound",
    fast: "Chime Sound", 
    static: "Click Sound"
  });

  // Redirect to form if not completed
  useEffect(() => {
    if (!hasCompletedForm) {
      router.push('/form');
    }
  }, [hasCompletedForm, router]);

  // Update volume and frequency from form data
  useEffect(() => {
    if (formData) {
      // Convert form data to percentage values
      const audioLevelToPercentage = (level: number) => {
        switch (level) {
          case 0: return 25; // Low
          case 1: return 75; // Medium
          case 2: return 100; // High
          default: return 75;
        }
      };

      const frequencyLevelToPercentage = (level: number) => {
        switch (level) {
          case 0: return 25; // Low
          case 1: return 50; // Medium
          case 2: return 100; // High
          default: return 50;
        }
      };

      setVolume(audioLevelToPercentage(formData.audioLevel));
      setFrequency(frequencyLevelToPercentage(formData.frequencyLevel));
      logChoices();
    }
  }, [formData, logChoices]);

  const playPreview = (soundType: string, category: string) => {
    console.log(`Playing preview for ${category}: ${soundType}`);
    // Here you would implement actual audio playback

    // Simple Web Audio API demo
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const frequencies: { [key: string]: number } = {
      "Tone Sound": 440,
      "Chime Sound": 800,
      "Click Sound": 1200,
      "Beep Sound": 500,
      "Musical Sound": 523,
      "Nature Sound": 200,
      "Voice Alert": 300,
      "Harmonic Sound": 660
    };

    oscillator.frequency.setValueAtTime(frequencies[soundType] || 440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(volume / 100 * 0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const handleResetForm = () => {
    resetForm();
    router.push('/form');
  };

  // Show loading while checking form completion
  if (!hasCompletedForm) {
    return (
      <WaitlistWrapper>
        <div className="text-center space-y-4">
          <div className="text-4xl">⏳</div>
          <h1 className="text-2xl font-medium text-slate-12">Loading...</h1>
          <p className="text-slate-10">Redirecting to setup form...</p>
        </div>
      </WaitlistWrapper>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Reset Button for Testing */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleResetForm}
          className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Form (Hard Refresh)</span>
        </button>
      </div>

      {/* Main Layout with Side Containers */}
      <div className="flex gap-6">
        {/* Left Side Containers */}
        <div className="flex flex-col gap-6 w-64 flex-shrink-0">
          {/* Top Left Container */}
          <div className="bg-gray-1/85 rounded-2xl p-6 shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-12 mb-2">Audio Preferences</h3>
                <p className="text-slate-10 text-sm">Audio feedback summary</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-11">Volume Level</span>
                    <span className="text-sm font-medium text-slate-12">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-6 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-11">Frequency</span>
                    <span className="text-sm font-medium text-slate-12">{frequency}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-6 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-11">Active Sounds</span>
                    <span className="text-sm font-medium text-slate-12">
                      {formData?.soundTracks?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Left Container */}
          <div className="bg-gray-1/85 rounded-2xl p-6 shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-12 mb-2">Recent Activity</h3>
                <p className="text-slate-10 text-sm">Latest audio feedback events</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🚗</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Vehicle detected</div>
                      <div className="text-xs text-slate-10">2 minutes ago</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👥</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Person nearby</div>
                      <div className="text-xs text-slate-10">5 minutes ago</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📦</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Obstacle ahead</div>
                      <div className="text-xs text-slate-10">8 minutes ago</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <WaitlistWrapper>
            <div className="w-full space-y-6">
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-12">
                  Audio Navigation Assistant
                </h1>
                <p className="text-slate-10 text-sm">
                  Personalize your wearable device audio feedback
                </p>
              </div>

              {/* Object Categories Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-12 mb-2">Object Categories</h2>
                  <p className="text-slate-10 text-sm">
                    Customize audio feedback for different types of objects and situations.
                  </p>
                </div>

                {/* Object Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Slow Object */}
                  <div className={`bg-gray-2 border border-gray-6 rounded-lg p-4 space-y-3 ${
                    formData?.noFeedbackFrom?.includes('slow') ? 'opacity-50 grayscale' : ''
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🚶</span>
                      <h3 className="font-semibold text-slate-12">Slow Object</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-10">Cars, bicycles, pedestrians walking slowly</p>
                      <label className="block text-sm font-medium text-slate-11">
                        Select Sound
                      </label>
                      <select
                        value={objectSounds.slow || "Tone Sound"}
                        onChange={(e) => setObjectSounds({...objectSounds, slow: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-6 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={formData?.noFeedbackFrom?.includes('slow')}
                      >
                        {soundOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => playPreview(objectSounds.slow || "Tone Sound", "slow")}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-6 rounded-md text-sm font-medium text-slate-11 hover:bg-gray-3 transition-colors"
                        disabled={formData?.noFeedbackFrom?.includes('slow')}
                      >
                        <Play className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Fast Object */}
                  <div className={`bg-gray-2 border border-gray-6 rounded-lg p-4 space-y-3 ${
                    formData?.noFeedbackFrom?.includes('fast') ? 'opacity-50 grayscale' : ''
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🏃</span>
                      <h3 className="font-semibold text-slate-12">Fast Object</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-10">Running people, speeding vehicles, animals</p>
                      <label className="block text-sm font-medium text-slate-11">
                        Select Sound
                      </label>
                      <select
                        value={objectSounds.fast || "Chime Sound"}
                        onChange={(e) => setObjectSounds({...objectSounds, fast: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-6 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={formData?.noFeedbackFrom?.includes('fast')}
                      >
                        {soundOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => playPreview(objectSounds.fast || "Chime Sound", "fast")}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-6 rounded-md text-sm font-medium text-slate-11 hover:bg-gray-3 transition-colors"
                        disabled={formData?.noFeedbackFrom?.includes('fast')}
                      >
                        <Play className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>

                  {/* Static Object */}
                  <div className={`bg-gray-2 border border-gray-6 rounded-lg p-4 space-y-3 ${
                    formData?.noFeedbackFrom?.includes('static') ? 'opacity-50 grayscale' : ''
                  }`}>
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">🏠</span>
                      <h3 className="font-semibold text-slate-12">Static Object</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-sm text-slate-10">Walls, furniture, parked cars, trees</p>
                      <label className="block text-sm font-medium text-slate-11">
                        Select Sound
                      </label>
                      <select
                        value={objectSounds.static || "Click Sound"}
                        onChange={(e) => setObjectSounds({...objectSounds, static: e.target.value})}
                        className="w-full px-3 py-2 bg-white border border-gray-6 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={formData?.noFeedbackFrom?.includes('static')}
                      >
                        {soundOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => playPreview(objectSounds.static || "Click Sound", "static")}
                        className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-6 rounded-md text-sm font-medium text-slate-11 hover:bg-gray-3 transition-colors"
                        disabled={formData?.noFeedbackFrom?.includes('static')}
                      >
                        <Play className="w-4 h-4" />
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    console.log("Saving settings:", { volume, frequency, objectSounds });
                    alert("Settings saved successfully!");
                  }}
                  className="w-full bg-slate-12 text-slate-1 py-3 px-6 rounded-lg font-medium hover:bg-slate-11 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-8"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </WaitlistWrapper>
        </div>

        {/* Right Side Container */}
        <div className="w-64 flex-shrink-0">
          <div className="bg-gray-1/85 rounded-2xl p-6 shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-12 mb-2">Sound Library</h3>
                <p className="text-slate-10 text-sm">Available audio feedback options</p>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🔔</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Gentle Chime</div>
                      <div className="text-xs text-slate-10">Soft notification</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">📢</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Soft Beep</div>
                      <div className="text-xs text-slate-10">Alert sound</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎵</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Musical Tone</div>
                      <div className="text-xs text-slate-10">Melodic feedback</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🌿</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Nature Sound</div>
                      <div className="text-xs text-slate-10">Organic feedback</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🎶</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Whistle</div>
                      <div className="text-xs text-slate-10">Clear signal</div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-2 border border-gray-6 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👆</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-12">Click</div>
                      <div className="text-xs text-slate-10">Quick feedback</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #1e293b;
          cursor: pointer;
          border: 2px solid #f8fafc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #1e293b;
          cursor: pointer;
          border: 2px solid #f8fafc;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .slider::-webkit-slider-track {
          background: transparent;
        }
        .slider::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}
