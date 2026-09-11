import React, { useState, useRef, useEffect } from 'react';
import { useVoice } from './useVoice';

const AskAiTab = ({
  messages,
  input,
  setInput,
  isLoading,
  onSendMessage,
  location,
  language,
  autoSpeech,
  onPlayAudio
}) => {
  const { isListening, transcript, startListening, stopListening } = useVoice({
    language: language === 'hi' ? 'hi-IN' : 'en-US'
  });

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript, setInput]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    { label: '🌧️ Will it rain today?', query: `Will it rain today in ${location}?` },
    { label: '🌾 Should I irrigate crops?', query: `Should I irrigate crops today in ${location}?` },
    { label: '🌊 Flood & Disaster Risk?', query: `What is the flood and disaster risk in ${location}?` },
    { label: '⚡ Thunderstorm watch?', query: `Is there any severe thunderstorm warning for ${location}?` }
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[750px]">
      {/* Title Header */}
      <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-3.5 mb-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center text-xl shadow-xs">
            🧠
          </div>
          <div>
            <h3 className="font-black text-sm text-amber-950">Your AI Weather Assistant</h3>
            <p className="text-[11px] text-amber-800/70">Instant agricultural & disaster intelligence</p>
          </div>
        </div>
        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-xs font-bold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Online
        </span>
      </div>

      {/* Quick Prompts horizontal scroll */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider whitespace-nowrap">
          QUICK PROMPTS:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(p.query)}
            className="px-3 py-1 bg-white hover:bg-amber-100/80 border border-amber-200/80 rounded-xl text-xs font-bold text-amber-950 whitespace-nowrap shadow-xs transition"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
        {/* Assistant Initial Greeting */}
        <div className="bg-white/90 border border-amber-200/60 rounded-2xl p-3.5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
            <span className="flex items-center gap-1.5">
              <span>☀️</span> WeatherGPT <span className="px-1.5 py-0.5 bg-amber-100 text-amber-950 rounded text-[10px]">AI Agtech</span>
            </span>
            <span className="text-[10px] text-amber-800/60">01:51 am</span>
          </div>
          <p className="text-xs text-amber-950 leading-relaxed font-medium">
            🌾 <strong>Namaste!</strong> I am your AI Weather & Agricultural Advisor. Ask me anything about irrigation timing, crop weather protection, or rainfall forecasts for <strong>{location}</strong>.
          </p>
        </div>

        {/* Dynamic Chat Messages */}
        {messages.map((m, idx) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
            >
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-xs shadow-sm ${
                  isUser
                    ? 'bg-amber-900 text-white rounded-br-xs font-medium'
                    : 'bg-white/95 border border-amber-200/70 text-amber-950 rounded-bl-xs leading-relaxed space-y-2'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 pb-1 border-b border-amber-100">
                    <span className="flex items-center gap-1">
                      <span>🛡️</span> WeatherGPT Advisor
                    </span>
                    {m.audioBase64 && (
                      <button
                        onClick={() => onPlayAudio?.(m.audioBase64, m.id)}
                        className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded font-bold transition text-[10px] flex items-center gap-1"
                      >
                        🔊 Listen
                      </button>
                    )}
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
              <span className="text-[10px] text-amber-800/60 font-medium px-1">
                {m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div className="bg-white/90 border border-amber-200/60 p-3 rounded-2xl max-w-[70%] flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-amber-900 font-bold">Analyzing meteorological data...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white/95 border border-amber-200/80 rounded-2xl p-2 shadow-md space-y-1.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSendMessage(input);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about crops, rain, spraying..."
            className="flex-1 bg-amber-50/60 border border-amber-200/70 rounded-xl px-3.5 py-2.5 text-xs text-amber-950 font-medium focus:outline-none focus:border-amber-400 placeholder:text-amber-800/50"
          />

          {/* Mic Button */}
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`p-2.5 rounded-xl border transition text-sm ${
              isListening
                ? 'bg-red-600 text-white border-red-700 animate-pulse'
                : 'bg-amber-100/70 text-amber-950 border-amber-300 hover:bg-amber-200/70'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            🎤
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-amber-900 hover:bg-amber-950 text-white p-2.5 rounded-xl font-bold transition disabled:opacity-50 text-sm shadow-sm"
          >
            ➢
          </button>
        </form>

        <div className="text-[10px] text-amber-800/70 font-medium text-center">
          🇮🇳 हिंदी या English में बोलें • Tap Mic to talk (Sarvam AI Integrated)
        </div>
      </div>
    </div>
  );
};

export default AskAiTab;
