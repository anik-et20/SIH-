package com.example.weathergpt.utils

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.util.Base64
import java.io.File
import java.io.FileOutputStream

/**
 * Plays audio_base64 WAV responses returned by the Sarvam AI TTS backend endpoint.
 * Falls back gracefully when audio data is null or empty.
 */
object SarvamAudioPlayer {

    private var mediaPlayer: MediaPlayer? = null

    /**
     * Decode and play a base64-encoded WAV string.
     * Writes to a temp file in [context.cacheDir] so MediaPlayer can seek.
     * Returns true if playback was started, false otherwise.
     */
    fun play(context: Context, audioBase64: String?): Boolean {
        if (audioBase64.isNullOrBlank()) return false

        stop()  // stop any previous clip

        return try {
            val bytes = Base64.decode(audioBase64, Base64.DEFAULT)
            if (bytes.isEmpty()) return false

            val tempFile = File(context.cacheDir, "sarvam_tts_${System.currentTimeMillis()}.wav")
            FileOutputStream(tempFile).use { it.write(bytes) }

            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .build()
                )
                setDataSource(tempFile.absolutePath)
                prepare()
                setOnCompletionListener {
                    it.release()
                    tempFile.delete()
                    mediaPlayer = null
                }
                start()
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun stop() {
        try { mediaPlayer?.stop() } catch (_: Exception) {}
        try { mediaPlayer?.release() } catch (_: Exception) {}
        mediaPlayer = null
    }

    val isPlaying: Boolean get() = mediaPlayer?.isPlaying == true
}
