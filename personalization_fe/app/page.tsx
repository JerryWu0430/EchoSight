"use client"
import { WaitlistWrapper } from "@/components/box";
import { useState, useEffect } from "react";
import { Play, RotateCcw, HelpCircle } from "lucide-react";
import { useAppContext } from "@/context";
import { useRouter } from "next/navigation";

const soundOptions = [
  { 
    value: "percussion/bell tree/bell-tree__025_forte_struck-singly",
    label: "Bell Tree",
    description: "Gentle notification sound"
  },
  { 
    value: "percussion/triangle/triangle__025_forte_struck-singly",
    label: "Triangle",
    description: "Clear, bright ping"
  },
  { 
    value: "percussion/wind chimes/wind-chimes__025_forte_struck-singly",
    label: "Wind Chimes",
    description: "Soft, ambient alert"
  },
  { 
    value: "percussion/woodblock/woodblock__025_forte_struck-singly",
    label: "Woodblock",
    description: "Sharp, distinct tap"
  },
  { 
    value: "percussion/sleigh bells/sleigh-bells__025_forte_shaken",
    label: "Sleigh Bells",
    description: "Cheerful alert sound"
  },
  { 
    value: "french horn/french-horn_A2_025_forte_normal",
    label: "French Horn",
    description: "Bold warning sound"
  },
  { 
    value: "percussion/tambourine/tambourine__025_forte_shaken",
    label: "Tambourine",
    description: "Rhythmic notification"
  },
  { 
    value: "percussion/train whistle/train-whistle__025_forte_blown",
    label: "Train Whistle",
    description: "Strong attention signal"
  },
  { 
    value: "violin/violin_A3_025_forte_arco-normal",
    label: "Violin",
    description: "Elegant alert tone"
  },
  { 
    value: "flute/flute_A4_025_forte_normal",
    label: "Flute",
    description: "Light, airy signal"
  },
  { 
    value: "clarinet/clarinet_A3_025_forte_normal",
    label: "Clarinet",
    description: "Smooth, warm tone"
  },
  { 
    value: "cello/cello_A2_025_forte_arco-normal",
    label: "Cello",
    description: "Rich, deep alert"
  },
  { 
    value: "percussion/vibraslap/vibraslap__025_forte_struck-singly",
    label: "Vibraslap",
    description: "Unique attention getter"
  },
  { 
    value: "tuba/tuba_A1_025_forte_normal",
    label: "Tuba",
    description: "Deep, powerful alert"
  },
  { 
    value: "percussion/Chinese cymbal/Chinese-cymbal__05_forte_damped",
    label: "Chinese Cymbal",
    description: "Dramatic notification"
  },
  { 
    value: "saxophone/saxophone_A3_025_forte_normal",
    label: "Saxophone",
    description: "Smooth jazz tone"
  },
  { 
    value: "oboe/oboe_A4_025_forte_normal",
    label: "Oboe",
    description: "Distinct reed tone"
  },
  { 
    value: "banjo/banjo_A3_very-long_forte_normal",
    label: "Banjo",
    description: "Bright string alert"
  },
  { 
    value: "trumpet/trumpet_A3_025_forte_normal",
    label: "Trumpet",
    description: "Bold brass signal"
  },
  { 
    value: "percussion/cowbell/cowbell__025_mezzo-forte_damped",
    label: "Cowbell",
    description: "Classic alert sound"
  }
];

