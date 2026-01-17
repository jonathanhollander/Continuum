import { conciergeEngine } from '../stores/conciergeEngine';

class VoiceService {
    private recognition: any | null = null;
    private synthesis: SpeechSynthesis | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            // Initialize STT
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRecognition) {
                this.recognition = new SpeechRecognition();
                this.recognition.continuous = false;
                this.recognition.interimResults = false;
                this.recognition.lang = 'en-US';

                this.recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    conciergeEngine.setListening(false);
                    conciergeEngine.sendMessage(transcript, true);
                };

                this.recognition.onerror = () => {
                    conciergeEngine.setListening(false);
                };

                this.recognition.onend = () => {
                    conciergeEngine.setListening(false);
                };
            }

            // Initialize TTS
            this.synthesis = window.speechSynthesis;
        }
    }

    startListening() {
        if (!this.recognition) {
            console.error('Speech recognition not supported');
            return;
        }
        conciergeEngine.setListening(true);
        this.recognition.start();
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    speak(text: string) {
        if (!this.synthesis) return;

        // Cancel existing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => conciergeEngine.setSpeaking(true);
        utterance.onend = () => conciergeEngine.setSpeaking(false);
        utterance.onerror = () => conciergeEngine.setSpeaking(false);

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

export const voiceService = new VoiceService();
