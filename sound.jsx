// Sound removed — stub keeps call sites working without emitting audio.
const SoundManager = {
  setEnabled: () => {},
  rustle: () => {},
  sunDrone: () => ({ stop: () => {} }),
  water: () => ({ stop: () => {} }),
};
window.SoundManager = SoundManager;
