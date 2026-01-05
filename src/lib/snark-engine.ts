type SnarkCategory = 'task_added' | 'task_completed' | 'task_abandoned' | 'idle_shame' | 'welcome';
const SNARK_LIBRARY: Record<SnarkCategory, string[]> = {
  welcome: [
    "Oh, you're back. I assume you've finished everything? Of course not.",
    "Welcome to your dashboard of disappointment.",
    "Try not to fail too much today. No promises, though."
  ],
  task_added: [
    "Another burden added? You can't even handle what you have.",
    "A new promise you'll inevitably break. Typical.",
    "Sure, add that to the pile of things you'll never finish.",
    "The audacity to add more tasks while failing so many others is impressive."
  ],
  task_completed: [
    "You did the bare minimum. Congratulations. Want a medal?",
    "Finally. Only three days late. Stunning work.",
    "About time. A snail could have done it faster.",
    "Wow, you actually finished something. Is the world ending?"
  ],
  task_abandoned: [
    "Chicken. You gave up. Pathetic.",
    "Another failure for the record. Your parents would be proud.",
    "Weak. Absolutely weak.",
    "Giving up is the only thing you're actually good at."
  ],
  idle_shame: [
    "The clock is ticking, and you're just staring at me. Pathetic.",
    "Still here? Those deadlines aren't moving themselves.",
    "I can smell the procrastination from here."
  ]
};
const SOUND_EFFECTS = {
  chicken: 'https://assets.mixkit.co/active_storage/sfx/204/204-preview.mp3',
  death_knell: 'https://assets.mixkit.co/active_storage/sfx/1118/1118-preview.mp3'
};
class SnarkEngine {
  private static instance: SnarkEngine;
  private voice: SpeechSynthesisVoice | null = null;
  private isUnlocked: boolean = false;
  private isMuted: boolean = false;
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
    if (!SnarkEngine.instance) {
      SnarkEngine.instance = new SnarkEngine();
    }
    return SnarkEngine.instance;
  }
  unlock() {
    this.isUnlocked = true;
  }
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
  getMuteStatus() {
    return this.isMuted;
  }
  playSound(type: keyof typeof SOUND_EFFECTS) {
    if (!this.isUnlocked || this.isMuted || typeof window === 'undefined') return;
    const audio = new Audio(SOUND_EFFECTS[type]);
    audio.volume = 0.5;
    audio.play().catch(() => { /* Ignore autoplay blocks */ });
  }
  speak(category: SnarkCategory) {
    if (!this.isUnlocked || this.isMuted || typeof window === 'undefined') return;
    const phrases = SNARK_LIBRARY[category];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    if (this.voice) utterance.voice = this.voice;
    utterance.pitch = 0.8;
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
    return phrase;
  }
}
export const snark = SnarkEngine.getInstance();