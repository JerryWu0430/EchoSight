"use client"
import React, { createContext, useContext, useState, useEffect } from 'react';

type FormData = {
  audioLevel: number; // 0: low, 1: medium, 2: high
  frequencyLevel: number; // 0: low, 1: medium, 2: high
  noFeedbackFrom: string[]; // Array of objects to ignore
  soundTracks: string[]; // Array of selected sound tracks
};

type AppContextType = {
  hasCompletedForm: boolean;
  formData: FormData | null;
  completeForm: (data: FormData) => void;
  resetForm: () => void;
  logChoices: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasCompletedForm, setHasCompletedForm] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('earEyeFormData');
    const savedCompletionStatus = localStorage.getItem('earEyeFormCompleted');
    
    if (savedFormData && savedCompletionStatus === 'true') {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        setHasCompletedForm(true);
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        // If there's an error parsing, reset everything
        localStorage.removeItem('earEyeFormData');
        localStorage.removeItem('earEyeFormCompleted');
      }
    }
  }, []);

  const completeForm = (data: FormData) => {
    setFormData(data);
    setHasCompletedForm(true);
    
    // Save to localStorage
    localStorage.setItem('earEyeFormData', JSON.stringify(data));
    localStorage.setItem('earEyeFormCompleted', 'true');
    
    // Log the choices
    logChoices(data);
  };

  const resetForm = () => {
    setFormData(null);
    setHasCompletedForm(false);
    
    // Clear localStorage
    localStorage.removeItem('earEyeFormData');
    localStorage.removeItem('earEyeFormCompleted');
  };

  const logChoices = (data?: FormData) => {
    const choicesToLog = data || formData;
    if (choicesToLog) {
      const audioLevels = ["Low", "Medium", "High"];
      console.log("=== EarEye Form Choices ===");
      console.log("Audio Level:", audioLevels[choicesToLog.audioLevel]);
      console.log("Frequency Level:", audioLevels[choicesToLog.frequencyLevel]);
      console.log("No Feedback From:", choicesToLog.noFeedbackFrom.length > 0 ? choicesToLog.noFeedbackFrom : "None selected");
      console.log("Selected Sound Tracks:", choicesToLog.soundTracks);
      console.log("Timestamp:", new Date().toISOString());
      console.log("==========================");
    }
  };

  const value: AppContextType = {
    hasCompletedForm,
    formData,
    completeForm,
    resetForm,
    logChoices,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
