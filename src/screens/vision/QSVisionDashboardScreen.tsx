import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QSHeader } from "../../components/QSHeader";
import { VisionTimeline } from "../../components/vision/VisionTimeline";
import { useAuth } from "../../context/AuthContext";
import { ForecastMonth, useMonthlyPlans } from "../../hooks/useMonthlyPlans";
import {
  CashflowEstimate,
  VisionPlan,
  VISION_PLAN_META,
  useFutureVision,
} from "../../hooks/useFutureVision";
import { createStyles } from "../../styles/vision/QSVision.styles";
import { useTheme } from "../../theme/ThemeContext";
import { formatCurrency, formatCurrencyCompact } from "../../utils/format";

function cleanNumber(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function formatMonthLabel(month: string): string {
  const [year, monthIndex] = month.split("-").map(Number);
  return format(new Date(year, monthIndex - 1, 1), "MMM yyyy");
}

export default function QSVisionDashboardScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const {
    getVisionPlans,
    getCashflowEstimate,
    saveCashflowOverrides,
    projectVisionPlan,
  } = useFutureVision();
  const { getForecast } = useMonthlyPlans();

  const [plans, setPlans] = useState<VisionPlan[]>([]);
  const [cashflow, setCashflow] = useState<CashflowEstimate | null>(null);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editingCashflow, setEditingCashflow] = useState(false);
  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    const [visionPlans, estimate, futureForecast] = await Promise.all([
      getVisionPlans(user.id),
      getCashflowEstimate(user.id),
      getForecast(user.id, 4),
    ]);
    setPlans(visionPlans);
    setCashflow(estimate);
    setIncomeInput(String(Math.max(0, estimate.monthlyIncome)));
    setExpenseInput(String(Math.max(0, estimate.monthlyExpense)));
    setForecast(futureForecast);
  }, [getCashflowEstimate, getForecast, getVisionPlans, user]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => {
      void loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const monthlyIncome = parseFloat(incomeInput) || 0;
  const monthlyExpense = parseFloat(expenseInput) || 0;
  const monthlySurplus = monthlyIncome - monthlyExpense;
  const committedMonthly = plans
    .filter((p) => p.status === "active")
    .reduce((sum, p) => sum + (p.monthly_allocation || 0), 0);
  const freeCapacity = monthlySurplus - committedMonthly;

  const timelinePlans = useMemo(() => {
    return plans
      .filter((p) => p.status === "active")
      .map((plan) => {
        const projection = projectVisionPlan(plan);
        const meta = VISION_PLAN_META[plan.plan_type];
        return {
          id: plan.id,
          name: plan.title,
          goalType: plan.plan_type,
          targetAmount: plan.target_amount,
          projectedDate: projection.completionMonth || (plan.target_date ? formatMonthLabel(plan.target_date.slice(0, 7)) : "No date"),
          progress: plan.target_amount > 0 ? (plan.current_amount / plan.target_amount) * 100 : 0,
          color: plan.color || meta.color,
        };
      });
  }, [plans, projectVisionPlan]);

  const pressureItems = forecast
    .flatMap((month) => month.items.map((item) => ({ ...item, month: month.month })))
    .filter((item) => item.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  const saveCashflow = async () => {
    if (!user) return;
    const ok = await saveCashflowOverrides(user.id, monthlyIncome, monthlyExpense);
    if (!ok) {
      Alert.alert("Could not save cashflow", "Please try again.");
      return;
    }
    setEditingCashflow(false);
    await loadData();
  };

  const renderPortfolioAction = () => (
    <Pressable
      onPress={() => router.push("/(tabs)/portfolio")}
      style={({ pressed }) => [styles.portfolioBackPill, pressed && { opacity: 0.75 }]}
    >
      <MaterialCommunityIcons name="briefcase-variant-outline" size={16} color={theme.colors.primary} />
      <Text style={[styles.portfolioBackText, { color: theme.colors.primary }]}>Portfolio</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(160, insets.bottom + 150) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(50)}>
          <QSHeader
            title="Future Vision"
            subtitle="Plan what comes next"
            rightElement={renderPortfolioAction()}
          />
        </Animated.View>

        {/* Surplus Hero */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.commandHero}>
          <View style={styles.commandHeroTop}>
            <View>
              <Text style={styles.visionEyebrow}>
                {cashflow?.source === "manual" ? "Manual cashflow" : "Estimated cashflow"} · {cashflow?.confidence || "low"} confidence
              </Text>
              <Text style={styles.commandHeroValue}>{formatCurrency(monthlySurplus)}</Text>
              <Text style={styles.commandHeroCaption}>projected monthly surplus</Text>
            </View>
            <Pressable
              onPress={() => setEditingCashflow((v) => !v)}
              style={({ pressed }) => [styles.heroIconButton, pressed && { opacity: 0.75 }]}
            >
              <MaterialCommunityIcons name={editingCashflow ? "check" : "pencil"} size={22} color={theme.colors.primary} />
            </Pressable>
          </View>

          <View style={styles.cashflowGrid}>
            <View style={styles.cashflowTile}>
              <Text style={styles.cashflowLabel}>Income</Text>
              {editingCashflow ? (
                <TextInput
                  value={incomeInput}
                  onChangeText={(t) => setIncomeInput(cleanNumber(t))}
                  keyboardType="numeric"
                  style={styles.cashflowInput}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              ) : (
                <Text style={[styles.cashflowValue, { color: theme.colors.success }]}>
                  +{formatCurrencyCompact(monthlyIncome)}
                </Text>
              )}
            </View>
            <View style={styles.cashflowTile}>
              <Text style={styles.cashflowLabel}>Expense</Text>
              {editingCashflow ? (
                <TextInput
                  value={expenseInput}
                  onChangeText={(t) => setExpenseInput(cleanNumber(t))}
                  keyboardType="numeric"
                  style={styles.cashflowInput}
                  placeholder="0"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              ) : (
                <Text style={[styles.cashflowValue, { color: theme.colors.error }]}>
                  -{formatCurrencyCompact(monthlyExpense)}
                </Text>
              )}
            </View>
            <View style={styles.cashflowTile}>
              <Text style={styles.cashflowLabel}>Committed</Text>
              <Text style={styles.cashflowValue}>{formatCurrencyCompact(committedMonthly)}</Text>
            </View>
          </View>

          {editingCashflow && (
            <Pressable
              onPress={saveCashflow}
              style={({ pressed }) => [styles.saveCashflowButton, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.saveCashflowText}>Save cashflow assumptions</Text>
            </Pressable>
          )}
        </Animated.View>

        {/* Capacity Strip */}
        <Animated.View entering={FadeInDown.delay(150)} style={styles.capacityStrip}>
          <View>
            <Text style={styles.capacityStripLabel}>Free capacity after plans</Text>
            <Animated.Text
              entering={FadeInUp.duration(400)}
              style={[styles.capacityStripValue, { color: freeCapacity >= 0 ? theme.colors.success : theme.colors.error }]}
            >
              {formatCurrency(freeCapacity)}
            </Animated.Text>
          </View>
          <View style={[styles.capacityBadge, { backgroundColor: freeCapacity >= 0 ? `${theme.colors.success}18` : `${theme.colors.error}18` }]}>
            <MaterialCommunityIcons
              name={freeCapacity >= 0 ? "trending-up" : "alert-circle-outline"}
              size={20}
              color={freeCapacity >= 0 ? theme.colors.success : theme.colors.error}
            />
            <Text style={[styles.capacityBadgeText, { color: freeCapacity >= 0 ? theme.colors.success : theme.colors.error }]}>
              {freeCapacity >= 0 ? "Room to plan" : "Overcommitted"}
            </Text>
          </View>
        </Animated.View>

        {/* Plans Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Plans ({plans.length})</Text>
          <Pressable onPress={() => router.push("/(tabs)/portfolio/vision/create-goal")} style={styles.sectionLink}>
            <Text style={[styles.sectionLinkText, { color: theme.colors.primary }]}>New</Text>
            <MaterialCommunityIcons name="plus" size={16} color={theme.colors.primary} />
          </Pressable>
        </View>

        {plans.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(200)} style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons name="telescope" size={64} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No future plans yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a goal, future expense, buffer, debt payoff, or small wish to start shaping the next few months.
            </Text>
          </Animated.View>
        ) : (
          plans.map((plan, idx) => {
            const meta = VISION_PLAN_META[plan.plan_type];
            const color = plan.color || meta.color;
            const progress = plan.target_amount > 0 ? Math.min((plan.current_amount / plan.target_amount) * 100, 100) : 0;
            const projection = projectVisionPlan(plan);
            return (
              <Animated.View key={plan.id} entering={FadeInDown.delay(200 + idx * 70)}>
                <Pressable
                  onPress={() => {
                    if (plan.linked_savings_id) router.push(`/(tabs)/portfolio/vision/goal/${plan.linked_savings_id}`);
                  }}
                  style={({ pressed }) => [styles.visionPlanCard, pressed && { opacity: 0.92 }]}
                >
                  <View style={styles.goalCardHeader}>
                    <LinearGradient
                      colors={[`${color}20`, `${color}08`]}
                      style={styles.goalIconWrap}
                    >
                      <MaterialCommunityIcons name={(plan.icon || meta.icon) as any} size={26} color={color} />
                    </LinearGradient>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalName} numberOfLines={1}>{plan.title}</Text>
                      <Text style={styles.goalMeta}>
                        {meta.shortLabel} · {formatCurrencyCompact(plan.target_amount)}
                        {projection.completionMonth ? ` · ${projection.completionMonth}` : ""}
                      </Text>
                    </View>
                    <Text style={[styles.planMonthlyPill, { color, backgroundColor: `${color}12` }]}>
                      {formatCurrencyCompact(plan.monthly_allocation)}/mo
                    </Text>
                  </View>
                  <View style={styles.planProgressTrack}>
                    <View style={[styles.planProgressFill, { width: `${progress}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.planCardFooter}>
                    <Text style={styles.statLabel}>{Math.round(progress)}% funded</Text>
                    <Text style={styles.statLabel}>{projection.onTrack ? "On track" : "Needs more monthly room"}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })
        )}

        {/* Timeline */}
        {timelinePlans.length > 0 && (
          <Animated.View entering={FadeInDown.delay(250)}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <VisionTimeline goals={timelinePlans} now={format(new Date(), "MMM yyyy")} />
          </Animated.View>
        )}

        {/* Upcoming Pressure */}
        <Text style={styles.sectionTitle}>Upcoming Pressure</Text>
        <Animated.View entering={FadeInDown.delay(300)} style={styles.pressureCard}>
          {pressureItems.length === 0 ? (
            <Text style={styles.emptyInlineText}>No upcoming expenses found in the next forecast window.</Text>
          ) : (
            pressureItems.map((item, i) => (
              <Animated.View
                key={`${item.month}-${item.label}-${item.amount}`}
                entering={FadeInDown.delay(320 + i * 50)}
                style={[styles.pressureRow, i < pressureItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.divider }]}
              >
                <View style={styles.pressureIcon}>
                  <MaterialCommunityIcons name="calendar-alert" size={20} color={theme.colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pressureTitle} numberOfLines={1}>{item.label}</Text>
                  <Text style={styles.pressureMeta}>{formatMonthLabel(item.month)}</Text>
                </View>
                <Text style={styles.pressureAmount}>{formatCurrencyCompact(item.amount)}</Text>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* What-if Capacity */}
        <Text style={styles.sectionTitle}>What-if Capacity</Text>
        <View style={styles.whatIfPanel}>
          <View style={styles.whatIfMetric}>
            <Text style={styles.whatIfNumber}>{plans.length || 0}</Text>
            <Text style={styles.whatIfLabel}>Active plans</Text>
          </View>
          <View style={styles.whatIfMetric}>
            <Text style={styles.whatIfNumber}>{formatCurrencyCompact(committedMonthly)}</Text>
            <Text style={styles.whatIfLabel}>Monthly committed</Text>
          </View>
          <View style={styles.whatIfMetric}>
            <Text style={styles.whatIfNumber}>{formatCurrencyCompact(Math.max(0, freeCapacity))}</Text>
            <Text style={styles.whatIfLabel}>Still flexible</Text>
          </View>
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(tabs)/portfolio/vision/create-goal")}
        style={({ pressed }) => [
          styles.visionActionPill,
          {
            bottom: insets.bottom + 88,
            backgroundColor: theme.colors.primary,
            opacity: pressed ? 0.92 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
        <Text style={styles.visionActionText}>New Plan</Text>
      </Pressable>
    </View>
  );
}