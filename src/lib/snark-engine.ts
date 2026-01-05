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
    if (!SnarkEngine.instance) SnarkEngine.instance = new SnarkEngine();
    return SnarkEngine.instance;
  }
  unlock() { this.isUnlocked = true; }
  toggleMute() { this.isMuted = !this.isMuted; return this.isMuted; }
  getMuteStatus() { return this.isMuted; }
  playSound(type: keyof typeof SOUND_EFFECTS) {
    if (!this.isUnlocked || this.isMuted || typeof window === 'undefined') return;
    const audio = new Audio(SOUND_EFFECTS[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }
  speak(category: SnarkCategory, nickname?: string) {
    if (!this.isUnlocked || this.isMuted || typeof window === 'undefined') return;
    const phrases = SNARK_LIBRARY[category];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    if (nickname) {
      phrase = phrase.replace(/\$\{nickname\}/g, nickname);
    } else {
      phrase = phrase.replace(/\$\{nickname\}/g, "You");
    }
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