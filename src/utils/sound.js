// Simple, dependency-free notification sound using the Web Audio API.
// Browsers block audio until the user has interacted with the page at
// least once - that's expected and unavoidable, not a bug.
let audioCtx = null;

export function playNotificationSound() {
  try {
    const enabled = localStorage.getItem('kamwala_sound_enabled');
    if (enabled === 'false') return;

    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const now = audioCtx.currentTime;
    [880, 1175].forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.16);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.16 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now + i * 0.16);
      osc.stop(now + i * 0.16 + 0.36);
    });
  } catch {
    // Autoplay/permission issues should never break the app.
  }
}

export function isSoundEnabled() {
  return localStorage.getItem('kamwala_sound_enabled') !== 'false';
}

export function setSoundEnabled(enabled) {
  localStorage.setItem('kamwala_sound_enabled', enabled ? 'true' : 'false');
}
