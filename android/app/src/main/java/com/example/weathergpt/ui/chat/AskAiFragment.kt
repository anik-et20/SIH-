package com.example.weathergpt.ui.chat

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.ImageButton
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.weathergpt.R
import com.example.weathergpt.data.local.PreferencesManager
import com.example.weathergpt.data.models.ChatMessage
import com.example.weathergpt.data.remote.ApiClient
import com.example.weathergpt.utils.SpeechRecognizerHelper
import com.example.weathergpt.utils.TextToSpeechHelper
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class AskAiFragment : Fragment() {

    private lateinit var prefs: PreferencesManager
    private lateinit var apiClient: ApiClient
    private lateinit var speechHelper: SpeechRecognizerHelper
    private lateinit var ttsHelper: TextToSpeechHelper

    private lateinit var recyclerChat: RecyclerView
    private lateinit var chatAdapter: ChatAdapter
    private val messagesList = mutableListOf<ChatMessage>()

    private lateinit var etInput: EditText
    private lateinit var btnMic: ImageButton
    private lateinit var btnSend: ImageButton
    private lateinit var layoutListeningBanner: LinearLayout
    private lateinit var tvListeningStatus: TextView

    private lateinit var chipUmbrella: TextView
    private lateinit var chipIrrigate: TextView
    private lateinit var chipHotter: TextView
    private lateinit var chipTravel: TextView

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_ask_ai, container, false)
        prefs = PreferencesManager(requireContext())
        apiClient = ApiClient(prefs)
        speechHelper = SpeechRecognizerHelper(requireContext())
        ttsHelper = TextToSpeechHelper(requireContext())

        bindViews(view)
        setupRecyclerView()
        setupListeners()
        setupSpeechRecognizer()
        initWelcomeMessage()

        return view
    }

    private fun bindViews(view: View) {
        recyclerChat = view.findViewById(R.id.recyclerChat)
        etInput = view.findViewById(R.id.etChatInput)
        btnMic = view.findViewById(R.id.btnChatMic)
        btnSend = view.findViewById(R.id.btnChatSend)
        layoutListeningBanner = view.findViewById(R.id.layoutListeningBanner)
        tvListeningStatus = view.findViewById(R.id.tvListeningStatus)

        chipUmbrella = view.findViewById(R.id.chipUmbrella)
        chipIrrigate = view.findViewById(R.id.chipIrrigate)
        chipHotter = view.findViewById(R.id.chipHotter)
        chipTravel = view.findViewById(R.id.chipTravel)
    }

    private fun setupRecyclerView() {
        chatAdapter = ChatAdapter(messagesList) { message ->
            if (prefs.isVoiceTtsEnabled) {
                ttsHelper.speak(message.text, message.id, prefs.language)
            }
        }
        val layoutManager = LinearLayoutManager(requireContext())
        layoutManager.stackFromEnd = true
        recyclerChat.layoutManager = layoutManager
        recyclerChat.adapter = chatAdapter
    }

    private fun setupListeners() {
        btnSend.setOnClickListener {
            val query = etInput.text.toString().trim()
            if (query.isNotEmpty()) {
                sendMessage(query)
                etInput.text.clear()
            }
        }

        btnMic.setOnClickListener {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.RECORD_AUDIO)
                != PackageManager.PERMISSION_GRANTED
            ) {
                requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 101)
                return@setOnClickListener
            }

            if (!speechHelper.isListening) {
                speechHelper.startListening(prefs.language)
            } else {
                speechHelper.stopListening()
            }
        }

        chipUmbrella.setOnClickListener { sendMessage(chipUmbrella.text.toString()) }
        chipIrrigate.setOnClickListener { sendMessage(chipIrrigate.text.toString()) }
        chipHotter.setOnClickListener { sendMessage(chipHotter.text.toString()) }
        chipTravel.setOnClickListener { sendMessage(chipTravel.text.toString()) }
    }

    private fun setupSpeechRecognizer() {
        speechHelper.setCallback(object : SpeechRecognizerHelper.SpeechCallback {
            override fun onSpeechResult(result: String) {
                etInput.setText(result)
                sendMessage(result)
            }

            override fun onListeningStateChanged(isListening: Boolean) {
                if (isListening) {
                    btnMic.setBackgroundResource(R.drawable.bg_mic_recording)
                    layoutListeningBanner.visibility = View.VISIBLE
                } else {
                    btnMic.setBackgroundResource(R.drawable.bg_mic_idle)
                    layoutListeningBanner.visibility = View.GONE
                }
            }

            override fun onError(errorMsg: String) {
                Toast.makeText(requireContext(), errorMsg, Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun initWelcomeMessage() {
        if (messagesList.isEmpty()) {
            val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
            val welcomeText = when (prefs.persona.lowercase()) {
                "farmer" -> "🌾 Namaste! I am your AI Weather & Agricultural Advisor. Ask me anything about irrigation timing, crop weather protection, or rainfall forecasts."
                "commuter" -> "🚗 Hello! I am your Commute Weather Advisor. Ask me about rain timings, traffic hazards, or whether to bring an umbrella."
                "aviation" -> "✈️ Welcome! I am your Aviation Weather Analyst. Ask me about visibility, flight delay risks, or storm formations."
                else -> "🏃 Hello! I am your Outdoor Weather Planner. Ask me about heat index, UV safety, or running/hiking conditions."
            }
            chatAdapter.addMessage(ChatMessage(text = welcomeText, isUser = false, timestamp = timeStr))
        }
    }

    private fun sendMessage(query: String) {
        val timeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
        chatAdapter.addMessage(ChatMessage(text = query, isUser = true, timestamp = timeStr))
        recyclerChat.smoothScrollToPosition(messagesList.size - 1)

        viewLifecycleOwner.lifecycleScope.launch {
            val result = apiClient.sendChatQuery(
                query = query,
                location = prefs.locationName,
                lat = prefs.latitude,
                lon = prefs.longitude,
                persona = prefs.persona,
                language = prefs.language
            )

            result.onSuccess { responseText ->
                val responseTimeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                val aiMsg = ChatMessage(text = responseText, isUser = false, timestamp = responseTimeStr)
                chatAdapter.addMessage(aiMsg)
                recyclerChat.smoothScrollToPosition(messagesList.size - 1)

                if (prefs.isVoiceTtsEnabled) {
                    ttsHelper.speak(responseText, aiMsg.id, prefs.language)
                }
            }.onFailure { error ->
                val responseTimeStr = SimpleDateFormat("hh:mm a", Locale.getDefault()).format(Date())
                val errorMsg = ChatMessage(
                    text = "⚠️ Unable to connect to WeatherGPT: ${error.localizedMessage}",
                    isUser = false,
                    timestamp = responseTimeStr
                )
                chatAdapter.addMessage(errorMsg)
                recyclerChat.smoothScrollToPosition(messagesList.size - 1)
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        speechHelper.stopListening()
        ttsHelper.stop()
    }

    override fun onDestroy() {
        super.onDestroy()
        ttsHelper.shutdown()
    }
}
