import { useState } from 'react';

import { ConfigScreen } from '@/components/ConfigScreen';
import { SessionScreen } from '@/components/SessionScreen';
import { unlockAudio } from '@/lib/audio';
import { loadLastConfig, saveLastConfig } from '@/lib/storage';
import type { TimerConfig } from '@/timer';

export function App() {
  const [lastConfig, setLastConfig] = useState(loadLastConfig);
  const [running, setRunning] = useState<TimerConfig | null>(null);

  if (running) return <SessionScreen config={running} onExit={() => setRunning(null)} />;

  return (
    <ConfigScreen
      initial={lastConfig}
      onStart={(config) => {
        unlockAudio(); // doit être appelé pendant le geste utilisateur (iOS)
        saveLastConfig(config);
        setLastConfig(config);
        setRunning(config);
      }}
    />
  );
}
