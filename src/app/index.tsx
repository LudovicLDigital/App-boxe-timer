import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { StepperRow } from '@/components/stepper-row';
import { colors } from '@/theme/colors';
import { buildPlan, DEFAULT_CONFIG, formatClock, type TimerConfig } from '@/timer';

const secs = (s: number) => (s === 0 ? 'Off' : formatClock(s * 1000));

export default function ConfigScreen() {
  const [config, setConfig] = useState<TimerConfig>(DEFAULT_CONFIG);
  const set = <K extends keyof TimerConfig>(key: K) => (value: TimerConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const plan = buildPlan(config);
  const multiCycle = config.cycles > 1;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.section}>Rounds</Text>
        <StepperRow label="Durée du round" value={config.roundSec} onChange={set('roundSec')} step={15} min={15} max={1800} format={secs} />
        <StepperRow label="Repos entre rounds" value={config.restSec} onChange={set('restSec')} step={15} min={0} max={600} format={secs} />
        <StepperRow label="Rounds par cycle" value={config.roundsPerCycle} onChange={set('roundsPerCycle')} step={1} min={1} max={30} />

        <Text style={styles.section}>Cycles</Text>
        <StepperRow label="Nombre de cycles" value={config.cycles} onChange={set('cycles')} step={1} min={1} max={20} />
        {multiCycle && (
          <StepperRow label="Repos entre cycles" value={config.cycleRestSec} onChange={set('cycleRestSec')} step={15} min={0} max={1800} format={secs} />
        )}

        <Text style={styles.section}>Alertes</Text>
        <StepperRow label="Préparation" value={config.prepareSec} onChange={set('prepareSec')} step={5} min={0} max={60} format={secs} />
        <StepperRow label="Alerte fin de round" value={config.warningSec} onChange={set('warningSec')} step={5} min={0} max={60} format={secs} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.total}>
          Durée totale : <Text style={styles.totalValue}>{formatClock(plan.totalMs)}</Text>
          {'  ·  '}
          {config.roundsPerCycle * config.cycles} rounds
        </Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.start, pressed && { opacity: 0.8 }]}
          onPress={() => router.push({ pathname: '/session', params: { config: JSON.stringify(config) } })}>
          <Text style={styles.startText}>DÉMARRER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },
  section: { color: colors.textDim, fontSize: 13, fontWeight: '700', letterSpacing: 1, marginTop: 24, marginBottom: 4, textTransform: 'uppercase' },
  footer: { padding: 20, paddingBottom: 36, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#2A2A35' },
  total: { color: colors.textDim, fontSize: 15, textAlign: 'center' },
  totalValue: { color: colors.text, fontWeight: '700' },
  start: { backgroundColor: colors.accent, borderRadius: 16, paddingVertical: 20, alignItems: 'center' },
  startText: { color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: 2 },
});
