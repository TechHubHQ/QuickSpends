import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QSHeader } from "../../components/QSHeader";
import { GoalProgressRing } from "../../components/vision/GoalProgressRing";
import { ProjectionChart } from "../../components/vision/ProjectionChart";
import { VerticalGoalTimeline } from "../../components/vision/VerticalGoalTimeline";
import { useAuth } from "../../context/AuthContext";
import {
  GOAL_TYPE_META,
  GoalProjection,
  ScenarioAssumptions,
  ScenarioComparison,
  useFutureVision,
  VisionGoal,
  VisionScenario,
} from "../../hooks/useFutureVision";
import { useSavings } from "../../hooks/useSavings";
import { createStyles } from "../../styles/vision/QSVision.styles";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrencyCompact } from "../../utils/format";

export default function QSGoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      if (parent) parent.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  const { getVisionGoals, getScenarios, projectGoal, compareScenarios, getDefaultAssumptions, getVisionPlans, deleteVisionPlan } = useFutureVision();
  const { getSavingsGoal, updateSavingsGoal, deleteSavingsGoal } = useSavings();

  const [goal, setGoal] = useState<VisionGoal | null>(null);
  const [scenarios, setScenarios] = useState<VisionScenario[]>([]);
  const [projection, setProjection] = useState<GoalProjection | null>(null);
  const [comparisons, setComparisons] = useState<ScenarioComparison[]>([]);
  const [assumptions, setAssumptions] = useState<ScenarioAssumptions | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const [whatIfMonthly, setWhatIfMonthly] = useState(0);
  const [whatIfReturn, setWhatIfReturn] = useState(0);
  const [whatIfInflation, setWhatIfInflation] = useState(0);

  const loadGoal = useCallback(async () => {
    if (!user || !id) return;
    const [goalData, allScenarios, defAssumptions] = await Promise.all([
      getSavingsGoal(id),
      getScenarios(user.id),
      getDefaultAssumptions(user.id),
    ]);
    if (!goalData) return;

    const visionGoal: VisionGoal = {
      ...goalData,
      goal_type: (goalData as any).goal_type || "custom",
      priority: (goalData as any).priority || 5,
      monthly_allocation: (goalData as any).monthly_allocation || 0,
      cost_inflation_rate: (goalData as any).cost_inflation_rate || 0,
      expected_return_rate: (goalData as any).expected_return_rate || 0,
      is_vision_goal: (goalData as any).is_vision_goal || false,
      icon: (goalData as any).icon,
      color: (goalData as any).color,
      notes: (goalData as any).notes,
    };

    setGoal(visionGoal);
    setScenarios(allScenarios);
    setAssumptions(defAssumptions);
    setWhatIfMonthly(visionGoal.monthly_allocation || 0);
    setWhatIfReturn(visionGoal.expected_return_rate ?? defAssumptions.investment_return);
    setWhatIfInflation(visionGoal.cost_inflation_rate ?? defAssumptions.inflation_rate);

    const defaultScenario = allScenarios.find((s) => s.is_default) || allScenarios[0];
    if (defaultScenario) setActiveScenarioId(defaultScenario.id);
  }, [user, id, getSavingsGoal, getScenarios, getDefaultAssumptions]);

  useEffect(() => { loadGoal(); }, [loadGoal]);

  useEffect(() => {
    if (!goal || !assumptions) return;
    const whatIfAssumptions: ScenarioAssumptions = {
      ...assumptions,
      investment_return: whatIfReturn,
      inflation_rate: whatIfInflation,
    };
    const modifiedGoal = { ...goal, monthly_allocation: whatIfMonthly || goal.monthly_allocation };
    const proj = projectGoal(modifiedGoal, whatIfAssumptions);
    setProjection(proj);

    if (scenarios.length > 0) {
      const comps = compareScenarios(modifiedGoal, scenarios);
      setComparisons(comps);
    }
  }, [goal, whatIfMonthly, whatIfReturn, whatIfInflation, assumptions, scenarios, projectGoal, compareScenarios]);

  const meta = goal?.goal_type ? GOAL_TYPE_META[goal.goal_type] : null;
  const color = goal?.color || meta?.color || theme.colors.primary;
  const progress = goal ? (goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0) : 0;
  const remaining = goal ? Math.max(0, goal.target_amount - goal.current_amount) : 0;

  const handleDelete = async () => {
    if (!id || !user) return;
    const plans = await getVisionPlans(user.id);
    const linkedPlan = plans.find(p => p.linked_savings_id === id);
    if (linkedPlan) {
      await deleteVisionPlan(linkedPlan.id);
    }
    await deleteSavingsGoal(id);
    router.back();
  };

  const activeComparison = comparisons.find((c) => c.scenarioId === activeScenarioId);
  const displayProjection = activeComparison?.projection || projection;
  const monthsRemaining = displayProjection?.monthsToGoal ?? null;

  if (!goal) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  const statItems = [
    {
      icon: "finance" as const,
      label: "Monthly",
      value: `${formatCurrencyCompact(goal.monthly_allocation || 0)}`,
      color: theme.colors.primary,
    },
    {
      icon: "percent" as const,
      label: "Progress",
      value: `${Math.round(progress)}%`,
      color: progress >= 100 ? theme.colors.success : theme.colors.info,
    },
    {
      icon: "calendar-clock" as const,
      label: monthsRemaining && monthsRemaining <= 12 ? "Months" : "Time left",
      value: monthsRemaining
        ? monthsRemaining <= 12
          ? `${monthsRemaining}m`
          : `~${Math.round(monthsRemaining / 12)}y`
        : "—",
      color: theme.colors.warning,
    },
    {
      icon: "trending-up" as const,
      label: "Remaining",
      value: `${formatCurrencyCompact(remaining)}`,
      color: theme.colors.secondary,
    },
  ];

  return (
    <View style={styles.container}>
      <QSHeader title={goal.name} showBack onBackPress={() => router.back()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(180, insets.bottom + 120) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInDown.delay(100).springify()}>
            <LinearGradient
              colors={[color + "25", theme.colors.background]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.detailHero}
            >
              <LinearGradient
                colors={[color + "30", color + "10"]}
                style={styles.detailIconWrap}
              >
                <MaterialCommunityIcons
                  name={(goal.icon || meta?.icon || "star") as any}
                  size={38}
                  color={color}
                />
              </LinearGradient>
              <Text style={styles.detailTitle}>{goal.name}</Text>
              <View style={styles.detailTargetRow}>
                <Text style={styles.detailTargetLabel}>Target:</Text>
                <Text style={styles.detailTargetValue}>{formatCurrencyCompact(goal.target_amount)}</Text>
              </View>
              {meta && (
                <View
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 6,
                    borderRadius: 10,
                    backgroundColor: color + "18",
                    marginTop: 10,
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "700", color, letterSpacing: 0.5 }}>
                    {meta.label}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* Quick Stats Row */}
          <Animated.View
            entering={FadeInDown.delay(150).springify()}
            style={styles.quickStatsRow}
          >
            {statItems.map((item, idx) => (
              <LinearGradient
                key={idx}
                colors={[`${item.color}10`, theme.colors.card]}
                style={styles.quickStatItem}
              >
                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
                <Text style={styles.quickStatValue}>{item.value}</Text>
                <Text style={styles.quickStatLabel}>{item.label}</Text>
              </LinearGradient>
            ))}
          </Animated.View>

          {/* Progress Ring */}
          <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.progressRingWrap}>
            <GoalProgressRing
              current={goal.current_amount}
              target={goal.target_amount}
              size={150}
              color={color}
            />
            <View style={styles.progressRingLabels}>
              <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
              <Text style={styles.progressDetail}>
                Saved {formatCurrencyCompact(goal.current_amount)} of {formatCurrencyCompact(goal.target_amount)}
              </Text>
            </View>
          </Animated.View>

          {/* Vertical Goal Journey Timeline */}
          {displayProjection && displayProjection.points.length > 0 && (
            <VerticalGoalTimeline
              points={displayProjection.points}
              targetAmount={goal.target_amount}
              currentAmount={goal.current_amount}
              monthlyAllocation={goal.monthly_allocation || 0}
              color={color}
            />
          )}

          {/* Projection Chart */}
          {displayProjection && (
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <View style={styles.chartCard}>
                <Text style={styles.chartCardTitle}>Balance Projection</Text>
                <View style={styles.chartWrap}>
                  <ProjectionChart
                    points={displayProjection.points}
                    targetAmount={goal.target_amount}
                    scenarios={comparisons.length > 1 ? comparisons.map((c) => ({
                      name: c.scenarioName,
                      points: c.projection.points,
                      color: c.isDefault ? color : theme.colors.textTertiary,
                    })) : undefined}
                  />
                </View>
              </View>

              {displayProjection.completionMonth && (
                <LinearGradient
                  colors={[color, color + "dd"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.completionBadge}
                >
                  <MaterialCommunityIcons name="calendar-check" size={20} color="#ffffff" />
                  <Text style={styles.completionText}>
                    Reach goal by {displayProjection.completionMonth}
                  </Text>
                </LinearGradient>
              )}
            </Animated.View>
          )}

          {/* Scenario Comparison */}
          {comparisons.length > 0 && (
            <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.comparisonWrap}>
              <Text style={styles.chartCardTitle}>Scenario Comparison</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {comparisons.map((c) => (
                  <Pressable
                    key={c.scenarioId}
                    onPress={() => setActiveScenarioId(c.scenarioId)}
                    style={[
                      styles.scenarioChip,
                      {
                        borderColor: activeScenarioId === c.scenarioId
                          ? (activeComparison?.projection.goal.color || color)
                          : theme.colors.border,
                        backgroundColor: activeScenarioId === c.scenarioId
                          ? `${activeComparison?.projection.goal.color || color}12`
                          : theme.colors.backgroundSecondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scenarioLabel,
                        {
                          color: activeScenarioId === c.scenarioId
                            ? (activeComparison?.projection.goal.color || color)
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {c.scenarioName}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>

              {activeComparison && (
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Completion</Text>
                    <Text style={styles.comparisonDate}>
                      {activeComparison.projection.completionMonth || "—"}
                    </Text>
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Interest</Text>
                    <Text style={styles.comparisonDate}>
                      +{formatCurrencyCompact(activeComparison.projection.totalInterestEarned)}
                    </Text>
                  </View>
                  <View style={styles.comparisonItem}>
                    <Text style={styles.comparisonLabel}>Time</Text>
                    <Text style={styles.comparisonDate}>
                      {activeComparison.projection.monthsToGoal
                        ? activeComparison.projection.monthsToGoal <= 12
                          ? `${activeComparison.projection.monthsToGoal}m`
                          : `~${Math.round(activeComparison.projection.monthsToGoal / 12)}y`
                        : "—"}
                    </Text>
                  </View>
                </View>
              )}
            </Animated.View>
          )}

          {/* What-If Section */}
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.whatIfSection}>
            <Text style={styles.sectionTitle}>What-If Simulator</Text>
            <Text style={{ fontSize: 13, fontWeight: "500", color: theme.colors.textSecondary, marginTop: -10, marginBottom: 16, paddingHorizontal: 20 }}>
              Adjust sliders to see instant impact on your timeline
            </Text>

            <View style={styles.whatIfCard}>
              <View style={styles.sliderRow}>
                <View style={[styles.sliderIcon, { backgroundColor: `${theme.colors.success}18` }]}>
                  <MaterialCommunityIcons name="cash-plus" size={22} color={theme.colors.success} />
                </View>
                <View style={styles.sliderContent}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.sliderLabel}>Monthly Contribution</Text>
                    <Text style={styles.sliderValue}>{formatCurrencyCompact(whatIfMonthly)}</Text>
                  </View>
                  <View
                    style={[
                      styles.sliderTrack,
                      { backgroundColor: theme.colors.backgroundSecondary },
                    ]}
                  >
                    <View
                      style={{
                        width: `${Math.min((whatIfMonthly / Math.max(goal.target_amount * 0.1, whatIfMonthly * 2)) * 100, 100)}%`,
                        height: "100%",
                        backgroundColor: theme.colors.success,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                </View>
              </View>

              <View style={{ paddingHorizontal: 4, marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <Pressable
                      key={pct}
                      onPress={() => setWhatIfMonthly(Math.round(goal.target_amount * pct / 100))}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: whatIfMonthly === Math.round(goal.target_amount * pct / 100) ? theme.colors.success : theme.colors.backgroundSecondary,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "700",
                          color: whatIfMonthly === Math.round(goal.target_amount * pct / 100) ? "#ffffff" : theme.colors.textSecondary,
                        }}
                      >
                        {pct === 0 ? "0" : `${pct}%`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={{ fontSize: 10, color: theme.colors.textTertiary, textAlign: "center", marginTop: 2 }}>
                  Quick presets (% of target)
                </Text>
              </View>

              <View style={[styles.sliderRow, { marginBottom: 0 }]}>
                <View style={[styles.sliderIcon, { backgroundColor: `${theme.colors.info}18` }]}>
                  <MaterialCommunityIcons name="trending-up" size={22} color={theme.colors.info} />
                </View>
                <View style={styles.sliderContent}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <Text style={styles.sliderLabel}>Return Rate</Text>
                    <Text style={[styles.sliderValue, { color: theme.colors.info }]}>{whatIfReturn}%</Text>
                  </View>
                  <View
                    style={[
                      styles.sliderTrack,
                      { backgroundColor: theme.colors.backgroundSecondary },
                    ]}
                  >
                    <View
                      style={{
                        width: `${Math.min(whatIfReturn / 20 * 100, 100)}%`,
                        height: "100%",
                        backgroundColor: theme.colors.info,
                        borderRadius: 3,
                      }}
                    />
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                    {[0, 4, 8, 12, 16, 20].map((v) => (
                      <Pressable
                        key={v}
                        onPress={() => setWhatIfReturn(v)}
                        style={{ alignItems: "center", padding: 2 }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: whatIfReturn === v ? "700" : "500",
                            color: whatIfReturn === v ? theme.colors.info : theme.colors.textTertiary,
                          }}
                        >
                          {v}%
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {projection && displayProjection && projection.monthsToGoal && displayProjection.monthsToGoal && (
              <View
                style={[
                  styles.whatIfCard,
                  {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 16,
                  },
                ]}
              >
                <LinearGradient
                  colors={[`${color}25`, `${color}08`]}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialCommunityIcons name="clock-fast" size={26} color={color} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sliderLabel}>Impact of Current Settings</Text>
                  <View style={{ flexDirection: "row", gap: 20, marginTop: 6 }}>
                    <View>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>With defaults</Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                        {projection.completionMonth || "—"}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 11, color: theme.colors.textSecondary }}>With adjustments</Text>
                      <Text style={{ fontSize: 16, fontWeight: "700", color }}>
                        {displayProjection.completionMonth || "—"}
                      </Text>
                    </View>
                  </View>
                  {projection.monthsToGoal !== displayProjection.monthsToGoal && (
                    <View
                      style={[
                        styles.impactBadge,
                        {
                          backgroundColor: (displayProjection.monthsToGoal || 0) < (projection.monthsToGoal || 0)
                            ? `${theme.colors.success}20`
                            : `${theme.colors.warning}20`,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={(displayProjection.monthsToGoal || 0) < (projection.monthsToGoal || 0) ? "arrow-down" : "arrow-up"}
                        size={14}
                        color={(displayProjection.monthsToGoal || 0) < (projection.monthsToGoal || 0) ? theme.colors.success : theme.colors.warning}
                      />
                      <Text
                        style={[
                          styles.impactText,
                          {
                            color: (displayProjection.monthsToGoal || 0) < (projection.monthsToGoal || 0) ? theme.colors.success : theme.colors.warning,
                          },
                        ]}
                      >
                        {Math.abs((displayProjection.monthsToGoal || 0) - (projection.monthsToGoal || 0))} months
                        {(displayProjection.monthsToGoal || 0) < (projection.monthsToGoal || 0) ? " sooner" : " later"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </Animated.View>

          {/* Actions */}
          <Animated.View
            entering={FadeInDown.delay(600).springify()}
            style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: insets.bottom + 36, gap: 8 }}
          >
            <Pressable
              onPress={() => router.push("/(tabs)/portfolio/vision/scenarios")}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
                backgroundColor: theme.colors.backgroundSecondary,
              })}
            >
              <MaterialCommunityIcons name="compare" size={20} color={theme.colors.text} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.colors.text }}>
                Manage Scenarios
              </Text>
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
                backgroundColor: `${theme.colors.error}10`,
              })}
            >
              <MaterialCommunityIcons name="delete-outline" size={20} color={theme.colors.error} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.colors.error }}>
                Delete Goal
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
