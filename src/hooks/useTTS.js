import { useCallback, useState, useEffect } from 'react';

/**
 * Hook to handle Text-to-Speech using the browser's native Web Speech API.
 * Uses a professional sounding voice from the available system list.
 */
export function useTTS() {
  const [voices, setVoices] = useState([]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
  }, []);

  const speak = useCallback((text) => {
    if (isMuted || !text) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find a high-quality "Sam" or "Google" voice for professionalism
    const preferredVoice = voices.find(v => 
      v.name.includes('Google') && v.lang.startsWith('en') || 
      v.name.includes('Sam') || 
      v.name.includes('Daniel')
    ) || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.95; // Slightly slower for deliberate professional tone
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, [voices, isMuted]);

  const toggleMute = () => {
    if (!isMuted) window.speechSynthesis.cancel();
    setIsMuted(!isMuted);
  };

  return { speak, isMuted, toggleMute };
}
