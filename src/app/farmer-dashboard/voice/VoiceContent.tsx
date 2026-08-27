'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Globe, Sparkles, Send, Play, Pause,
  RotateCcw, Trash2, CheckCircle2, AlertCircle, RefreshCw, MessageSquare,
  HelpCircle, ChevronRight, ShieldCheck, Activity, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  messageType: 'voice' | 'text';
  language: string;
}

type AssistantState = 'ready' | 'listening' | 'processing' | 'speaking' | 'error';

interface PresetCommand {
  label: string;
  icon: string;
  query: string;
  hindiQuery: string;
  marathiQuery: string;
  category: 'mandi' | 'orders' | 'weather' | 'credit';
}

const presets: PresetCommand[] = [
  {
    label: 'Nashik Tomato Mandi Price',
    icon: '🍅',
    query: "What is today's Tomato APMC rate in Nashik?",
    hindiQuery: "आज नाशिक में टमाटर का मंडी भाव क्या है?",
    marathiQuery: "आज नाशिकमध्ये टोमॅटोचा बाजारभाव काय आहे?",
    category: 'mandi'
  },
  {
    label: 'Track My Orders',
    icon: '📦',
    query: 'Show me my latest orders and status.',
    hindiQuery: 'मेरे हालिया ऑर्डर्स और उनकी स्थिति दिखाएं।',
    marathiQuery: 'माझ्या नवीन ऑर्डर्स आणि स्थिती दाखवा.',
    category: 'orders'
  },
  {
    label: 'Weather & Rainfall Alert',
    icon: '🌦️',
    query: 'Will it rain in Nashik this week?',
    hindiQuery: 'क्या इस हफ्ते नाशिक में बारिश होगी?',
    marathiQuery: 'या आठवड्यात नाशिकमध्ये पाऊस पडेल का?',
    category: 'weather'
  },
  {
    label: 'Kisan Instant Credit Limit',
    icon: '💳',
    query: 'What is my current instant credit loan limit?',
    hindiQuery: 'मेरी तत्काल किसान लोन सीमा क्या है?',
    marathiQuery: 'माझी तात्काळ कर्ज मर्यादा काय आहे?',
    category: 'credit'
  }
];

