import { useRef, useState, useCallback } from 'react';
import { transcribeAudio } from '../utils/aiClient';

/**
 * useWhisperInput – Pure MediaRecorder → Groq Whisper pipeline.
 *
 * No Web Speech API. No live interim text. No repeated partial words.
 *
 * Flow:
 *   1. User clicks mic  → MediaRecorder starts, UI shows recording indicator
 *   2. User clicks stop → blob assembled, sent to Groq Whisper
 *   3. Whisper returns  → accurate final text delivered via onTranscript()
 *
 * States:
 *   isRecording    – mic is active and capturing
 *   isTranscribing – waiting for Whisper response
 *   isBusy         – either of the above (disables Send / re-start)
 *   error          – any error string
 */
export function useWhisperInput(onTranscript) {
  const mediaRecorderRef = useRef(null);
  const audioChunksRef   = useRef([]);
  const streamRef        = useRef(null);
  const mimeTypeRef      = useRef('');

  const [isRecording,    setIsRecording]    = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error,          setError]          = useState(null);

  const startRecording = useCallback(async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current      = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';
      mimeTypeRef.current = mimeType;

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // Release the OS microphone indicator
        streamRef.current?.getTracks().forEach(t => t.stop());

        const blob = new Blob(audioChunksRef.current, {
          type: mimeTypeRef.current || 'audio/webm',
        });

        // Skip accidental taps / silence
        if (blob.size < 800) {
          setIsTranscribing(false);
          return;
        }

        setIsTranscribing(true);
        try {
          const text = await transcribeAudio(blob);
          if (text?.trim()) onTranscript(text.trim());
        } catch (err) {
          setError(err.message || 'Transcription failed. Please try again.');
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone permission denied. Please allow mic access and try again.');
      } else {
        setError(`Could not start recording: ${err.message}`);
      }
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    // isTranscribing is toggled inside onstop
  }, []);

  const toggle = useCallback(() => {
    isRecording ? stopRecording() : startRecording();
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    isBusy: isRecording || isTranscribing,
    error,
    setError,
    startRecording,
    stopRecording,
    toggle,
  };
}
