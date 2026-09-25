import { useState, useRef, useCallback, useEffect } from 'react';

export interface LiveMessage {
  id: string;
  sender: 'user' | 'model';
  text: string;
  timestamp: number;
}

export function useLiveVoice() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [modelTranscript, setModelTranscript] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [micVolume, setMicVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const currentModelTextRef = useRef<string>('');
  const currentUserTextRef = useRef<string>('');

  // Stop output audio playback and clear queue
  const stopAudioPlayback = useCallback(() => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsModelSpeaking(false);
  }, []);

  // Play a 24kHz PCM chunk with gapless scheduling
  const scheduleAudioChunk = useCallback((base64PCM: string) => {
    if (!outputAudioCtxRef.current) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      outputAudioCtxRef.current = new AudioCtxClass({ sampleRate: 24000 });
    }
    const audioCtx = outputAudioCtxRef.current;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    try {
      const binaryString = atob(base64PCM);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = audioCtx.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);

      const currentTime = audioCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime + 0.04;
      }

      source.start(nextStartTimeRef.current);
      setIsModelSpeaking(true);
      nextStartTimeRef.current += audioBuffer.duration;

      activeSourcesRef.current.push(source);
      source.onended = () => {
        activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
        if (activeSourcesRef.current.length === 0) {
          setIsModelSpeaking(false);
        }
      };
    } catch (e) {
      console.warn('Error scheduling PCM audio playback:', e);
    }
  }, []);

  // Connect to Live API WebSocket
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return;
    setIsConnecting(true);
    setError(null);

    try {
      // 1. Setup AudioContexts
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const inputCtx = new AudioCtxClass({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;

      const outputCtx = new AudioCtxClass({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // 2. Request Microphone Access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. Setup WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // 4. Start streaming 16kHz PCM audio from mic
        const source = inputCtx.createMediaStreamSource(stream);
        const processor = inputCtx.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const inputData = e.inputBuffer.getChannelData(0);

          // Calculate volume for UI visualizer
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
          }
          const avg = sum / inputData.length;
          setMicVolume(Math.min(1, avg * 5));

          // Convert Float32 to 16-bit PCM (little-endian)
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }

          // Convert to base64 string
          const uint8 = new Uint8Array(pcm16.buffer);
          let binary = '';
          const len = uint8.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = btoa(binary);

          ws.send(JSON.stringify({ audio: base64 }));
        };

        source.connect(processor);
        processor.connect(inputCtx.destination);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'audio' && msg.audio) {
            scheduleAudioChunk(msg.audio);
          } else if (msg.type === 'output_transcript' && msg.text) {
            currentModelTextRef.current += msg.text;
            setModelTranscript(currentModelTextRef.current);
          } else if (msg.type === 'input_transcript' && msg.text) {
            currentUserTextRef.current += msg.text;
            setUserTranscript(currentUserTextRef.current);
          } else if (msg.type === 'interrupted') {
            stopAudioPlayback();
          } else if (msg.type === 'turn_complete') {
            if (currentUserTextRef.current.trim()) {
              const uText = currentUserTextRef.current.trim();
              setMessages((prev) => [
                ...prev,
                { id: `user-${Date.now()}`, sender: 'user', text: uText, timestamp: Date.now() },
              ]);
              currentUserTextRef.current = '';
              setUserTranscript('');
            }
            if (currentModelTextRef.current.trim()) {
              const mText = currentModelTextRef.current.trim();
              setMessages((prev) => [
                ...prev,
                { id: `model-${Date.now()}`, sender: 'model', text: mText, timestamp: Date.now() },
              ]);
              currentModelTextRef.current = '';
              setModelTranscript('');
            }
          } else if (msg.type === 'error') {
            setError(msg.error || 'Live API error');
          }
        } catch (e) {
          console.warn('Error parsing Live WebSocket message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('Live Voice WebSocket error:', e);
        setError('Connection to Live voice server failed');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
      };
    } catch (err: unknown) {
      console.error('Failed to start Live Voice session:', err);
      setError(err instanceof Error ? err.message : 'Microphone or connection failed');
      setIsConnecting(false);
      setIsConnected(false);
    }
  }, [isConnecting, isConnected, scheduleAudioChunk, stopAudioPlayback]);

  // Send text to Live API session
  const sendTextMessage = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
      setMessages((prev) => [
        ...prev,
        { id: `user-text-${Date.now()}`, sender: 'user', text, timestamp: Date.now() },
      ]);
    }
  }, []);

  // Disconnect & cleanup
  const disconnect = useCallback(() => {
    stopAudioPlayback();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setMicVolume(0);
  }, [stopAudioPlayback]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isConnecting,
    isModelSpeaking,
    userTranscript,
    modelTranscript,
    messages,
    micVolume,
    error,
    connect,
    disconnect,
    sendTextMessage,
  };
}
