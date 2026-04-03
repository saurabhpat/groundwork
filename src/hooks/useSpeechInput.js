import { useRef, useState } from 'react';

export function useSpeechInput(onTranscript) {
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = 
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires Chrome or Edge.");
      return;
    }
    
    // Set listening state immediately for instant UI feedback
    setIsListening(true);

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let fullTranscript = '';
      for (let i = 0; i < e.results.length; i++) {
        fullTranscript += e.results[i][0].transcript;
      }
      onTranscript(fullTranscript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    
    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition start error:", err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    isListening ? stopListening() : startListening();
  };

  return { isListening, startListening, stopListening, toggleListening };
}
