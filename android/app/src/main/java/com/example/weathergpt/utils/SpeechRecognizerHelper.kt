package com.example.weathergpt.utils

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

class SpeechRecognizerHelper(private val context: Context) {

    private var speechRecognizer: SpeechRecognizer? = null
    var isListening: Boolean = false
        private set

    interface SpeechCallback {
        fun onSpeechResult(result: String)
        fun onListeningStateChanged(isListening: Boolean)
        fun onError(errorMsg: String)
    }

    private var callback: SpeechCallback? = null

    fun setCallback(callback: SpeechCallback) {
        this.callback = callback
    }

    fun startListening(languageCode: String = "en") {
        if (!SpeechRecognizer.isRecognitionAvailable(context)) {
            callback?.onError("Speech recognition not available on this device")
            return
        }

        stopListening()

        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) {
                    isListening = true
                    callback?.onListeningStateChanged(true)
                }

                override fun onBeginningOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}

                override fun onEndOfSpeech() {
                    isListening = false
                    callback?.onListeningStateChanged(false)
                }

                override fun onError(error: Int) {
                    isListening = false
                    callback?.onListeningStateChanged(false)
                    val msg = when (error) {
                        SpeechRecognizer.ERROR_NO_MATCH -> "No speech recognized"
                        SpeechRecognizer.ERROR_NETWORK -> "Network error during speech recognition"
                        SpeechRecognizer.ERROR_AUDIO -> "Audio recording error"
                        else -> "Speech recognition error"
                    }
                    callback?.onError(msg)
                }

                override fun onResults(results: Bundle?) {
                    isListening = false
                    callback?.onListeningStateChanged(false)
                    val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                    if (!matches.isNullOrEmpty()) {
                        callback?.onSpeechResult(matches[0])
                    }
                }

                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
        }

        val speechLang = when (languageCode.lowercase()) {
            "hi" -> "hi-IN"
            "ta" -> "ta-IN"
            "te" -> "te-IN"
            "bn" -> "bn-IN"
            "mr" -> "mr-IN"
            "gu" -> "gu-IN"
            else -> "en-US"
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, speechLang)
            putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to WeatherGPT...")
        }

        speechRecognizer?.startListening(intent)
    }

    fun stopListening() {
        if (isListening) {
            speechRecognizer?.stopListening()
            isListening = false
            callback?.onListeningStateChanged(false)
        }
        speechRecognizer?.destroy()
        speechRecognizer = null
    }
}
