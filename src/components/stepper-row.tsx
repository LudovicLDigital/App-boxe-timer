import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step: number;
  min: number;
  max: number;
  format?: (value: number) => string;
};

export function StepperRow({ label, value, onChange, step, min, max, format }: Props) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <StepButton text="−" disabled={value <= min} onPress={() => set(value - step)} />
        <Text style={styles.value}>{format ? format(value) : value}</Text>
        <StepButton text="+" disabled={value >= max} onPress={() => set(value + step)} />
      </View>
    </View>
  );
}

function StepButton({ text, onPress, disabled }: { text: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: disabled ? 0.3 : 0.6 }]}>
      <Text style={styles.buttonText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2A2A35',
  },
  label: { color: colors.text, fontSize: 17, flexShrink: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { color: colors.text, fontSize: 22, fontWeight: '700', minWidth: 64, textAlign: 'center', fontVariant: ['tabular-nums'] },
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.text, fontSize: 26, fontWeight: '600' },
});
