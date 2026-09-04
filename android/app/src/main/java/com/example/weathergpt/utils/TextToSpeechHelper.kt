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

    fun speak(text: String, messageId: String, languageCode: String = "en") {
        if (!isInitialized || tts == null) return

        if (currentSpeakingId == messageId && tts?.isSpeaking == true) {
            stop()
            return
        }

        stop()

        val locale = when (languageCode.lowercase()) {
            "hi" -> Locale("hi", "IN")
            "ta" -> Locale("ta", "IN")
            "te" -> Locale("te", "IN")
            "bn" -> Locale("bn", "IN")
            "mr" -> Locale("mr", "IN")
            "gu" -> Locale("gu", "IN")
            else -> Locale.ENGLISH
        }

        try {
            tts?.language = locale
        } catch (e: Exception) {
            tts?.language = Locale.ENGLISH
        }

        val cleanText = text.replace(Regex("[*#_`~]"), "").trim()
        currentSpeakingId = messageId
        tts?.speak(cleanText, TextToSpeech.QUEUE_FLUSH, null, messageId)
    }

    fun stop() {
        if (tts?.isSpeaking == true) {
            tts?.stop()
        }
        currentSpeakingId = null
    }

    fun shutdown() {
        stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
