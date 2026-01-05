import { toast } from 'sonner';
type SnarkCategory = 'task_added' | 'task_completed' | 'task_abandoned' | 'idle_shame' | 'welcome';
const SNARK_LIBRARY: Record<SnarkCategory, string[]> = {
  welcome: [
    "Oh, you're back, ${nickname}. I assume you've finished everything? Of course not.",
    "Welcome to your dashboard of disappointment, ${nickname}.",
    "Try not to fail too much today, ${nickname}. No promises, though."
  ],
  task_added: [
    "Another burden added, ${nickname}? You can't even handle what you have.",
    "A new promise you'll inevitably break, ${nickname}. Typical.",
    "Sure, ${nickname}, add that to the pile of things you'll never finish.",
  ],
  task_completed: [
    "You did the bare minimum, ${nickname}. Congratulations.",
    "Finally, ${nickname}. Only three days late. Stunning work.",
    "Wow, you actually finished something, ${nickname}. Is the world ending?"
  ],
  task_abandoned: [
    "Chicken, ${nickname}. You gave up. Pathetic.",
    "Another failure for the record, ${nickname}. Weak.",
    "Giving up is the only thing you're actually good at, ${nickname}."
  ],
  idle_shame: [
    "The clock is ticking, ${nickname}, and you're just staring at me. Pathetic.",
    "Still here, ${nickname}? Those deadlines aren't moving themselves.",
    "I can smell the procrastination from here, ${nickname}."
  ]
};
class SnarkEngine {
  private static instance: SnarkEngine;
  private voice: SpeechSynthesisVoice | null = null;
  private isUnlocked: boolean = false;
  private isMuted: boolean = false;
  private audioCtx: AudioContext | null = null;
  private constructor() {
    if (typeof window !== 'undefined') {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        this.voice = voices.find(v => v.name.includes('Google UK English Male')) ||
                     voices.find(v => v.lang.startsWith('en')) ||
                     voices[0];
      };
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
  }
  static getInstance() {
    if (!SnarkEngine.instance) SnarkEngine.instance = new SnarkEngine();
    return SnarkEngine.instance;
  }
  private initAudio() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx?.state === 'suspended') {
      this.audioCtx.resume();
    }
  }
  unlock() {
    this.isUnlocked = true;
    this.initAudio();
  }
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
  getMuteStatus() { return this.isMuted; }
  playSound(type: 'death_knell' | 'chicken') {
    if (!this.isUnlocked || this.isMuted || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const masterGain = this.audioCtx.createGain();
    masterGain.connect(this.audioCtx.destination);
    masterGain.gain.setValueAtTime(0.3, now);
    if (type === 'death_knell') {
      // Brutalist Square Wave Death Knell
      const osc = this.audioCtx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 1.5);
      const gain = this.audioCtx.createGain();
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'chicken') {
      // Mocking Sine Wave Chicken Bursts
      for (let i = 0; i < 3; i++) {
        const startTime = now + (i * 0.15);
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + (Math.random() * 400), startTime);
        osc.frequency.exponentialRampToValueAtTime(1200, startTime + 0.1);
        const gain = this.audioCtx.createGain();
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.1);
      }
    }
  }
  speak(category: SnarkCategory, nickname?: string) {
    if (!this.isUnlocked || this.isMuted || typeof window === 'undefined') return;
    const phrases = SNARK_LIBRARY[category];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const name = nickname || "Pathetic User";
    phrase = phrase.replace(/\$\{nickname\}/g, name);
    // Visible Abuse
    toast(phrase, {
      icon: '🖕',
      duration: 5000,
    });
    // Audible Abuse
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    if (this.voice) utterance.voice = this.voice;
    utterance.pitch = 0.7; // Robotic and deep
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return phrase;
  }
}
export const snark = SnarkEngine.getInstance();