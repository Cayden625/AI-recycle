
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, Modality, Blob } from '@google/genai';
import { Mic, MicOff, ChevronLeft, Volume2, Trash2 } from 'lucide-react';

interface VoiceChatProps {
  onBack: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcription, setTranscription] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const transcriptionEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Auto-scroll transcription
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcription]);

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

  const startSession = async () => {
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
          onmessage: async (message) => {
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

  const stopSession = () => {
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
    startSession();
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-black text-slate-900">Voice Assistant</h2>
        </div>
        <button 
          onClick={() => setTranscription('')}
          className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          title="Clear transcription"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-10">
        <div className="relative">
          <div className={`absolute -inset-10 bg-emerald-500/10 rounded-full animate-ping ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute -inset-5 bg-emerald-500/20 rounded-full animate-pulse ${isActive ? 'opacity-100' : 'opacity-0'}`} />
          
          <div className={`relative w-44 h-44 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-4 border-white ${isSpeaking ? 'bg-emerald-600 scale-105' : 'bg-emerald-500'}`}>
            {isSpeaking ? <Volume2 size={70} className="text-white animate-bounce" /> : <Mic size={70} className="text-white" />}
          </div>
        </div>

        <div className="text-center space-y-3">
          <p className="text-xl font-black text-slate-900">
            {isActive ? (isSpeaking ? "Expert Speaking..." : "Listening to you...") : "Connecting..."}
          </p>
          <div className="flex justify-center gap-1.5 h-10 items-center">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`w-2 bg-emerald-500 rounded-full transition-all duration-300 ${isActive ? (isSpeaking ? 'animate-bounce' : 'animate-pulse') : 'bg-slate-200'}`}
                style={{ 
                  height: isActive ? `${20 + Math.random() * 80}%` : '6px',
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="w-full bg-slate-50 p-6 rounded-[2rem] min-h-[140px] max-h-[220px] overflow-y-auto border border-slate-200 shadow-inner">
          <div className="text-slate-800 font-bold text-base text-center leading-relaxed">
            {transcription || <span className="text-slate-400 font-medium italic">Conversation will appear here...</span>}
            <div ref={transcriptionEndRef} />
          </div>
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <button 
          onClick={isActive ? stopSession : startSession}
          className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black shadow-xl transition-all active:scale-95 ${isActive ? 'bg-red-500 text-white' : 'bg-emerald-600 text-white'}`}
        >
          {isActive ? (
            <><MicOff size={22} /> Stop Assistant</>
          ) : (
            <><Mic size={22} /> Start Talking</>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceChat;
