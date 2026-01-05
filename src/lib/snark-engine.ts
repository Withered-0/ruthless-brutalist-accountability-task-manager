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
class SnarkEngine {
  private static instance: SnarkEngine;
  private voice: SpeechSynthesisVoice | null = null;
  private isUnlocked: boolean = false;
  private constructor() {
    if (typeof window !== 'undefined') {
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        // Prefer a dry, robotic or clear English voice
        this.voice = voices.find(v => v.name.includes('Google UK English Male')) || 
                     voices.find(v => v.lang.startsWith('en')) || 
                     voices[0];
      };
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
  speak(category: SnarkCategory) {
    if (!this.isUnlocked || typeof window === 'undefined') return;
    const phrases = SNARK_LIBRARY[category];
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    // Stop any current speech
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