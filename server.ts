import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize GoogleGenAI
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey });
};

// 1. Audio Transcription endpoint using 'gemini-3.5-transcribe'
app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm' } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64 data in request body' });
    }

    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: [
        {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType,
          },
        },
        {
          text: 'Transcribe the spoken words from this audio recording verbatim. Provide only the clear, accurate transcript text without quotes, timestamps, or conversational filler.',
        },
      ],
    });

    const transcription = response.text?.trim() || '';
    return res.json({ text: transcription });
  } catch (error: unknown) {
    console.error('Audio transcription error with gemini-3.5-transcribe:', error);
    const msg = error instanceof Error ? error.message : 'Unknown transcription error';
    return res.status(500).json({ error: msg });
  }
});

// 2. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', models: ['gemini-3.5-transcribe', 'gemini-3.8-live'] });
});

// 3. WebSocket Server for Live Voice Conversations via 'gemini-3.8-live'
const wss = new WebSocketServer({ server, path: '/api/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice API WebSocket');
  let session: Awaited<ReturnType<GoogleGenAI['live']['connect']>> | null = null;
  let isClosed = false;

  try {
    const ai = getAIClient();
    session = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction:
          'You are the lively, charismatic vintage photobooth assistant and photo director at Arcade Lane Booth #04. You speak with warm, retro arcade charm and enthusiasm. You help users pick fun photobooth poses, suggest captions and handwritten postcard notes, recommend retro film filters (like 70s golden glow or film noir), and celebrate their moments. Keep answers concise (1-3 sentences), punchy, and natural for voice conversation.',
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN || isClosed) return;

          // Model spoken audio output
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio) {
            clientWs.send(JSON.stringify({ type: 'audio', audio }));
          }

          // Output text transcription
          const outputTranscript = (message as unknown as { serverContent?: { outputTranscription?: { text?: string } } })?.serverContent?.outputTranscription?.text;
          if (outputTranscript) {
            clientWs.send(JSON.stringify({ type: 'output_transcript', text: outputTranscript }));
          }

          // Input text transcription
          const inputTranscript = (message as unknown as { serverContent?: { inputTranscription?: { text?: string } } })?.serverContent?.inputTranscription?.text;
          if (inputTranscript) {
            clientWs.send(JSON.stringify({ type: 'input_transcript', text: inputTranscript }));
          }

          // Model speech interruption
          if (message.serverContent?.interrupted) {
            clientWs.send(JSON.stringify({ type: 'interrupted', interrupted: true }));
          }

          // Turn complete
          if (message.serverContent?.turnComplete) {
            clientWs.send(JSON.stringify({ type: 'turn_complete' }));
          }
        },
        onclose: () => {
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'session_closed' }));
          }
        },
        onerror: (err: unknown) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'error', error: String(err) }));
          }
        },
      },
    });

    clientWs.on('message', (data: Buffer | string) => {
      if (!session || isClosed) return;
      try {
        const payload = JSON.parse(data.toString());
        if (payload.audio) {
          // Stream raw 16kHz PCM audio to gemini-3.8-live
          session.sendRealtimeInput({
            audio: {
              data: payload.audio,
              mimeType: 'audio/pcm;rate=16000',
            },
          });
        } else if (payload.text) {
          // Stream text prompt to Live session
          session.sendRealtimeInput({
            text: payload.text,
          });
        }
      } catch (err) {
        console.error('Error forwarding client message to Live session:', err);
      }
    });

    clientWs.on('close', () => {
      isClosed = true;
      if (session) {
        try {
          session.close();
        } catch {
          // ignore
        }
      }
    });
  } catch (err) {
    console.error('Failed to initialize gemini-3.8-live session:', err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(
        JSON.stringify({
          type: 'error',
          error: err instanceof Error ? err.message : 'Failed to connect to Live API',
        })
      );
      clientWs.close();
    }
  }
});

// Vite middleware or static serving
async function setupVite() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(Number(port), '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (mode: ${isProd ? 'production' : 'development'})`);
  });
}

setupVite().catch((err) => {
  console.error('Server startup error:', err);
});
