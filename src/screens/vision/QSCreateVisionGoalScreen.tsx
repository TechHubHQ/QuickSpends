import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QSHeader } from "../../components/QSHeader";
import { useAuth } from "../../context/AuthContext";
import {
  VisionPlanType,
  VISION_PLAN_META,
  useFutureVision,
} from "../../hooks/useFutureVision";
import { useSavings } from "../../hooks/useSavings";
import { createStyles } from "../../styles/vision/QSVision.styles";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, formatCurrencyCompact } from "../../utils/format";

const PLAN_TYPES = Object.keys(VISION_PLAN_META) as VisionPlanType[];

const PLACEHOLDERS: Record<VisionPlanType, { title: string; target: string; saved: string; monthly: string; date: string; notes: string }> = {
  goal: {
    title: "e.g., Home down payment",
    target: "500000",
    saved: "25000",
    monthly: "15000",
    date: "2028-12-01",
    notes: "How will you fund this?",
  },
  future_expense: {
    title: "e.g., Laptop upgrade",
    target: "90000",
    saved: "10000",
    monthly: "8000",
    date: "2026-12-01",
    notes: "Pay from savings, card, bonus, or split across months?",
  },
  safety_buffer: {
    title: "e.g., 4 month buffer",
    target: "300000",
    saved: "50000",
    monthly: "12000",
    date: "2027-06-01",
    notes: "What counts as protected money?",
  },
  debt_payoff: {
    title: "e.g., Credit card payoff",
    target: "120000",
    saved: "0",
    monthly: "20000",
    date: "2026-10-01",
    notes: "Which debt and what payoff strategy?",
  },
  small_wish: {
    title: "e.g., Weekend staycation",
    target: "18000",
    saved: "0",
    monthly: "3000",
    date: "2026-09-01",
    notes: "Keep this lightweight and guilt-free.",
  },
};

function cleanNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

