import { get } from 'svelte/store';
import { conciergeEngine } from '../stores/conciergeEngine';

class VoiceService {
    private recognition: any | null = null;
    private synthesis: SpeechSynthesis | null = null;
    private listeningEpoch: number | null = null;

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
                    if (this.listeningEpoch !== get(conciergeEngine).accountEpoch) return;
                    const transcript = event.results[0][0].transcript;
                    conciergeEngine.setListening(false);
                    conciergeEngine.sendMessage(transcript, true);
                };

                this.recognition.onerror = () => {
                    if (this.listeningEpoch !== get(conciergeEngine).accountEpoch) return;
                    conciergeEngine.setListening(false);
                };

                this.recognition.onend = () => {
                    if (this.listeningEpoch !== get(conciergeEngine).accountEpoch) return;
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
        this.listeningEpoch = get(conciergeEngine).accountEpoch;
        conciergeEngine.setListening(true);
        this.recognition.start();
    }

    stopListening() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    cancelListening() {
        this.listeningEpoch = null;
        this.recognition?.abort();
    }

    speak(text: string) {
        if (!this.synthesis) return;

        // Cancel existing speech
        this.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const epoch = get(conciergeEngine).accountEpoch;

        // --- 2026 Voice Tuning (Natural & Friendly) ---
        const voices = this.synthesis.getVoices();

        // Priority list for more natural/friendly voices
        const preferredVoices = [
            "Google US English", // Chrome (Very natural)
            "Samantha",          // macOS (Classic friendly)
            "Microsoft Zira",    // Windows
            "en-US"              // Fallback
        ];

        let selectedVoice = null;
        for (const name of preferredVoices) {
            selectedVoice = voices.find(v => v.name.includes(name) || v.lang === name);
            if (selectedVoice) break;
        }

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Tuning for "Supportive Expert" persona
        utterance.rate = 1.05;  // Slightly faster for fluidity
        utterance.pitch = 1.1;  // Slightly higher for warmth (~ +1 semitone)
        // ----------------------------------------------

        utterance.onstart = () => { if (epoch === get(conciergeEngine).accountEpoch) conciergeEngine.setSpeaking(true); };
        utterance.onend = () => { if (epoch === get(conciergeEngine).accountEpoch) conciergeEngine.setSpeaking(false); };
        utterance.onerror = () => { if (epoch === get(conciergeEngine).accountEpoch) conciergeEngine.setSpeaking(false); };

        this.synthesis.speak(utterance);
    }

    stopSpeaking() {
        if (this.synthesis) {
            this.synthesis.cancel();
        }
    }
}

export const voiceService = new VoiceService();
