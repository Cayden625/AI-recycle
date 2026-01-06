
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, Blob, GenerateContentResponse, LiveServerMessage } from '@google/genai';
import { Mic, MicOff, ChevronLeft, Volume2, Trash2, Send, Loader2, MessageSquare } from 'lucide-react';

interface AssistantChatProps {
  onBack: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AssistantChat: React.FC<AssistantChatProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const chatRef = useRef<any>(null);

  // Auto-scroll transcription/messages
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription, messages]);

  // Initialize Text Chat
  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    chatRef.current = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: 'You are a helpful, eco-conscious recycling expert. Answer any questions about recycling, environmental impacts, and waste management with positivity and clarity.',
      },
    });
  }, []);

  const handleSendTextMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMsg = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const result = await chatRef.current.sendMessageStream({ message: userMsg });
      let fullText = '';
      
      // Initialize model message
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        fullText += c.text;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'model', text: fullText };
          return newMsgs;
        });
      }
    } catch (error) {
      console.error("Text chat error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Helper functions for base64 encoding/decoding as required by guidelines
  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startVoiceSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          // Fixed: Added LiveServerMessage type for proper message handling in the Live API session.
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              const outCtx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsSpeaking(false);
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            const text = message.serverContent?.outputTranscription?.text || message.serverContent?.inputTranscription?.text;
            if (text) {
               setTranscription(prev => prev + ' ' + text);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onerror: (e) => console.error('Live Error:', e),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          inputAudioTranscription: {},
          systemInstruction: 'You are a helpful, eco-conscious recycling expert. Answer any questions about recycling, environmental impacts, and waste management with positivity and clarity. Keep answers concise for audio.',
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Microphone access failed:', err);
    }
  };

  const stopVoiceSession = () => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then((s: any) => {
        try { s.close(); } catch(e) {}
      });
    }
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsActive(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => stopVoiceSession();
  }, []);

  return (
    <div className="h-full flex flex-col animate-fadeIn overflow-hidden bg-slate-50">
      <div className="flex items-center justify-between p-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-slate-900">Eco Assistant</h2>
        </div>
        <button 
          onClick={() => { setMessages([]); setTranscription(''); }}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Clear Conversation"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isActive && !transcription && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            {/* Fixed missing MessageSquare import error */}
            <MessageSquare size={48} className="text-slate-300" />
            <p className="font-bold text-slate-400">Ask me anything about recycling!</p>
          </div>
        )}

        {/* Render text messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[85%] p-4 rounded-2xl font-bold shadow-sm ${
              msg.role === 'user' 
                ? 'bg-emerald-600 text-white rounded-br-none' 
                : 'bg-white border-2 border-slate-100 text-slate-800 rounded-bl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        )}
        
        {/* Voice Transcription Area (if active) */}
        {isActive && transcription && (
          <div className="flex justify-start animate-fadeIn">
            <div className="max-w-[85%] p-4 bg-blue-50 border-2 border-blue-100 text-blue-900 rounded-2xl rounded-bl-none font-bold shadow-sm italic">
              <span className="text-[10px] uppercase block mb-1 text-blue-400 font-black tracking-tighter">Live Session</span>
              {transcription}
            </div>
          </div>
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-200 p-3 rounded-2xl flex gap-1">
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        
        <div ref={transcriptionEndRef} />
      </div>

      {/* Mode Indicators */}
      {isActive && (
        <div className="px-4 py-3 bg-emerald-50 border-y border-emerald-100 flex flex-col items-center space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping" />
              <div className="relative w-3 h-3 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-emerald-700 font-black text-xs uppercase tracking-widest">
              {isSpeaking ? 'AI Speaking' : 'Listening...'}
            </span>
          </div>
          <div className="flex gap-1.5 h-8 items-center">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div 
                key={i} 
                className="w-1.5 bg-emerald-400 rounded-full transition-all duration-300"
                style={{ 
                  height: isSpeaking || !isSpeaking ? `${20 + Math.random() * 80}%` : '4px', 
                  animationDelay: `${i * 0.1}s`,
                  opacity: isSpeaking ? 1 : 0.5
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
        {!isActive ? (
          <>
            <button 
              onClick={startVoiceSession}
              className="p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-emerald-100 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
              title="Switch to Voice"
            >
              <Mic size={24} />
            </button>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-4 pr-14 font-bold text-slate-900 outline-none focus:border-emerald-500 transition-all shadow-inner"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendTextMessage()}
              />
              <button 
                onClick={handleSendTextMessage}
                className={`absolute right-2 p-2 rounded-xl transition-all shadow-md ${inputText.trim() ? 'bg-emerald-600 text-white active:scale-90' : 'bg-slate-200 text-slate-400'}`}
                disabled={!inputText.trim() || isTyping}
              >
                {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={stopVoiceSession}
            className="w-full p-5 bg-red-500 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
          >
            <MicOff size={22} /> Exit Voice Assistant
          </button>
        )}
      </div>
    </div>
  );
};

export default AssistantChat;
