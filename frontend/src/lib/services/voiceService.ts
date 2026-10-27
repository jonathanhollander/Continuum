import { get } from 'svelte/store';
import { conciergeEngine } from '../stores/conciergeEngine';

class VoiceService {
    private recognition: any | null = null;
    private synthesis: SpeechSynthesis | null = null;
    private Recognition: any | null = null;

    constructor() {
        if (typeof window !== 'undefined') {
            this.Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            this.synthesis = window.speechSynthesis;
        }
    }

    startListening() {
        if (!this.Recognition) {
            console.error('Speech recognition not supported');
            return;
        }
        this.cancelListening();
        // Each capture owns its handlers: an aborted capture's queued event cannot become a new capture.
        const recognition = new this.Recognition();
        const epoch = get(conciergeEngine).accountEpoch;
        const isCurrent = () => this.recognition === recognition && epoch === get(conciergeEngine).accountEpoch;
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            if (!isCurrent()) return;
            const transcript = event.results[0][0].transcript;
            conciergeEngine.setListening(false);
            conciergeEngine.sendMessage(transcript, true);
        };
        recognition.onerror = recognition.onend = () => {
            if (!isCurrent()) return;
            this.recognition = null;
            conciergeEngine.setListening(false);
        };
        this.recognition = recognition;
        conciergeEngine.setListening(true);
        try {
            recognition.start();
        } catch (error) {
            if (isCurrent()) this.cancelListening();
            console.error('Speech recognition failed:', error);
        }
    }

    stopListening() {
        this.recognition?.stop();
    }

    cancelListening() {
        const recognition = this.recognition;
        this.recognition = null;
        recognition?.abort();
        conciergeEngine.setListening(false);
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
