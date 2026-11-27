import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/hooks/use-session';
import { colors, phaseColors, phaseLabels } from '@/theme/colors';
import { buildPlan, DEFAULT_CONFIG, formatClock, type Cue, type TimerConfig } from '@/timer';

export default function SessionScreen() {
  useKeepAwake();
  const params = useLocalSearchParams<{ config?: string }>();
  const plan = useMemo(() => {
    const config: TimerConfig = params.config ? JSON.parse(params.config) : DEFAULT_CONFIG;
    return buildPlan(config);
  }, [params.config]);
  const [confirmStop, setConfirmStop] = useState(false);

  // Retour provisoire en vibrations ; les sons arrivent dans une prochaine étape.
  const onCue = (cue: Cue) => {
    if (cue.type === 'phaseStart' || cue.type === 'finished') Vibration.vibrate([0, 400, 150, 400]);
    else if (cue.type === 'warning') Vibration.vibrate(200);
    else if (cue.type === 'countdown') Vibration.vibrate(80);
  };

  const { position, paused, togglePause, skip, back } = useSession(plan, onCue);
  const { phase } = position;
  const { config } = plan;

  if (!phase) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={styles.phaseLabel}>SÉANCE TERMINÉE</Text>
          <Text style={styles.subLabel}>
            {config.roundsPerCycle * config.cycles} rounds · {formatClock(plan.totalMs)}
          </Text>
        </View>
        <BigButton label="Retour" onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const next = plan.phases[position.index + 1];
  const roundInfo =
    phase.kind === 'prepare'
      ? 'Round 1 dans un instant'
      : `Round ${phase.roundInCycle}/${config.roundsPerCycle}` + (config.cycles > 1 ? ` · Cycle ${phase.cycle}/${config.cycles}` : '');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: phaseColors[phase.kind] }]}>
      <View style={styles.center}>
        <Text style={styles.phaseLabel}>{phaseLabels[phase.kind]}</Text>
        <Text style={styles.subLabel}>{roundInfo}</Text>
        <Text style={styles.clock} adjustsFontSizeToFit numberOfLines={1}>
          {formatClock(position.remainingMs)}
        </Text>
        {paused && <Text style={styles.paused}>EN PAUSE</Text>}
        {next && (
          <Text style={styles.next}>
            Ensuite : {phaseLabels[next.kind].toLowerCase()} {formatClock(next.durationMs)}
          </Text>
        )}
      </View>

      <View style={styles.controls}>
        <SmallButton label="⏮" onPress={back} />
        <BigButton label={paused ? 'REPRENDRE' : 'PAUSE'} onPress={togglePause} />
        <SmallButton label="⏭" onPress={skip} />
      </View>
      <Pressable
        accessibilityRole="button"
        style={styles.stop}
        onPress={() => (confirmStop ? router.back() : setConfirmStop(true))}
        onBlur={() => setConfirmStop(false)}>
        <Text style={styles.stopText}>{confirmStop ? 'Toucher encore pour arrêter' : 'Arrêter'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function BigButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.big, pressed && { opacity: 0.7 }]}>
      <Text style={styles.bigText}>{label}</Text>
    </Pressable>
  );
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.small, pressed && { opacity: 0.7 }]}>
      <Text style={styles.smallText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  phaseLabel: { color: colors.text, fontSize: 40, fontWeight: '900', letterSpacing: 3 },
  subLabel: { color: colors.text, opacity: 0.85, fontSize: 22, fontWeight: '600', marginTop: 8 },
  clock: { color: colors.text, fontSize: 150, fontWeight: '800', fontVariant: ['tabular-nums'], marginVertical: 8 },
  paused: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 2 },
  next: { color: colors.text, opacity: 0.75, fontSize: 18, marginTop: 12 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  big: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingVertical: 24, alignItems: 'center' },
  bigText: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  small: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center' },
  smallText: { color: colors.text, fontSize: 28 },
  stop: { alignSelf: 'center', paddingVertical: 18, paddingHorizontal: 24 },
  stopText: { color: colors.text, opacity: 0.85, fontSize: 17, fontWeight: '600' },
});
