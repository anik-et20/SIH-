import { useState, useEffect, useRef, useCallback } from 'react';

export function useVoice(onResult, lang = 'hi-IN') {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = lang || 'hi-IN';

      rec.onresult = (event) => {
        if (event.results && event.results[0] && event.results[0][0]) {
          const transcript = event.results[0][0].transcript;
          if (onResult) {
            onResult(transcript);
          }
        }
        setIsListening(false);
      };

      rec.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } catch (e) {
      console.error("Failed to initialize Speech Recognition:", e);
      setSupported(false);
    }
  }, [onResult]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        setError(null);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Speech start error:", e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error("Speech stop error:", e);
      } finally {
        setIsListening(false);
      }
    }
  }, [isListening]);

  return { isListening, startListening, stopListening, supported, error };
}