export default function Home() {
  const { hasCompletedForm, formData, logChoices, resetForm } = useAppContext();
  const router = useRouter();
  const [volume, setVolume] = useState(75);
  const [frequency, setFrequency] = useState(50);
  const [objectSounds, setObjectSounds] = useState({
    slow: "percussion/bell tree/bell-tree__025_forte_struck-singly",
    fast: "french horn/french-horn_A2_025_forte_normal",
    static: "percussion/woodblock/woodblock__025_forte_struck-singly"
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

  const playPreview = async (soundValue: string) => {
    try {
      const audio = new Audio(`/audio/all-samples/${soundValue}.mp3`);
      audio.volume = volume / 100 * 0.3;
      await audio.play();
      
      audio.onended = () => {
        audio.remove();
      };
    } catch (error) {
      console.error('Error playing audio sample:', error);
    }
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
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-11">Volume Level</span>
                      <div className="relative group">
                        <HelpCircle className="w-4 h-4 text-slate-9 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-12 text-slate-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          Controls the loudness of audio feedback
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-12"></div>
                        </div>
                      </div>
                    </div>
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
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-slate-11">Frequency</span>
                      <div className="relative group">
                        <HelpCircle className="w-4 h-4 text-slate-9 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-12 text-slate-1 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                          How often audio feedback is provided
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-12"></div>
                        </div>
                      </div>
                    </div>
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
                      {3 - (formData?.noFeedbackFrom?.length || 0)}
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
          <WaitlistWrapper minHeight="auto">
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

              {/* Sound Library Section */}
              <div className="space-y-8">
                {/* Fixed Header */}
                <div>
                  <h2 className="text-2xl font-medium text-slate-12 text-center">Sound Library</h2>
                  <p className="text-slate-11 text-center mt-2">Available audio feedback options for your device.</p>
                </div>

                {/* Scrollable Sound Grid Container */}
                <div className="relative h-[380px] overflow-y-auto pr-2 rounded-lg custom-scrollbar">
                  {/* Sound Library Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors" 
                         onClick={() => new Audio('/audio/all-samples/percussion/bell tree/bell-tree__025_forte_struck-singly.mp3').play()}>
                      <div className="text-3xl mb-2">🔔</div>
                      <div className="text-sm font-medium text-slate-12">Bell Tree</div>
                      <div className="text-xs text-slate-10 mt-1">Soft notification</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/french horn/french-horn_A2_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">📯</div>
                      <div className="text-sm font-medium text-slate-12">French Horn</div>
                      <div className="text-xs text-slate-10 mt-1">Alert sound</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/violin/violin_A3_025_forte_arco-normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎻</div>
                      <div className="text-sm font-medium text-slate-12">Violin</div>
                      <div className="text-xs text-slate-10 mt-1">Melodic feedback</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/flute/flute_A4_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎵</div>
                      <div className="text-sm font-medium text-slate-12">Flute</div>
                      <div className="text-xs text-slate-10 mt-1">Organic feedback</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/train whistle/train-whistle__025_forte_blown.mp3').play()}>
                      <div className="text-3xl mb-2">🚂</div>
                      <div className="text-sm font-medium text-slate-12">Train Whistle</div>
                      <div className="text-xs text-slate-10 mt-1">Clear signal</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/woodblock/woodblock__025_forte_struck-singly.mp3').play()}>
                      <div className="text-3xl mb-2">🪵</div>
                      <div className="text-sm font-medium text-slate-12">Woodblock</div>
                      <div className="text-xs text-slate-10 mt-1">Quick feedback</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/clarinet/clarinet_A3_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎶</div>
                      <div className="text-sm font-medium text-slate-12">Clarinet</div>
                      <div className="text-xs text-slate-10 mt-1">Smooth tone</div>
                    </div>
                    
                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/cello/cello_A2_025_forte_arco-normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎻</div>
                      <div className="text-sm font-medium text-slate-12">Cello</div>
                      <div className="text-xs text-slate-10 mt-1">Musical harmony</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/wind chimes/wind-chimes__025_forte_struck-singly.mp3').play()}>
                      <div className="text-3xl mb-2">🎐</div>
                      <div className="text-sm font-medium text-slate-12">Wind Chimes</div>
                      <div className="text-xs text-slate-10 mt-1">Gentle alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/triangle/triangle__025_forte_struck-singly.mp3').play()}>
                      <div className="text-3xl mb-2">📐</div>
                      <div className="text-sm font-medium text-slate-12">Triangle</div>
                      <div className="text-xs text-slate-10 mt-1">Bright ping</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/banjo/banjo_A3_very-long_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🪕</div>
                      <div className="text-sm font-medium text-slate-12">Banjo</div>
                      <div className="text-xs text-slate-10 mt-1">Folk tone</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/trumpet/trumpet_A3_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎺</div>
                      <div className="text-sm font-medium text-slate-12">Trumpet</div>
                      <div className="text-xs text-slate-10 mt-1">Bold alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/sleigh bells/sleigh-bells__025_forte_shaken.mp3').play()}>
                      <div className="text-3xl mb-2">🛎️</div>
                      <div className="text-sm font-medium text-slate-12">Sleigh Bells</div>
                      <div className="text-xs text-slate-10 mt-1">Cheerful alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/oboe/oboe_A4_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎼</div>
                      <div className="text-sm font-medium text-slate-12">Oboe</div>
                      <div className="text-xs text-slate-10 mt-1">Distinct tone</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/tambourine/tambourine__025_forte_shaken.mp3').play()}>
                      <div className="text-3xl mb-2">🥁</div>
                      <div className="text-sm font-medium text-slate-12">Tambourine</div>
                      <div className="text-xs text-slate-10 mt-1">Rhythmic alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/mandolin/mandolin_A3_very-long_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎸</div>
                      <div className="text-sm font-medium text-slate-12">Mandolin</div>
                      <div className="text-xs text-slate-10 mt-1">String tone</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/vibraslap/vibraslap__025_forte_struck-singly.mp3').play()}>
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-sm font-medium text-slate-12">Vibraslap</div>
                      <div className="text-xs text-slate-10 mt-1">Unique alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/tuba/tuba_A1_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">📢</div>
                      <div className="text-sm font-medium text-slate-12">Tuba</div>
                      <div className="text-xs text-slate-10 mt-1">Deep tone</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/percussion/Chinese cymbal/Chinese-cymbal__05_forte_damped.mp3').play()}>
                      <div className="text-3xl mb-2">🎪</div>
                      <div className="text-sm font-medium text-slate-12">Chinese Cymbal</div>
                      <div className="text-xs text-slate-10 mt-1">Dramatic alert</div>
                    </div>

                    <div className="bg-gray-2 border border-gray-6 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-3 transition-colors"
                         onClick={() => new Audio('/audio/all-samples/saxophone/saxophone_A3_025_forte_normal.mp3').play()}>
                      <div className="text-3xl mb-2">🎷</div>
                      <div className="text-sm font-medium text-slate-12">Saxophone</div>
                      <div className="text-xs text-slate-10 mt-1">Jazz tone</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Settings Button */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    console.log("Saving settings:", { volume, frequency, objectSounds });
                    alert("Settings saved successfully!");
                  }}
                  className="w-full bg-slate-12 text-slate-1 py-3 px-6 rounded-lg font-medium hover:bg-slate-11 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-8"
                >
                  Sync Settings
                </button>
              </div>
            </div>
          </WaitlistWrapper>
        </div>

        {/* Right Side Container */}
        <div className="w-64 h-[500px] flex-shrink-0">
          <div className="bg-gray-1/85 rounded-2xl p-6 shadow-[0px_170px_48px_0px_rgba(18,_18,_19,_0.00),_0px_109px_44px_0px_rgba(18,_18,_19,_0.01),_0px_61px_37px_0px_rgba(18,_18,_19,_0.05),_0px_27px_27px_0px_rgba(18,_18,_19,_0.09),_0px_7px_15px_0px_rgba(18,_18,_19,_0.10)]">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-base font-semibold text-slate-12 mb-1">Object Categories</h3>
                <p className="text-slate-10 text-xs">Configure audio feedback for different object types</p>
              </div>
              
              <div className="space-y-3">
                {/* Slow Object */}
                <div className={`bg-gray-2 border border-gray-6 rounded-lg p-3 space-y-2 ${
                  formData?.noFeedbackFrom?.includes('slow') ? 'opacity-50 grayscale' : ''
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🚶</span>
                    <h4 className="font-medium text-slate-12 text-sm">Slow Object</h4>
                  </div>
                  
                  <p className="text-sm text-slate-10">Cars, bicycles, pedestrians walking slowly</p>
                  
                  <div className="relative">
                    <select
                      value={objectSounds.slow}
                      onChange={(e) => setObjectSounds({...objectSounds, slow: e.target.value})}
                      className="w-full px-2 py-1.5 bg-gray-1 border border-gray-6 rounded text-sm text-slate-12 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-8"
                      disabled={formData?.noFeedbackFrom?.includes('slow')}
                    >
                      {soundOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label} - {option.description}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => playPreview(objectSounds.slow)}
                    className="w-full flex items-center justify-center space-x-1 py-1.5 px-3 bg-gray-3 hover:bg-gray-4 rounded text-sm font-medium text-slate-12 transition-colors"
                    disabled={formData?.noFeedbackFrom?.includes('slow')}
                  >
                    <Play className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Fast Object */}
                <div className={`bg-gray-2 border border-gray-6 rounded-lg p-3 space-y-2 ${
                  formData?.noFeedbackFrom?.includes('fast') ? 'opacity-50 grayscale' : ''
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏃</span>
                    <h4 className="font-medium text-slate-12 text-sm">Fast Object</h4>
                  </div>
                  
                  <p className="text-sm text-slate-10">Running people, speeding vehicles, animals</p>
                  
                  <div className="relative">
                    <select
                      value={objectSounds.fast}
                      onChange={(e) => setObjectSounds({...objectSounds, fast: e.target.value})}
                      className="w-full px-2 py-1.5 bg-gray-1 border border-gray-6 rounded text-sm text-slate-12 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-8"
                      disabled={formData?.noFeedbackFrom?.includes('fast')}
                    >
                      {soundOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label} - {option.description}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => playPreview(objectSounds.fast)}
                    className="w-full flex items-center justify-center space-x-1 py-1.5 px-3 bg-gray-3 hover:bg-gray-4 rounded text-sm font-medium text-slate-12 transition-colors"
                    disabled={formData?.noFeedbackFrom?.includes('fast')}
                  >
                    <Play className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Static Object */}
                <div className={`bg-gray-2 border border-gray-6 rounded-lg p-3 space-y-2 ${
                  formData?.noFeedbackFrom?.includes('static') ? 'opacity-50 grayscale' : ''
                }`}>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🏠</span>
                    <h4 className="font-medium text-slate-12 text-sm">Static Object</h4>
                  </div>
                  
                  <p className="text-sm text-slate-10">Walls, furniture, parked cars, trees</p>
                  
                  <div className="relative">
                    <select
                      value={objectSounds.static}
                      onChange={(e) => setObjectSounds({...objectSounds, static: e.target.value})}
                      className="w-full px-2 py-1.5 bg-gray-1 border border-gray-6 rounded text-sm text-slate-12 appearance-none focus:outline-none focus:ring-2 focus:ring-slate-8"
                      disabled={formData?.noFeedbackFrom?.includes('static')}
                    >
                      {soundOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label} - {option.description}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => playPreview(objectSounds.static)}
                    className="w-full flex items-center justify-center space-x-1 py-1.5 px-3 bg-gray-3 hover:bg-gray-4 rounded text-sm font-medium text-slate-12 transition-colors"
                    disabled={formData?.noFeedbackFrom?.includes('static')}
                  >
                    <Play className="w-4 h-4" />
                    <span>Preview</span>
                  </button>
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
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
