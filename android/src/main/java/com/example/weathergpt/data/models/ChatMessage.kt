package com.example.weathergpt.data.models

data class ChatMessage(
    val id: String = System.currentTimeMillis().toString(),
    val text: String,
    val isUser: Boolean,
    val timestamp: String,
    val persona: String = "farmer",
    val language: String = "en"
)
