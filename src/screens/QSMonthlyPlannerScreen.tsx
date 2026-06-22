import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { PieChart } from "react-native-gifted-charts";
import { QSButton } from "../components/QSButton";
import { QSHeader } from "../components/QSHeader";
import { QSMonthSelector } from "../components/QSMonthSelector";
import { QSTabbedSection } from "../components/QSTabbedSection";
import { useAuth } from "../context/AuthContext";
import {
  ForecastMonth,
  PlanItem,
  PlanVsActual,
  useMonthlyPlans,
} from "../hooks/useMonthlyPlans";
import { createStyles } from "../styles/QSMonthlyPlanner.styles";
import { useTheme } from "../theme/ThemeContext";

type PlannerTab = "plan" | "forecast" | "analytics" | "settle";

const TABS = [
  { key: "plan", label: "Plan" },
  { key: "forecast", label: "Forecast" },
  { key: "analytics", label: "Analytics" },
  { key: "settle", label: "Settle" },
];

const formatCurrency = (amount: number) =>
  `₹${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const formatCurrencyCompact = (amount: number) => {
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
  return `₹${amount}`;
};

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getPastMonths = (count: number): string[] => {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d));
  }
  return months;
};

export default function QSMonthlyPlannerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const {
    getOrCreatePlan,
    getPlanItems,
    addManualItem,
    updateItem,
    deleteItem,
    settleItem,
    getForecast,
    getPlanVsActual,
    getPlanVsActualBatch,
    getPlansByUser,
  } = useMonthlyPlans();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<PlannerTab>("plan");
  const [plan, setPlan] = useState<any>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [forecast, setForecast] = useState<ForecastMonth[]>([]);
  const [analyticsData, setAnalyticsData] = useState<{
    planVsActual: PlanVsActual | null;
    pastPlans: any[];
    history: PlanVsActual[];
  }>({ planVsActual: null, pastPlans: [], history: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

  // Edit state
  const [editingItem, setEditingItem] = useState<PlanItem | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Simulator state
  const [simAdjustments, setSimAdjustments] = useState<Record<string, number>>({});
  const [simEnabled, setSimEnabled] = useState(false);

  const monthKey = getMonthKey(currentMonth);

  const loadPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await getOrCreatePlan(user.id, monthKey);
      setPlan(p);
      if (p) {
        const planItems = await getPlanItems(p.id);
        setItems(planItems);
      }
    } finally {
      setLoading(false);
    }
  }, [user, monthKey, getOrCreatePlan, getPlanItems]);

  const loadForecast = useCallback(async () => {
    if (!user) return;
    const data = await getForecast(user.id, 6);
    setForecast(data);
  }, [user, getForecast]);

  const loadAnalytics = useCallback(async () => {
    if (!user) return;
    const planVsActual = await getPlanVsActual(user.id, monthKey);
    const pastPlans = await getPlansByUser(user.id);
    const pastMonths = getPastMonths(6);
    const history = await getPlanVsActualBatch(user.id, pastMonths);
    setAnalyticsData({ planVsActual, pastPlans, history });
  }, [user, monthKey, getPlanVsActual, getPlanVsActualBatch, getPlansByUser]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  useEffect(() => {
    if (activeTab === "forecast") loadForecast();
    if (activeTab === "analytics") loadAnalytics();
  }, [activeTab, loadForecast, loadAnalytics]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPlan();
    setRefreshing(false);
  };

  const handlePrevMonth = () => {
    setSimAdjustments({});
    setSimEnabled(false);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setSimAdjustments({});
    setSimEnabled(false);
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleAddManualItem = async (type: "income" | "expense") => {
    if (!plan || !newItemLabel.trim() || !newItemAmount) return;
    const amount = parseFloat(newItemAmount);
    if (isNaN(amount) || amount <= 0) return;

    await addManualItem(plan.id, {
      label: newItemLabel.trim(),
      type,
      amount,
    });
    setNewItemLabel("");
    setNewItemAmount("");
    setShowAddIncome(false);
    setShowAddExpense(false);
    await loadPlan();
  };

  const openEditItem = (item: PlanItem) => {
    setEditingItem(item);
    setEditLabel(item.label);
    setEditAmount(String(item.amount));
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editLabel.trim() || !editAmount) return;
    const amount = parseFloat(editAmount);
    if (isNaN(amount) || amount <= 0) return;

    const updates: any = { label: editLabel.trim(), amount };
    // If editing an auto-generated item, switch to manual so edits persist
    if (editingItem.source_type !== "manual") {
      updates.source_type = "manual";
    }

    const ok = await updateItem(editingItem.id, updates);
    if (ok) {
      setShowEditModal(false);
      setEditingItem(null);
      await loadPlan();
    }
  };

  const handleDeleteItem = (item: PlanItem) => {
    const isAuto = item.source_type !== "manual";
    const warning = isAuto
      ? "This removes the plan entry only. It won't affect the original bill, recurring config, or savings goal."
      : "Delete this manual entry?";

    Alert.alert("Delete Item", `Remove "${item.label}"?\n\n${warning}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteItem(item.id);
          if (ok) await loadPlan();
        },
      },
    ]);
  };

  const handleSettleItem = async (item: PlanItem) => {
    Alert.alert(
      `Settle: ${item.label}`,
      `Amount: ${formatCurrency(item.amount)}\n\nMark this as paid? You can add a transaction separately.`,
      [
        {
          text: "Mark as paid",
          onPress: async () => {
            await settleItem(item.id);
            await loadPlan();
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const incomeItems = items.filter((i) => i.type === "income");
  const expenseItems = items.filter((i) => i.type === "expense");
  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = expenseItems.reduce((s, i) => s + i.amount, 0);
  const surplus = totalIncome - totalExpenses;

  const billItems = expenseItems.filter(
    (i) => i.source_type === "bill" || i.source_type === "loan",
  );
  const totalBills = billItems.reduce((s, i) => s + i.amount, 0);
  const manualExpenses = expenseItems.filter(
    (i) => i.source_type === "manual",
  );
  const savingsItems = expenseItems.filter(
    (i) => i.source_type === "savings",
  );

  const pendingItems = items.filter((i) => i.status === "pending" && i.type === "expense");
  const settledItems = items.filter((i) => i.status !== "pending");
  const totalDue = pendingItems.reduce((s, i) => s + i.amount, 0);
  const totalSettled = settledItems.reduce((s, i) => s + i.amount, 0);
  const settleProgress = totalDue + totalSettled > 0
    ? (totalSettled / (totalDue + totalSettled)) * 100
    : 0;

  const renderAddItemInput = (
    type: "income" | "expense",
    visible: boolean,
    onClose: () => void,
  ) => {
    if (!visible) return null;
    return (
      <Animated.View entering={FadeInDown.duration(300)} style={styles.inputCard}>
        <TextInput
          placeholder={type === "income" ? "Income source (e.g. Bonus)" : "Expense category (e.g. Groceries)"}
          placeholderTextColor={theme.colors.textTertiary}
          value={newItemLabel}
          onChangeText={setNewItemLabel}
          style={styles.inputField}
        />
        <TextInput
          placeholder="Amount"
          placeholderTextColor={theme.colors.textTertiary}
          value={newItemAmount}
          onChangeText={setNewItemAmount}
          keyboardType="numeric"
          style={styles.inputField}
        />
        <View style={styles.inputActions}>
          <QSButton
            title="Cancel"
            onPress={() => {
              onClose();
              setNewItemLabel("");
              setNewItemAmount("");
            }}
            variant="secondary"
            style={{ flex: 1 }}
          />
          <QSButton
            title="Add"
            onPress={() => handleAddManualItem(type)}
            style={{ flex: 1 }}
          />
        </View>
      </Animated.View>
    );
  };

  const renderSection = (
    title: string,
    total: number,
    items: PlanItem[],
    type: "income" | "expense",
    showAdd?: boolean,
    onAddPress?: () => void,
  ) => {
    const color = type === "income" ? "#22C55E" : theme.colors.error;
    return (
      <Animated.View entering={FadeInUp.duration(400).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {title} ({items.length})
          </Text>
          <Text style={[styles.sectionTotal, { color }]}>
            {type === "expense" ? "- " : "+ "}
            {formatCurrency(total)}
          </Text>
        </View>
        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View
              style={[
                styles.itemIcon,
                { backgroundColor: `${color}18` },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  item.source_type === "bill"
                    ? "file-document-outline"
                    : item.source_type === "loan"
                      ? "bank"
                      : item.source_type === "savings"
                        ? "piggy-bank-outline"
                        : item.source_type === "recurring"
                          ? "calendar-repeat"
                          : type === "income"
                            ? "cash-plus"
                            : "cash-minus"
                }
                size={20}
                color={color}
              />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Text style={styles.itemSubtext}>
                {item.source_type === "manual" ? "Manual entry" : `From ${item.source_type}`}
                {item.due_date
                  ? ` • Due: ${new Date(item.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                  : ""}
              </Text>
            </View>
            <Text style={[styles.itemAmount, { color, marginRight: 4 }]}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={styles.itemActions}>
              <Pressable
                onPress={() => openEditItem(item)}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.textSecondary} />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteItem(item)}
                style={{ padding: 4 }}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={16} color={theme.colors.error} />
              </Pressable>
            </View>
          </View>
        ))}
        {showAdd && (
          <Pressable style={styles.addButton} onPress={onAddPress}>
            <MaterialCommunityIcons
              name="plus-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.addButtonText}>
              Add {type === "income" ? "Income" : "Expense"}
            </Text>
          </Pressable>
        )}
      </Animated.View>
    );
  };

  const renderSummaryCard = () => (
    <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Expected Income</Text>
        <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
          +{formatCurrency(totalIncome)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Expected Expenses</Text>
        <Text style={[styles.summaryAmount, { color: theme.colors.error }]}>
          -{formatCurrency(totalExpenses)}
        </Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryRow}>
        <Text
          style={[
            styles.surplusAmount,
            { color: surplus >= 0 ? "#22C55E" : theme.colors.error },
          ]}
        >
          {surplus >= 0 ? "+" : ""}
          {formatCurrency(surplus)}
        </Text>
        <Text style={styles.summaryLabel}>
          {surplus >= 0 ? "Surplus" : "Deficit"}
        </Text>
      </View>
      <View style={[styles.summaryRow, { marginTop: theme.spacing.s }]}>
        <Text style={styles.summaryLabel}>After Bills</Text>
        <Text
          style={[
            styles.summaryAmount,
            { color: totalIncome - totalBills >= 0 ? "#22C55E" : theme.colors.error },
          ]}
        >
          {formatCurrency(totalIncome - totalBills)}
        </Text>
      </View>
    </Animated.View>
  );

  const renderPlanTab = () => {
    if (loading && items.length === 0) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 100 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.m }}>
            Building your plan...
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {renderSummaryCard()}
        {renderAddItemInput("income", showAddIncome, () => setShowAddIncome(false))}
        {renderSection(
          "Expected Income",
          totalIncome,
          incomeItems,
          "income",
          true,
          () => setShowAddIncome(true),
        )}
        {renderAddItemInput("expense", showAddExpense, () => setShowAddExpense(false))}
        {renderSection(
          "Bills & EMIs",
          totalBills,
          billItems,
          "expense",
        )}
        {renderSection(
          "Expected Expenses",
          manualExpenses.reduce((s, i) => s + i.amount, 0),
          manualExpenses,
          "expense",
          true,
          () => setShowAddExpense(true),
        )}
        {savingsItems.length > 0 &&
          renderSection(
            "Savings",
            savingsItems.reduce((s, i) => s + i.amount, 0),
            savingsItems,
            "expense",
          )}
      </ScrollView>
    );
  };

  // ---------- Simulator logic ----------

  const getSimulatedTotal = (type: "income" | "expense") => {
    const pool = type === "income" ? incomeItems : expenseItems;
    return pool.reduce((sum, item) => {
      const adj = simAdjustments[item.id];
      return sum + (adj !== undefined ? adj : item.amount);
    }, 0);
  };

  const simIncome = getSimulatedTotal("income");
  const simExpenses = getSimulatedTotal("expense");
  const simSurplus = simIncome - simExpenses;

  const generateSuggestions = (): string[] => {
    const suggestions: string[] = [];
    const actualSurplus = totalIncome - totalExpenses;
    const income = totalIncome || 1;
    const expensePct = (totalExpenses / income) * 100;
    const savingsPct = (savingsItems.reduce((s, i) => s + i.amount, 0) / income) * 100;

    if (simSurplus < 0 && actualSurplus >= 0) {
      suggestions.push("Your simulated changes create a deficit. Consider smaller adjustments.");
    }
    if (simSurplus >= 0 && actualSurplus < 0) {
      suggestions.push("Your changes turn a deficit into a surplus — great improvement!");
    }
    if (expensePct > 50) {
      const topExpense = [...expenseItems].sort((a, b) => b.amount - a.amount)[0];
      if (topExpense) {
        const reduction = Math.round(topExpense.amount * 0.1);
        suggestions.push(`Reducing "${topExpense.label}" by 10% saves ${formatCurrency(reduction)}/month.`);
      }
    }
    if (savingsPct < 20) {
      const target = Math.round(income * 0.2);
      const current = savingsItems.reduce((s, i) => s + i.amount, 0);
      const gap = target - current;
      if (gap > 0) suggestions.push(`Aim to save 20% of income (${formatCurrency(target)}). Increase savings by ${formatCurrency(gap)}.`);
    }
    if (simSurplus > 0 && simSurplus < income * 0.05) {
      suggestions.push("Your surplus is thin (<5% of income). Build a buffer by trimming discretionary expenses.");
    }
    if (simSurplus > income * 0.3) {
      suggestions.push("Healthy surplus! Consider directing extra funds to savings or investments.");
    }
    if (suggestions.length === 0) {
      suggestions.push("Your current plan looks well-balanced. Keep tracking to stay on course.");
    }
    return suggestions;
  };

  const suggestions = generateSuggestions();

  const renderSimulator = () => {
    const simItems = [...incomeItems, ...expenseItems];

    return (
      <View>
        <View style={{ margin: theme.spacing.m }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: theme.typography.h3.fontSize, fontWeight: "700", color: theme.colors.text }}>
              What-If Simulator
            </Text>
            <Pressable
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: simEnabled ? theme.colors.primary : theme.colors.backgroundSecondary,
                borderWidth: 1,
                borderColor: simEnabled ? theme.colors.primary : theme.colors.border,
              }}
              onPress={() => {
                setSimEnabled(!simEnabled);
                if (!simEnabled) {
                  // Reset adjustments when enabling
                  setSimAdjustments({});
                }
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "700", color: simEnabled ? "#FFF" : theme.colors.textSecondary }}>
                {simEnabled ? "ON" : "OFF"}
              </Text>
            </Pressable>
          </View>
        </View>

        {simEnabled && (
          <>
            <View style={styles.simulatorCard}>
              <Text style={[styles.sectionTitle, { marginBottom: theme.spacing.s }]}>
                Adjust Amounts
              </Text>
              {simItems.map((item) => {
                const origAmount = item.amount;
                const adjAmount = simAdjustments[item.id] !== undefined ? simAdjustments[item.id] : origAmount;
                const isIncome = item.type === "income";
                const itemColor = isIncome ? "#22C55E" : theme.colors.error;

                return (
                  <View key={item.id} style={styles.simulatorRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.simulatorLabel} numberOfLines={1}>{item.label}</Text>
                      <Text style={{ fontSize: 11, color: theme.colors.textTertiary }}>
                        {isIncome ? "Income" : "Expense"}
                      </Text>
                    </View>
                    <View style={styles.simulatorStepper}>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => {
                          const newVal = Math.max(0, adjAmount - 500);
                          setSimAdjustments(prev => ({ ...prev, [item.id]: newVal }));
                        }}
                      >
                        <MaterialCommunityIcons name="minus" size={16} color={theme.colors.textSecondary} />
                      </Pressable>
                      <Text style={[styles.simulatorAmount, { color: itemColor }]}>
                        {formatCurrency(adjAmount)}
                      </Text>
                      <Pressable
                        style={styles.stepperBtn}
                        onPress={() => {
                          const newVal = adjAmount + 500;
                          setSimAdjustments(prev => ({ ...prev, [item.id]: newVal }));
                        }}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Before vs After */}
            <View style={styles.comparisonCard}>
              <Text style={{ fontSize: 13, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, color: theme.colors.textSecondary, marginBottom: theme.spacing.s }}>
                Before vs After
              </Text>
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Original Surplus</Text>
                <Text style={[styles.comparisonValue, { color: surplus >= 0 ? "#22C55E" : theme.colors.error }]}>
                  {surplus >= 0 ? "+" : ""}{formatCurrency(surplus)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { marginVertical: 4 }]} />
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Simulated Surplus</Text>
                <Text style={[styles.comparisonValue, { color: simSurplus >= 0 ? "#22C55E" : theme.colors.error }]}>
                  {simSurplus >= 0 ? "+" : ""}{formatCurrency(simSurplus)}
                </Text>
              </View>
              <View style={[styles.summaryDivider, { marginVertical: 4 }]} />
              <View style={styles.comparisonRow}>
                <Text style={styles.comparisonLabel}>Improvement</Text>
                <Text style={[styles.comparisonValue, { color: simSurplus - surplus >= 0 ? "#22C55E" : theme.colors.error }]}>
                  {simSurplus - surplus >= 0 ? "+" : ""}{formatCurrency(simSurplus - surplus)}
                </Text>
              </View>
            </View>

            {/* Suggestions */}
            <View style={styles.suggestionCard}>
              <Text style={styles.suggestionTitle}>Suggestions</Text>
              {suggestions.map((s, i) => (
                <View key={i} style={styles.suggestionItem}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={theme.colors.primary} style={{ marginTop: 1 }} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!simEnabled && (
          <View style={[styles.analyticsCard, { alignItems: "center", paddingVertical: 24 }]}>
            <MaterialCommunityIcons name="tune-variant" size={40} color={theme.colors.textTertiary} />
            <Text style={[styles.emptyText, { marginTop: 8 }]}>
              Toggle the switch above to adjust income & expense amounts and see how changes affect your budget.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderForecastTab = () => {
    if (forecast.length === 0) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    const cumulative = forecast.reduce((acc, m) => acc + m.surplus, 0);

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        <View style={{ margin: theme.spacing.m }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: theme.spacing.s,
            }}
          >
            <Text
              style={{
                fontSize: theme.typography.h3.fontSize,
                fontWeight: "700",
                color: theme.colors.text,
              }}
            >
              6-Month Forecast
            </Text>
            <Text
              style={{
                fontSize: theme.typography.body.fontSize,
                fontWeight: "600",
                color: cumulative >= 0 ? "#22C55E" : theme.colors.error,
              }}
            >
              Cumulative: {formatCurrency(cumulative)}
            </Text>
          </View>
        </View>

        {forecast.map((fm) => {
          const fmDate = new Date(fm.month + "-01");
          const monthLabel = fmDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          const isDeficit = fm.surplus < 0;

          return (
            <View key={fm.month} style={styles.forecastCard}>
              <Text style={styles.forecastMonth}>{monthLabel}</Text>
              <View style={styles.forecastRow}>
                <Text style={styles.forecastLabel}>Income</Text>
                <Text style={[styles.forecastAmount, { color: "#22C55E" }]}>
                  +{formatCurrency(fm.income)}
                </Text>
              </View>
              <View style={styles.forecastRow}>
                <Text style={styles.forecastLabel}>Bills</Text>
                <Text style={[styles.forecastAmount, { color: theme.colors.error }]}>
                  -{formatCurrency(fm.bills)}
                </Text>
              </View>
              <View style={styles.forecastRow}>
                <Text style={styles.forecastLabel}>EMIs</Text>
                <Text style={[styles.forecastAmount, { color: theme.colors.error }]}>
                  -{formatCurrency(fm.emis)}
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: `${theme.colors.textTertiary}30`,
                  marginVertical: theme.spacing.s,
                }}
              />
              <View style={styles.forecastRow}>
                <Text
                  style={{
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: "700",
                    color: theme.colors.text,
                  }}
                >
                  Surplus
                </Text>
                <Text
                  style={{
                    fontSize: theme.typography.body.fontSize,
                    fontWeight: "700",
                    color: isDeficit ? theme.colors.error : "#22C55E",
                  }}
                >
                  {isDeficit ? "" : "+"}
                  {formatCurrency(fm.surplus)}
                </Text>
              </View>
              {isDeficit && (
                <View style={[styles.deficitWarning, { backgroundColor: `${theme.colors.error}15` }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.colors.error} />
                  <Text style={[styles.deficitWarningText, { color: theme.colors.error }]}>
                    Projected deficit — review spending or increase income
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Simulator integrated in Forecast tab */}
        {renderSimulator()}
      </ScrollView>
    );
  };

  const renderPlanVsActualDonut = (pva: PlanVsActual) => {
    const plannedTotal = pva.plannedIncome + Math.abs(pva.plannedExpenses);
    const actualTotal = pva.actualIncome + Math.abs(pva.actualExpenses);

    if (plannedTotal === 0 && actualTotal === 0) return null;

    const pieData = [
      {
        value: plannedTotal || 1,
        color: theme.colors.primary,
        text: "Expected",
      },
      {
        value: actualTotal || 1,
        color: theme.colors.error,
        text: "Actual",
      },
    ];

    return (
      <View style={styles.donutContainer}>
        <Text style={styles.donutTitle}>Expected vs Actual</Text>
        <PieChart
          donut
          sectionAutoFocus
          isAnimated
          animationDuration={900}
          radius={70}
          innerRadius={45}
          innerCircleColor={theme.colors.card}
          data={pieData}
          centerLabelComponent={() => (
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text style={{ fontSize: 14, fontWeight: "bold", color: theme.colors.text }}>
                {plannedTotal > 0 && actualTotal > 0
                  ? `${Math.round((Math.min(plannedTotal, actualTotal) / Math.max(plannedTotal, actualTotal)) * 100)}%`
                  : "N/A"}
              </Text>
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary, marginTop: 2 }}>
                Match
              </Text>
            </View>
          )}
        />
        <View style={{ flexDirection: "row", gap: 24, marginTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.primary }} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Expected: {formatCurrency(plannedTotal)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.error }} />
            <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Actual: {formatCurrency(actualTotal)}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCategoryDonut = (pva: PlanVsActual) => {
    const cats = pva.categoryBreakdown;
    if (cats.length === 0) return null;
    const maxItems = 6;
    const topCats = cats.slice(0, maxItems);
    const otherPlanned = cats.slice(maxItems).reduce((s, c) => s + c.planned, 0);
    const otherActual = cats.slice(maxItems).reduce((s, c) => s + c.actual, 0);

    const plannedData = topCats.map((c) => ({
      value: c.planned || 1,
      color: c.categoryColor || theme.colors.primary,
      text: c.categoryName,
    }));
    if (otherPlanned > 0) {
      plannedData.push({ value: otherPlanned, color: theme.colors.textTertiary, text: "Other" });
    }

    const actualData = topCats.map((c) => ({
      value: c.actual || 1,
      color: c.categoryColor || theme.colors.error,
      text: c.categoryName,
    }));
    if (otherActual > 0) {
      actualData.push({ value: otherActual, color: theme.colors.textTertiary, text: "Other" });
    }

    if (plannedData.length === 0 && actualData.length === 0) return null;

    return (
      <View style={styles.donutContainer}>
        <Text style={styles.donutTitle}>Category: Expected vs Actual</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%" }}>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>Expected</Text>
            <PieChart
              donut
              isAnimated
              animationDuration={900}
              radius={50}
              innerRadius={32}
              innerCircleColor={theme.colors.card}
              data={plannedData}
              showText={false}
            />
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>Actual</Text>
            <PieChart
              donut
              isAnimated
              animationDuration={900}
              radius={50}
              innerRadius={32}
              innerCircleColor={theme.colors.card}
              data={actualData}
              showText={false}
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 16, justifyContent: "center" }}>
          {topCats.map((c) => (
            <View key={c.categoryId} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.categoryColor || theme.colors.primary }} />
              <Text style={{ fontSize: 10, color: theme.colors.textSecondary }}>{c.categoryName}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMultiMonthProjection = (history: PlanVsActual[]) => {
    if (history.length === 0) return null;
    const maxVal = Math.max(
      ...history.map((h) => Math.max(Math.abs(h.plannedIncome + Math.abs(h.plannedExpenses)), Math.abs(h.actualIncome + Math.abs(h.actualExpenses)))),
      1,
    );

    return (
      <View style={styles.projectionTable}>
        <Text style={styles.analyticsTitle}>Projection History</Text>
        <View style={styles.projectionHeader}>
          <Text style={[styles.projectionHeaderText, { flex: 1 }]}>Month</Text>
          <Text style={[styles.projectionHeaderText, { flex: 1, textAlign: "right" }]}>Planned</Text>
          <Text style={[styles.projectionHeaderText, { flex: 1, textAlign: "right" }]}>Actual</Text>
          <Text style={[styles.projectionHeaderText, { flex: 0.8, textAlign: "right" }]}>Accuracy</Text>
        </View>
        {history.map((h) => {
          const d = new Date(h.month + "-01");
          const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
          const plannedTotal = h.plannedIncome + Math.abs(h.plannedExpenses);
          const actualTotal = h.actualIncome + Math.abs(h.actualExpenses);
          const barWidth = Math.min((plannedTotal / maxVal) * 100, 100);
          const actualBarWidth = Math.min((actualTotal / maxVal) * 100, 100);
          const accuracy = h.estimationAccuracy;

          return (
            <View key={h.month} style={styles.projectionRow}>
              <Text style={[styles.projectionCell, { flex: 1 }]}>{label}</Text>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={styles.projectionBarTrack}>
                    <View style={[styles.projectionBarFill, { width: `${barWidth}%`, backgroundColor: `${theme.colors.primary}60` }]} />
                  </View>
                  <Text style={[styles.projectionCell, { fontSize: 11 }]}>{formatCurrencyCompact(plannedTotal)}</Text>
                </View>
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <View style={styles.projectionBarTrack}>
                    <View style={[styles.projectionBarFill, { width: `${actualBarWidth}%`, backgroundColor: theme.colors.error }]} />
                  </View>
                  <Text style={[styles.projectionCell, { fontSize: 11 }]}>{formatCurrencyCompact(actualTotal)}</Text>
                </View>
              </View>
              <Text style={[styles.projectionCell, { flex: 0.8, textAlign: "right", color: accuracy >= 80 ? "#22C55E" : accuracy >= 50 ? theme.colors.warning : theme.colors.error }]}>
                {accuracy.toFixed(0)}%
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAnalyticsTab = () => {
    const pva = analyticsData.planVsActual;
    const history = analyticsData.history;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        {pva ? (
          <>
            {/* Donut: Expected vs Actual */}
            {renderPlanVsActualDonut(pva)}

            {/* Plan vs Actual Summary */}
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Plan vs Actual</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Planned Income</Text>
                <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
                  +{formatCurrency(pva.plannedIncome)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Actual Income</Text>
                <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
                  +{formatCurrency(pva.actualIncome)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Planned Expenses</Text>
                <Text style={[styles.summaryAmount, { color: theme.colors.error }]}>
                  -{formatCurrency(pva.plannedExpenses)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Actual Expenses</Text>
                <Text style={[styles.summaryAmount, { color: theme.colors.error }]}>
                  -{formatCurrency(pva.actualExpenses)}
                </Text>
              </View>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Estimation Accuracy</Text>
              <Text
                style={[
                  styles.accuracyValue,
                  {
                    color:
                      pva.estimationAccuracy >= 80
                        ? "#22C55E"
                        : pva.estimationAccuracy >= 50
                          ? theme.colors.warning
                          : theme.colors.error,
                  },
                ]}
              >
                {pva.estimationAccuracy}%
              </Text>
              <Text style={styles.accuracyLabel}>
                How closely your plan matched reality
              </Text>
            </View>

            {/* Category Breakdown */}
            {pva.categoryBreakdown.length > 0 && (
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsTitle}>Category Breakdown</Text>
                {pva.categoryBreakdown.map((cat, idx) => {
                  const maxVal = Math.max(cat.planned, cat.actual, 1);
                  const plannedWidth = (cat.planned / maxVal) * 100;
                  const actualWidth = (cat.actual / maxVal) * 100;
                  return (
                    <View key={idx} style={{ marginBottom: theme.spacing.m }}>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{cat.categoryName}</Text>
                        <Text
                          style={{
                            fontSize: theme.typography.caption.fontSize,
                            fontWeight: "600",
                            color:
                              cat.variance > 0
                                ? theme.colors.error
                                : cat.variance < 0
                                  ? "#22C55E"
                                  : theme.colors.textSecondary,
                          }}
                        >
                          {cat.variance > 0 ? "+" : ""}
                          {formatCurrency(cat.variance)}
                        </Text>
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${plannedWidth}%`,
                              backgroundColor: `${theme.colors.primary}60`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            {
                              width: `${actualWidth}%`,
                              backgroundColor: theme.colors.error,
                            },
                          ]}
                        />
                      </View>
                      <View style={{ flexDirection: "row", gap: theme.spacing.l, marginTop: 4 }}>
                        <Text style={{ fontSize: 10, color: theme.colors.textTertiary }}>
                          ■ Plan: {formatCurrency(cat.planned)}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.colors.textTertiary }}>
                          ■ Actual: {formatCurrency(cat.actual)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Category Donut: Expected vs Actual */}
            {renderCategoryDonut(pva)}

            {/* Multi-month projection */}
            {renderMultiMonthProjection(history)}
          </>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="chart-bar"
              size={64}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyText}>
              No plan data for this month yet. Start planning to see analytics.
            </Text>
          </View>
        )}

        {analyticsData.pastPlans.length > 1 && (
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>Past Plans</Text>
            {analyticsData.pastPlans.slice(0, 6).map((p: any) => {
              const pDate = new Date(p.month + "-01");
              return (
                <View key={p.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    {pDate.toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </Text>
                  <Text style={styles.summaryAmount}>
                    {p.is_locked ? "Locked" : "Draft"}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderSettleTab = () => {
    const pendingExpenses = items.filter(
      (i) => i.status === "pending" && i.type === "expense",
    );
    const paidItems = items.filter((i) => i.status === "paid");

    if (pendingExpenses.length === 0 && paidItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={64}
            color={theme.colors.textTertiary}
          />
          <Text style={styles.emptyText}>
            No items to settle this month.
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.settlementProgress}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Settled</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalSettled)} / {formatCurrency(totalSettled + totalDue)}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(settleProgress, 100)}%`,
                  backgroundColor:
                    settleProgress >= 100 ? "#22C55E" : theme.colors.primary,
                },
              ]}
            />
          </View>
          <Text
            style={{
              fontSize: theme.typography.caption.fontSize,
              color: theme.colors.textSecondary,
              textAlign: "right",
            }}
          >
            {pendingExpenses.length} remaining
          </Text>
        </Animated.View>

        {pendingExpenses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Pending ({pendingExpenses.length})</Text>
            </View>
            {pendingExpenses.map((item) => (
              <Pressable
                key={item.id}
                style={styles.settlementItem}
                onPress={() => handleSettleItem(item)}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSubtext}>
                    {item.due_date
                      ? `Due: ${new Date(item.due_date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}`
                      : "No due date"}
                    {" • "}
                    {item.source_type}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.itemAmount,
                    { color: theme.colors.error, marginRight: theme.spacing.s },
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${theme.colors.warning}20` }]}>
                  <Text style={[styles.statusText, { color: theme.colors.warning }]}>
                    Pending
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {paidItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Paid ({paidItems.length})</Text>
            </View>
            {paidItems.map((item) => (
              <View key={item.id} style={[styles.settlementItem, { opacity: 0.6 }]}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemSubtext}>Settled</Text>
                </View>
                <Text
                  style={[
                    styles.itemAmount,
                    { color: "#22C55E", marginRight: theme.spacing.s },
                  ]}
                >
                  {formatCurrency(item.amount)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: `${"#22C55E"}20` }]}>
                  <Text style={[styles.statusText, { color: "#22C55E" }]}>Paid</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <QSHeader title="Monthly Planner" showBack onBackPress={() => router.back()} />
      <QSMonthSelector
        month={currentMonth}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />
      <QSTabbedSection
        tabs={TABS}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as PlannerTab)}
        variant="segmented"
      />
      {activeTab === "plan" && renderPlanTab()}
      {activeTab === "forecast" && renderForecastTab()}
      {activeTab === "analytics" && renderAnalyticsTab()}
      {activeTab === "settle" && renderSettleTab()}

      {/* Edit Item Modal */}
      <Modal transparent visible={showEditModal} animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <Pressable style={styles.editModalOverlay} onPress={() => setShowEditModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <Pressable
              style={styles.editModalContent}
              onPress={() => {}}
            >
              <Text style={styles.editModalTitle}>
                Edit {editingItem?.type === "income" ? "Income" : "Expense"}
              </Text>

              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Label
              </Text>
              <View style={styles.editFieldRow}>
                <View style={styles.editFieldIcon}>
                  <MaterialCommunityIcons name="label-outline" size={20} color={theme.colors.primary} />
                </View>
                <TextInput
                  style={styles.editFieldInput}
                  value={editLabel}
                  onChangeText={setEditLabel}
                  placeholder="Item label"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Amount
              </Text>
              <View style={styles.editFieldRow}>
                <View style={styles.editFieldIcon}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
                </View>
                <TextInput
                  style={styles.editFieldInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="Amount"
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </View>

              <View style={styles.editActions}>
                <QSButton
                  title="Cancel"
                  onPress={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  variant="secondary"
                  style={{ flex: 1 }}
                />
                <QSButton
                  title="Save"
                  onPress={handleSaveEdit}
                  style={{ flex: 1 }}
                />
              </View>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </View>
  );
}