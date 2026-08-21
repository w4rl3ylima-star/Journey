import { useCallback, useEffect, useRef, useState } from 'react'

interface UseSpeechRecognitionResult {
  isSupported: boolean
  isListening: boolean
  transcript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

function getRecognitionCtor(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

export function useSpeechRecognition(lang = 'pt-BR'): UseSpeechRecognitionResult {
  const Ctor = useRef(getRecognitionCtor()).current
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let combined = ''
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript
      }
      setTranscript(combined)
    }
    recognition.onerror = (event) => {
      setError(event.error)
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    return () => {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
    }
  }, [Ctor, lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setError(null)
    setTranscript('')
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // Ignore "already started" errors from rapid double taps.
    }
  }, [])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const reset = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return { isSupported: !!Ctor, isListening, transcript, error, start, stop, reset }
}
