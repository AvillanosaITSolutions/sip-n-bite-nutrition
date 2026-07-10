import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { colors, STATUS_META } from "../theme";

export function ScreenTitle({ script, title }: { script: string; title: string }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={styles.script}>{script}</Text>
      <Text style={styles.display}>{title}</Text>
    </View>
  );
}

export function Pill({
  label,
  active,
  onPress,
  count,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: active ? colors.peach : "transparent" },
      ]}
    >
      <Text style={styles.pillText}>{label}</Text>
      {count !== undefined && (
        <View
          style={[
            styles.pillCount,
            { backgroundColor: active ? "rgba(0,0,0,0.12)" : colors.peachSoft },
          ]}
        >
          <Text style={styles.pillCountText}>{count}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function PillRow({ children }: { children: ReactNode }) {
  return <View style={styles.pillRow}>{children}</View>;
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, bg: colors.peachSoft };
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color ?? colors.forest }]}>
        {meta.label}
      </Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "dark" | "outline" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === "primary"
      ? colors.peach
      : variant === "dark"
        ? colors.forest
        : variant === "danger"
          ? colors.redBg
          : "transparent";
  const fg =
    variant === "dark" ? colors.cream : variant === "danger" ? colors.redText : colors.forest;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: bg,
          borderWidth: variant === "outline" ? 1 : 0,
          borderColor: colors.forest,
          opacity: disabled || loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.stone400}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

export function SearchBar({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.searchWrap}>
      <Text style={{ color: colors.stone400 }}>🔍</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.stone400}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={8}>
          <Text style={{ color: colors.stone400 }}>✕</Text>
        </Pressable>
      )}
    </View>
  );
}

export function QtyStepper({
  quantity,
  onChange,
  max,
}: {
  quantity: number;
  onChange: (n: number) => void;
  max?: number;
}) {
  const atMax = max !== undefined && quantity >= max;
  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => onChange(quantity - 1)}
        style={[styles.stepBtn, { backgroundColor: "rgba(0,0,0,0.12)" }]}
        hitSlop={6}
      >
        <Text style={{ color: colors.forest, fontWeight: "700" }}>−</Text>
      </Pressable>
      <Text style={styles.stepQty}>{quantity}</Text>
      <Pressable
        onPress={() => !atMax && onChange(quantity + 1)}
        disabled={atMax}
        style={[styles.stepBtn, { backgroundColor: colors.forest, opacity: atMax ? 0.35 : 1 }]}
        hitSlop={6}
      >
        <Text style={{ color: colors.peach, fontWeight: "700" }}>+</Text>
      </Pressable>
    </View>
  );
}

export function EmptyState({ emoji, title, body }: { emoji: string; title: string; body?: string }) {
  return (
    <Card style={{ alignItems: "center", padding: 32, backgroundColor: colors.cream }}>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</Text>
      <Text style={{ fontWeight: "800", fontSize: 16, color: colors.forest }}>{title}</Text>
      {body ? (
        <Text style={{ color: colors.stone500, marginTop: 4, textAlign: "center" }}>{body}</Text>
      ) : null}
    </Card>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Text style={{ color: colors.redText, fontSize: 12, lineHeight: 18 }}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  script: { fontSize: 22, fontStyle: "italic", color: colors.peach },
  display: { fontSize: 32, fontWeight: "900", color: colors.forest, letterSpacing: 0.5 },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.cream,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 999,
    padding: 4,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  pillCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  pillCountText: { fontSize: 10, fontWeight: "900", color: colors.forest },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  button: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    padding: 16,
  },
  label: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.forest,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.forest, paddingVertical: 2 },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.peach,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepQty: {
    minWidth: 24,
    textAlign: "center",
    fontWeight: "800",
    color: colors.forest,
    fontVariant: ["tabular-nums"],
  },
  errorBox: {
    backgroundColor: colors.redBg,
    borderColor: "#FCA5A5",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginVertical: 8,
  },
});