export default function VoiceContent() {
  const [lang, setLang] = useState('hi');
  const [assistantState, setAssistantState] = useState<AssistantState>('ready');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number[]>([15, 25, 40, 60, 35, 20]);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isListeningRef = useRef(false);

  // Language mapping helper
  const getBrowserLangCode = useCallback((code: string) => {
    switch (code) {
      case 'hi': return 'hi-IN';
      case 'mr': return 'mr-IN';
      case 'te': return 'te-IN';
      case 'ta': return 'ta-IN';
      default: return 'en-IN';
    }
  }, []);

  // Auto-scroll chat feed to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, assistantState]);

  // Dynamic sound wave animation loop during listening/speaking
  useEffect(() => {
    let interval: any;
    if (assistantState === 'listening' || assistantState === 'speaking') {
      interval = setInterval(() => {
        setVolumeLevel([
          Math.floor(Math.random() * 65) + 15,
          Math.floor(Math.random() * 85) + 20,
          Math.floor(Math.random() * 95) + 30,
          Math.floor(Math.random() * 100) + 40,
          Math.floor(Math.random() * 80) + 25,
          Math.floor(Math.random() * 60) + 15,
        ]);
      }, 120);
    } else {
      setVolumeLevel([15, 25, 40, 60, 35, 20]);
    }
    return () => clearInterval(interval);
  }, [assistantState]);

  // Stop active speech synthesis audio immediately (Interruption support)
  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setCurrentlySpeakingId(null);
      if (assistantState === 'speaking') {
        setAssistantState('ready');
      }
    }
  }, [assistantState]);

  // Text-To-Speech conversion & playback
  const speakText = useCallback((text: string, currentLang: string, msgId?: string) => {
    if (typeof window === 'undefined') return;

    if (!window.speechSynthesis) {
      toast.error('Text-to-Speech is not supported in this browser.');
      return;
    }

    // Cancel any previous speech
    window.speechSynthesis.cancel();

    // Clean markdown or special characters before speaking
    const cleanText = text.replace(/[*_~`#₹]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = getBrowserLangCode(currentLang);
    utterance.rate = 0.95; // Slightly measured pace for clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setAssistantState('speaking');
      if (msgId) setCurrentlySpeakingId(msgId);
    };

    utterance.onend = () => {
      setAssistantState('ready');
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = (e) => {
      // Audio interruption via cancel() triggers error event - handle smoothly
      setAssistantState('ready');
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, [getBrowserLangCode]);

  // Send transcription or text to backend AI Assistant
  const sendToAssistant = async (queryText: string, messageType: 'voice' | 'text' = 'voice') => {
    if (!queryText.trim()) return;

    // Stop speech if already speaking
    stopAudio();

    const userMsgId = `msg-user-${Date.now()}`;
    const newMessages: ChatMessage[] = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        text: queryText,
        timestamp: Date.now(),
        messageType,
        language: lang,
      }
    ];

    setMessages(newMessages);
    setInterimTranscript('');
    setAssistantState('processing');

    try {
      const response = await apiFetch('/api/ai/voice-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: queryText,
          conversationId,
          language: lang,
          userId: 'farmer-001',
          messageType,
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiResponseText = data.aiResponse || 'I processed your request.';
      const aiMsgId = `msg-ai-${Date.now()}`;

      const finalMessages: ChatMessage[] = [
        ...newMessages,
        {
          id: aiMsgId,
          role: 'assistant',
          text: aiResponseText,
          timestamp: Date.now(),
          messageType: 'voice',
          language: lang,
        }
      ];

      setMessages(finalMessages);
      setAssistantState('speaking');

      // Convert AI response to natural speech
      speakText(aiResponseText, lang, aiMsgId);
    } catch (err: any) {
      console.error('AI Voice Assistant error:', err);
      setAssistantState('error');
      toast.error('Failed to communicate with AI Assistant. Please retry.');
      
      const fallbackAiMsg: ChatMessage = {
        id: `msg-ai-err-${Date.now()}`,
        role: 'assistant',
        text: lang === 'hi' 
          ? 'माफ़ कीजिए, नेटवर्क में समस्या आई है। कृपया दोबारा बोलें।' 
          : 'I encountered a connection issue. Please tap the microphone and try again.',
        timestamp: Date.now(),
        messageType: 'voice',
        language: lang,
      };
      setMessages([...newMessages, fallbackAiMsg]);
    }
  };

  // Start Speech-to-Text listening
  const startListening = async () => {
    if (typeof window === 'undefined') return;

    // If assistant is speaking, interruption: stop audio immediately
    stopAudio();

    // Check for Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('Web Speech API is not supported in this browser. You can type queries below.');
      return;
    }

    try {
      // Request mic permission explicitly if needed
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionDenied(false);
      }
    } catch (err) {
      console.warn('Microphone permission request error:', err);
      setMicPermissionDenied(true);
      setAssistantState('error');
      toast.error('Microphone permission denied. Please allow microphone access in your browser settings.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = getBrowserLangCode(lang);
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setAssistantState('listening');
        setInterimTranscript('');
      };

      recognition.onresult = (event: any) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPiece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPiece;
          } else {
            currentInterim += transcriptPiece;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript.trim()) {
          setInterimTranscript(finalTranscript);
          recognition.stop();
          isListeningRef.current = false;
          sendToAssistant(finalTranscript.trim(), 'voice');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech Recognition error event:', event.error);
        isListeningRef.current = false;

        if (event.error === 'not-allowed') {
          setMicPermissionDenied(true);
          setAssistantState('error');
          toast.error('Microphone access was blocked. Please enable it in browser permissions.');
        } else if (event.error === 'no-speech') {
          setAssistantState('ready');
          toast.info('No speech detected. Please tap mic and speak clearly.');
        } else if (event.error === 'network') {
          setAssistantState('error');
          toast.error('Speech recognition network error. Please check your connection.');
        } else {
          setAssistantState('ready');
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        if (assistantState === 'listening') {
          setAssistantState('ready');
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setAssistantState('error');
      toast.error('Could not initialize microphone. Please check permissions.');
    }
  };

  // Stop listening manually
  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setAssistantState('ready');
    }
  };

  // Handle preset quick-action clicks
  const handlePresetClick = (preset: PresetCommand) => {
    let query = preset.query;
    if (lang === 'hi') query = preset.hindiQuery;
    else if (lang === 'mr') query = preset.marathiQuery;

    sendToAssistant(query, 'text');
  };

  // Handle Text Chat submit
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const query = textInput.trim();
    setTextInput('');
    sendToAssistant(query, 'text');
  };

  // Reset conversation
  const handleClearConversation = async () => {
    stopAudio();
    stopListening();
    const newId = `conv-${Date.now()}`;
    setConversationId(newId);
    setMessages([]);
    setAssistantState('ready');
    setInterimTranscript('');
    toast.success('Conversation history cleared.');
  };

  return (
    <div className="px-3 sm:px-6 xl:px-8 py-4 sm:py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Kisan AI Voice Assistant
            </h1>
            <span
              className="text-2xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ backgroundColor: 'var(--success-bg)', color: 'var(--primary)' }}
            >
              <Sparkles className="w-3 h-3" /> Live Realtime
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-0.5 text-muted-foreground">
            Check mandi rates, manage orders, get weather advisories & credit limits hands-free in your native language.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {/* Language Selector */}
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold shadow-xs"
            style={{ borderColor: 'var(--border)' }}
          >
            <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <select
              value={lang}
              onChange={(e) => {
                stopAudio();
                setLang(e.target.value);
              }}
              className="bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer pr-1"
              style={{ color: 'var(--foreground)' }}
            >
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English (India)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>

          {/* Reset / New Chat */}
          {messages.length > 0 && (
            <button
              onClick={handleClearConversation}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border bg-card text-xs font-semibold hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
              style={{ borderColor: 'var(--border)' }}
              title="Start New Conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Denied Alert Banner */}
      {micPermissionDenied && (
        <div
          className="mb-5 p-4 rounded-2xl border flex items-start gap-3 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm text-red-900 dark:text-red-200">
            <p className="font-bold">Microphone Permission Required</p>
            <p className="mt-0.5 text-xs">
              To speak with your Kisan Assistant, please allow microphone access in your browser or device settings. You can also type your questions in the chat box below.
            </p>
          </div>
          <button
            onClick={() => setMicPermissionDenied(false)}
            className="text-xs font-bold underline text-red-700 hover:text-red-900"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Interactive Voice Console (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Main Voice Interactive Card */}
          <div
            className="card p-6 flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[380px]"
            style={{
              background: 'linear-gradient(180deg, var(--card) 0%, var(--secondary) 100%)',
            }}
          >
            {/* Assistant Status Badge */}
            <div className="w-full flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                  assistantState === 'listening'
                    ? 'bg-red-500/10 text-red-600 animate-pulse'
                    : assistantState === 'speaking'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : assistantState === 'processing'
                    ? 'bg-amber-500/10 text-amber-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    assistantState === 'listening'
                      ? 'bg-red-500 animate-ping'
                      : assistantState === 'speaking'
                      ? 'bg-emerald-500 animate-pulse'
                      : assistantState === 'processing'
                      ? 'bg-amber-500 animate-spin'
                      : 'bg-primary'
                  }`}
                />
                {assistantState === 'listening' && 'Listening... Speak now'}
                {assistantState === 'processing' && 'AI is thinking...'}
                {assistantState === 'speaking' && 'Assistant is speaking...'}
                {assistantState === 'ready' && 'Ready — Tap Mic to Speak'}
                {assistantState === 'error' && 'Tap Mic to Retry'}
              </span>

              {/* Stop audio button if speaking */}
              {assistantState === 'speaking' && (
                <button
                  onClick={stopAudio}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-950/40 text-red-600 hover:bg-red-200 transition-colors"
                >
                  <VolumeX className="w-3.5 h-3.5" /> Stop Speech
                </button>
              )}
            </div>

            {/* Central Animated Mic Sphere */}
            <div className="my-6 relative flex flex-col items-center">
              {/* Pulsing radar ripples when listening */}
              {assistantState === 'listening' && (
                <>
                  <span className="absolute -inset-4 rounded-full bg-red-500/20 scale-150 animate-ping pointer-events-none" />
                  <span className="absolute -inset-8 rounded-full bg-red-500/10 scale-125 animate-pulse pointer-events-none" />
                </>
              )}

              {/* Pulsing ring when speaking */}
              {assistantState === 'speaking' && (
                <span className="absolute -inset-3 rounded-full bg-primary/20 scale-125 animate-pulse pointer-events-none" />
              )}

              <button
                onClick={() => {
                  if (assistantState === 'listening') {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl relative z-10 active:scale-95 ${
                  assistantState === 'listening'
                    ? 'bg-red-600 text-white shadow-red-500/40 scale-105'
                    : assistantState === 'speaking'
                    ? 'bg-primary text-primary-foreground shadow-primary/30'
                    : assistantState === 'processing'
                    ? 'bg-amber-500 text-white shadow-amber-500/30'
                    : 'bg-primary text-primary-foreground hover:scale-105 shadow-primary/30'
                }`}
                style={{
                  boxShadow: assistantState === 'listening' 
                    ? '0 0 35px rgba(239, 68, 68, 0.5)'
                    : '0 8px 30px rgba(26, 107, 58, 0.35)',
                }}
                aria-label={assistantState === 'listening' ? 'Stop Listening' : 'Start Voice Input'}
              >
                {assistantState === 'listening' ? (
                  <MicOff className="w-12 h-12 animate-pulse" />
                ) : assistantState === 'processing' ? (
                  <RefreshCw className="w-12 h-12 animate-spin" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>
            </div>

            {/* Dynamic Sound Waveform Equalizer Bars */}
            <div className="w-full flex items-center justify-center gap-1.5 h-12 mb-3">
              {volumeLevel.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 rounded-full transition-all duration-100 ease-out"
                  style={{
                    height: `${height}%`,
                    backgroundColor: assistantState === 'listening' 
                      ? '#ef4444' 
                      : assistantState === 'speaking' 
                      ? 'var(--primary)' 
                      : 'var(--border)',
                  }}
                />
              ))}
            </div>

            {/* Guidance / Interim Live Transcript Box */}
            <div className="w-full max-w-sm">
              {interimTranscript ? (
                <div className="p-2.5 rounded-xl bg-card border text-xs font-medium text-foreground shadow-xs animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-2xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Transcribing...</p>
                  <p className="italic font-semibold">"{interimTranscript}"</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground font-medium">
                  {assistantState === 'listening'
                    ? 'Listening... Speak naturally in your selected language.'
                    : assistantState === 'processing'
                    ? 'Analyzing market data & generating voice response...'
                    : assistantState === 'speaking'
                    ? 'Speaking response. Tap mic anytime to interrupt and ask a new question.'
                    : 'Tap the microphone to ask about mandi rates, orders, weather, or credit.'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Kisan Prompts Card */}
          <div className="card p-4">
            <p className="text-xs font-bold text-foreground mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Suggested Kisan Voice Commands</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {presets.map((preset, idx) => {
                const label = lang === 'hi' ? preset.hindiQuery : lang === 'mr' ? preset.marathiQuery : preset.query;
                return (
                  <button
                    key={idx}
                    onClick={() => handlePresetClick(preset)}
                    className="w-full text-left p-2.5 rounded-xl border bg-card hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 group shadow-2xs"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="text-base flex-shrink-0">{preset.icon}</span>
                      <div className="min-w-0">
                        <p className="text-2xs font-bold text-primary truncate">{preset.label}</p>
                        <p className="text-xs font-medium text-foreground truncate mt-0.5">"{label}"</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Turn Conversation Thread (7 cols) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div
            className="card p-4 sm:p-5 flex-1 flex flex-col justify-between shadow-sm min-h-[500px]"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Feed Header */}
            <div className="flex items-center justify-between pb-3 border-b mb-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  Voice & Text Conversation Stream
                </span>
              </div>
              <span className="text-2xs font-bold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground tabular-nums">
                {messages.length} messages
              </span>
            </div>

            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[480px]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground my-auto">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <Mic className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground">No voice conversation yet</p>
                  <p className="text-xs mt-1 max-w-xs text-muted-foreground">
                    Tap the microphone on the left or type your query below to start a live conversation with your Kisan AI Assistant.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  const isCurrentlySpeaking = currentlySpeakingId === msg.id;

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-2xs font-semibold text-muted-foreground">
                          {isUser ? 'You' : 'Kisan AI Assistant'}
                        </span>
                        <span className="text-2xs text-muted-foreground opacity-60">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {msg.messageType === 'voice' && (
                          <span className="text-2xs px-1 rounded bg-secondary text-muted-foreground flex items-center gap-0.5">
                            <Mic className="w-2.5 h-2.5 text-primary" /> Voice
                          </span>
                        )}
                      </div>

                      <div
                        className={`p-3.5 sm:p-4 rounded-2xl max-w-[90%] sm:max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-xs ${
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-tr-xs'
                            : 'bg-secondary/70 border border-border text-foreground rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>

                        {/* Read Aloud Audio Trigger on Assistant messages */}
                        {!isUser && (
                          <div className="mt-2.5 pt-2 border-t flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
                            <button
                              onClick={() => {
                                if (isCurrentlySpeaking) {
                                  stopAudio();
                                } else {
                                  speakText(msg.text, msg.language, msg.id);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-2xs font-bold transition-all ${
                                isCurrentlySpeaking
                                  ? 'bg-red-500/10 text-red-600 animate-pulse'
                                  : 'bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border'
                              }`}
                            >
                              {isCurrentlySpeaking ? (
                                <>
                                  <Pause className="w-3 h-3 text-red-600 fill-current" /> Stop Audio
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3 h-3 text-primary" /> Read Aloud
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {/* Processing indicator in chat */}
              {assistantState === 'processing' && (
                <div className="flex flex-col items-start animate-fade-in">
                  <span className="text-2xs font-semibold text-muted-foreground mb-1 px-1">Kisan AI Assistant</span>
                  <div className="p-3 rounded-2xl bg-secondary/70 border border-border flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Thinking & fetching live farm data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Text Chat Input Bar */}
            <div className="pt-3 border-t mt-3" style={{ borderColor: 'var(--border)' }}>
              <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    lang === 'hi' ? 'सवाल यहाँ टाइप करें या ऊपर माइक दबाएं...' :
                    lang === 'mr' ? 'प्रश्न येथे टाइप करा किंवा माइक दाबा...' :
                    lang === 'te' ? 'ఇక్కడ టైప్ చేయండి లేదా మైక్ నొక్కండి...' :
                    lang === 'ta' ? 'இங்கே தட்டச்சு செய்க அல்லது மைக்கை அழுத்தவும்...' :
                    'Type your question here or tap the mic to speak...'
                  }
                  className="form-input flex-1 py-2.5 px-3.5 rounded-xl text-xs sm:text-sm bg-card border"
                  style={{ borderColor: 'var(--border)' }}
                />

                <button
                  type="submit"
                  disabled={!textInput.trim()}
                  className="p-2.5 sm:px-4 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1 text-xs font-bold shadow-xs active:scale-95 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
