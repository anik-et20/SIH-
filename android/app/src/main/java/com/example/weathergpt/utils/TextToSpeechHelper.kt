package com.example.weathergpt.utils

import android.content.Context
import android.speech.tts.TextToSpeech
import java.util.*

class TextToSpeechHelper(context: Context) : TextToSpeech.OnInitListener {

    private var tts: TextToSpeech? = TextToSpeech(context, this)
    private var isInitialized = false
    private var currentSpeakingId: String? = null

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            tts?.language = Locale.ENGLISH
        }
    }

    /** Maps 2-letter Sarvam/ISO code to Java Locale for Android TTS. */
    private fun toLocale(languageCode: String): Locale = when (languageCode.lowercase().take(2)) {
        "hi" -> Locale("hi", "IN")
        "ta" -> Locale("ta", "IN")
        "te" -> Locale("te", "IN")
        "bn" -> Locale("bn", "IN")
        "mr" -> Locale("mr", "IN")
        "gu" -> Locale("gu", "IN")
        "kn" -> Locale("kn", "IN")
        "ml" -> Locale("ml", "IN")
        "or" -> Locale("or", "IN")
        "pa" -> Locale("pa", "IN")
        else -> Locale.ENGLISH
    }

    fun speak(text: String, messageId: String, languageCode: String = "en") {
        if (!isInitialized || tts == null) return

        // Tapping the same message again stops playback
        if (currentSpeakingId == messageId && tts?.isSpeaking == true) {
            stop(); return
        }
        stop()

        try {
            val locale = toLocale(languageCode)
            val result = tts?.setLanguage(locale)
            // Fall back to English if locale is missing/not supported
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                tts?.setLanguage(Locale.ENGLISH)
            }
        } catch (e: Exception) {
            tts?.setLanguage(Locale.ENGLISH)
        }

        val cleanText = text.replace(Regex("[*#_`~]"), "").trim()
        currentSpeakingId = messageId
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, messageId)
    }

    fun stop() {
        if (tts?.isSpeaking == true) tts?.stop()
        currentSpeakingId = null
    }

    fun shutdown() {
        stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