export default function QSCreateVisionGoalScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const { createVisionPlan, projectVisionPlan, error: visionError } = useFutureVision();
  const { addSavingsGoal, deleteSavingsGoal } = useSavings();

  const [selectedType, setSelectedType] = useState<VisionPlanType | null>(null);
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthlyAllocation, setMonthlyAllocation] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      if (parent) parent.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  const meta = selectedType ? VISION_PLAN_META[selectedType] : null;
  const targetNum = parseFloat(targetAmount) || 0;
  const currentNum = parseFloat(currentAmount) || 0;
  const monthlyNum = parseFloat(monthlyAllocation) || 0;
  const remaining = Math.max(0, targetNum - currentNum);

  const previewPlan = useMemo(() => {
    if (!selectedType || !user || targetNum <= 0) return null;
    const m = VISION_PLAN_META[selectedType];
    return {
      id: "preview",
      user_id: user.id,
      plan_type: selectedType,
      title: title || m.label,
      target_amount: targetNum,
      current_amount: currentNum,
      monthly_allocation: monthlyNum,
      target_date: targetDate || null,
      priority: 5,
      status: "active" as const,
      notes,
      icon: m.icon,
      color: m.color,
      handling_strategy: notes || m.strategy,
      linked_savings_id: null,
      created_at: new Date().toISOString(),
    };
  }, [currentNum, monthlyNum, notes, selectedType, targetDate, targetNum, title, user]);

  const projection = previewPlan ? projectVisionPlan(previewPlan) : null;

  const applyType = (type: VisionPlanType) => {
    setSelectedType(type);
    setTitle("");
    setTargetAmount("");
    setCurrentAmount(type === "debt_payoff" ? "0" : "");
    setMonthlyAllocation("");
    setTargetDate("");
    setNotes(VISION_PLAN_META[type].strategy);
  };

  const canCreate = Boolean(selectedType && user && title.trim() && targetNum > 0 && monthlyNum > 0);

  const handleCreate = async () => {
    if (!user || !selectedType || !meta || !canCreate) return;
    setSaving(true);
    try {
      let linkedSavingsId: string | null = null;
      if (selectedType === "goal") {
        linkedSavingsId = await addSavingsGoal({
          name: title.trim(),
          target_amount: targetNum,
          user_id: user.id,
          category_id: undefined,
          goal_type: "custom",
          priority: 5,
          monthly_allocation: monthlyNum,
          cost_inflation_rate: 0,
          expected_return_rate: 0,
          is_vision_goal: true,
          icon: meta.icon,
          color: meta.color,
          notes,
          target_date: targetDate || undefined,
        }, currentNum);
        if (!linkedSavingsId) {
          Alert.alert("Could not create linked goal", "Please try again.");
          return;
        }
      }

      const id = await createVisionPlan(user.id, {
        plan_type: selectedType,
        title: title.trim(),
        target_amount: targetNum,
        current_amount: currentNum,
        monthly_allocation: monthlyNum,
        target_date: targetDate || null,
        priority: 5,
        notes,
        icon: meta.icon,
        color: meta.color,
        handling_strategy: notes || meta.strategy,
        linked_savings_id: linkedSavingsId,
      });

      if (!id) {
        if (linkedSavingsId) {
          await deleteSavingsGoal(linkedSavingsId);
        }
        Alert.alert("Could not create plan", visionError || "Please try again.");
        return;
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { position: "relative" }]}>
      <QSHeader title={selectedType ? meta?.label || "New Plan" : "Create Future Plan"} showBack onBackPress={() => router.back()} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: 20, paddingBottom: Math.max(150, insets.bottom + 150) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!selectedType ? (
            <Animated.View entering={FadeInDown}>
              <Text style={styles.visionEyebrow}>Choose what you are planning</Text>
              <Text style={styles.visionHeroTitle}>Small wishes, big goals, and everything in between.</Text>
              <View style={styles.planTypeList}>
                {PLAN_TYPES.map((type) => {
                  const item = VISION_PLAN_META[type];
                  return (
                    <Pressable
                      key={type}
                      onPress={() => applyType(type)}
                      style={({ pressed }) => [
                        styles.planTypeCard,
                        { borderColor: `${item.color}30`, opacity: pressed ? 0.88 : 1 },
                      ]}
                    >
                      <LinearGradient
                        colors={[`${item.color}20`, `${item.color}08`]}
                        style={styles.planTypeIcon}
                      >
                        <MaterialCommunityIcons name={item.icon as any} size={26} color={item.color} />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planTypeTitle}>{item.label}</Text>
                        <Text style={styles.planTypeDescription}>{item.description}</Text>
                      </View>
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: `${item.color}12`,
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <MaterialCommunityIcons name="chevron-right" size={20} color={item.color} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInDown}>
              <Pressable onPress={() => setSelectedType(null)} style={styles.switchPlanButton}>
                <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.primary} />
                <Text style={[styles.switchPlanText, { color: theme.colors.primary }]}>Change plan type</Text>
              </Pressable>

              <View style={[styles.planFormHero, { borderColor: `${meta?.color}30` }]}>
                <LinearGradient
                  colors={[`${meta?.color}20`, `${meta?.color}08`]}
                  style={styles.planTypeIcon}
                >
                  <MaterialCommunityIcons name={meta?.icon as any} size={26} color={meta?.color} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planFormTitle}>{meta?.label}</Text>
                  <Text style={styles.planFormSubtitle}>{meta?.strategy}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Plan Name</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder={PLACEHOLDERS[selectedType].title}
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>{selectedType === "debt_payoff" ? "Debt Amount" : "Target Amount"}</Text>
                  <TextInput
                    style={styles.input}
                    value={targetAmount}
                    onChangeText={(t) => setTargetAmount(cleanNumber(t))}
                    placeholder={PLACEHOLDERS[selectedType].target}
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>{selectedType === "debt_payoff" ? "Paid Already" : "Saved Already"}</Text>
                  <TextInput
                    style={styles.input}
                    value={currentAmount}
                    onChangeText={(t) => setCurrentAmount(cleanNumber(t))}
                    placeholder={PLACEHOLDERS[selectedType].saved}
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Monthly Plan</Text>
                  <TextInput
                    style={styles.input}
                    value={monthlyAllocation}
                    onChangeText={(t) => setMonthlyAllocation(cleanNumber(t))}
                    placeholder={PLACEHOLDERS[selectedType].monthly}
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, styles.halfInput]}>
                  <Text style={styles.inputLabel}>Target Date</Text>
                  <TextInput
                    style={styles.input}
                    value={targetDate}
                    onChangeText={setTargetDate}
                    placeholder={PLACEHOLDERS[selectedType].date}
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Handling Strategy</Text>
                <TextInput
                  style={[styles.input, styles.planNotesInput]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder={PLACEHOLDERS[selectedType].notes}
                  placeholderTextColor={theme.colors.textTertiary}
                  multiline
                />
              </View>

              <View style={styles.planPreviewCard}>
                <View style={styles.previewRow}>
                  <Text style={styles.planPreviewLabel}>Remaining</Text>
                  <Text style={styles.planPreviewValue}>{formatCurrencyCompact(remaining)}</Text>
                </View>
                <View style={[styles.previewRow, { borderBottomWidth: 1, borderBottomColor: theme.colors.divider }]} />
                <View style={styles.previewRow}>
                  <Text style={styles.planPreviewLabel}>Monthly impact</Text>
                  <Text style={[styles.planPreviewValue, { color: meta?.color }]}>{formatCurrencyCompact(monthlyNum)}</Text>
                </View>
                <View style={styles.previewRow}>
                  <Text style={styles.planPreviewLabel}>Likely completion</Text>
                  <Text style={styles.planPreviewValue}>{projection?.completionMonth || "Add monthly plan"}</Text>
                </View>
                {projection && !projection.onTrack && (
                  <Text style={styles.planPreviewWarning}>
                    Needs about {formatCurrency(projection.monthlyRequired)}/month to hit the selected date.
                  </Text>
                )}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {selectedType && (
        <View style={[styles.planBottomBar, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={handleCreate}
            disabled={!canCreate || saving}
            style={({ pressed }) => [
              styles.planCreateButton,
              {
                backgroundColor: meta?.color || theme.colors.primary,
                opacity: !canCreate || saving ? 0.45 : pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={styles.planCreateButtonText}>{saving ? "Creating..." : "Create Plan"}</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#ffffff" />
          </Pressable>
        </View>
      )}
    </View>
  );
}