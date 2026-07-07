import { useCallback, useState, useEffect } from 'react';

/**
 * useTTS — Text-to-Speech hook powered by Web Speech API.
 *
 * Exposes:
 *   speak(text, voice)  — triggers speech synthesis
 *   stopSpeaking()      — cancels current playback immediately
 *   isSpeaking          — true while audio is playing
 *   isMuted / toggleMute
 */
// Keep a global reference to prevent garbage collection of utterances
const activeUtterances = new Set();

/**
 * useTTS — Text-to-Speech hook powered by Web Speech API.
 *
 * Exposes:
 *   speak(text, voice)  — triggers speech synthesis
 *   stopSpeaking()      — cancels current playback immediately
 *   isSpeaking          — true while audio is playing
 *   isMuted / toggleMute
 */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Pre-load voices on mount
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    activeUtterances.clear();
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text, voice = 'onyx', onEnd = null) => {
    if (isMuted || !text?.trim()) {
      onEnd?.();
      return;
    }

    // Cancel any in-progress playback before starting new
    stopSpeaking();

    if (!window.speechSynthesis) {
      console.warn('Web Speech API not supported in this browser.');
      onEnd?.();
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      activeUtterances.add(utterance);
      
      const voices = window.speechSynthesis.getVoices();
      
      const isFemale = voice === 'nova' || voice === 'shimmer';
      let preferredVoice;

      if (isFemale) {
        preferredVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          return (
            name.includes('samantha') || 
            name.includes('zira') || 
            name.includes('hazel') || 
            name.includes('jenny') || 
            name.includes('aria') || 
            name.includes('sally') || 
            name.includes('victoria') || 
            name.includes('karen') ||
            name.includes('google us english') ||
            (name.includes('female') && v.lang.startsWith('en'))
          );
        });
      } else {
        preferredVoice = voices.find(v => {
          const name = v.name.toLowerCase();
          return (
            name.includes('david') || 
            name.includes('guy') || 
            name.includes('alex') || 
            name.includes('daniel') || 
            name.includes('mark') || 
            (name.includes('male') && v.lang.startsWith('en'))
          );
        });
      }

      // Fallback if specific gendered voice isn't found
      if (!preferredVoice) {
        preferredVoice = voices.find(v => v.name.toLowerCase().includes('google') || v.lang.startsWith('en'));
      }

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        activeUtterances.delete(utterance);
        setIsSpeaking(false);
        onEnd?.();
      };
      utterance.onerror = (e) => {
        activeUtterances.delete(utterance);
        console.warn('TTS synthesis failed:', e.error);
        setIsSpeaking(false);
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('TTS synthesis failed:', err.message);
      setIsSpeaking(false);
      onEnd?.(); 
    }
  }, [isMuted, stopSpeaking]);

  const toggleMute = useCallback(() => {
    if (!isMuted) stopSpeaking();
    setIsMuted(m => !m);
  }, [isMuted, stopSpeaking]);

  return { speak, stopSpeaking, isSpeaking, isMuted, toggleMute };
}
