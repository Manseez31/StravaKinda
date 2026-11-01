import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useApp } from "../store/app";
export function useColors() {
  const light = useApp((s) => s.preferences.theme === "light");
  return light
    ? {
        bg: "#f4f3ef",
        panel: "#ffffff",
        raised: "#e9e8e3",
        text: "#191d20",
        muted: "#62686e",
        accent: "#d64b20",
        border: "#deded8",
      }
    : {
        bg: "#101416",
        panel: "#1a2023",
        raised: "#252d31",
        text: "#f5f5ed",
        muted: "#9da9af",
        accent: "#ff784b",
        border: "#303a3e",
      };
}
export function Screen({ children }: React.PropsWithChildren) {
  const c = useColors();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{ padding: 22, paddingBottom: 48, gap: 18 }}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}
export function Heading({
  children,
  eyebrow,
}: React.PropsWithChildren<{ eyebrow?: string }>) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      {eyebrow && (
        <Text
          style={{
            color: c.accent,
            fontWeight: "700",
            fontSize: 11,
            letterSpacing: 2,
          }}
        >
          {eyebrow.toUpperCase()}
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={{
          color: c.text,
          fontSize: 32,
          fontWeight: "800",
          letterSpacing: -1,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Copy({
  children,
  muted = false,
}: React.PropsWithChildren<{ muted?: boolean }>) {
  const c = useColors();
  return (
    <Text
      style={{ color: muted ? c.muted : c.text, fontSize: 15, lineHeight: 23 }}
    >
      {children}
    </Text>
  );
}
export function Card({ children }: React.PropsWithChildren) {
  const c = useColors();
  return (
    <View
      style={{
        padding: 20,
        borderRadius: 22,
        backgroundColor: c.panel,
        borderWidth: 1,
        borderColor: c.border,
        gap: 14,
      }}
    >
      {children}
    </View>
  );
}
export function Button({
  title,
  onPress,
  secondary = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 50,
        justifyContent: "center",
        alignItems: "center",
        padding: 14,
        borderRadius: 14,
        backgroundColor: secondary ? c.raised : c.accent,
        opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
      })}
    >
      <Text
        style={{
          color: secondary ? c.text : "#101416",
          fontWeight: "800",
          fontSize: 15,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <Copy muted>{label}</Copy>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        {...props}
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: c.border,
          padding: 13,
          borderRadius: 12,
          color: c.text,
          backgroundColor: c.bg,
        }}
      />
    </View>
  );
}
export function Metric({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flex: 1, minWidth: 100, gap: 5 }}>
      <Text
        style={{
          color: c.text,
          fontSize: 28,
          fontWeight: "800",
          fontVariant: ["tabular-nums"],
        }}
      >
        {value}
      </Text>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
export function Row({ children }: React.PropsWithChildren) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
      {children}
    </View>
  );
}
export function Loading() {
  const c = useColors();
  return (
    <Card>
      <ActivityIndicator color={c.accent} accessibilityLabel="Loading" />
      <View accessible={false} style={{ gap: 10 }}>
        <View
          style={{
            height: 14,
            width: "65%",
            backgroundColor: c.raised,
            borderRadius: 8,
          }}
        />
        <View
          style={{
            height: 14,
            width: "90%",
            backgroundColor: c.raised,
            borderRadius: 8,
          }}
        />
      </View>
      <Copy muted>Getting things ready…</Copy>
    </Card>
  );
}
export function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <Card>
      <Copy>{title}</Copy>
      <Copy muted>{detail}</Copy>
    </Card>
  );
}
