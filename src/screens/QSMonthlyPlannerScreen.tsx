import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
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

const getMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export default function QSMonthlyPlannerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { user } = useAuth();
  const {
    getOrCreatePlan,
    getPlanItems,
    addManualItem,
    settleItem,
    getForecast,
    getPlanVsActual,
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
  }>({ planVsActual: null, pastPlans: [] });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemAmount, setNewItemAmount] = useState("");

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
    setAnalyticsData({ planVsActual, pastPlans });
  }, [user, monthKey, getPlanVsActual, getPlansByUser]);

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
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
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
      <View
        style={{
          margin: theme.spacing.m,
          padding: theme.spacing.m,
          borderRadius: theme.borderRadius.m,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: `${theme.colors.primary}30`,
        }}
      >
        <TextInput
          placeholder={type === "income" ? "Income source (e.g. Bonus)" : "Expense category (e.g. Groceries)"}
          placeholderTextColor={theme.colors.textTertiary}
          value={newItemLabel}
          onChangeText={setNewItemLabel}
          style={{
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.colors.textTertiary}30`,
            paddingVertical: theme.spacing.s,
            marginBottom: theme.spacing.s,
          }}
        />
        <TextInput
          placeholder="Amount"
          placeholderTextColor={theme.colors.textTertiary}
          value={newItemAmount}
          onChangeText={setNewItemAmount}
          keyboardType="numeric"
          style={{
            fontSize: theme.typography.body.fontSize,
            color: theme.colors.text,
            borderBottomWidth: 1,
            borderBottomColor: `${theme.colors.textTertiary}30`,
            paddingVertical: theme.spacing.s,
            marginBottom: theme.spacing.m,
          }}
        />
        <View style={{ flexDirection: "row", gap: theme.spacing.s }}>
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
      </View>
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
      <View style={styles.section}>
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
            <Text style={[styles.itemAmount, { color }]}>
              {formatCurrency(item.amount)}
            </Text>
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
      </View>
    );
  };

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={[styles.summaryAmount, { color: "#22C55E" }]}>
          +{formatCurrency(totalIncome)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
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
    </View>
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
          "Income",
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
          "Estimated Spending",
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
                <View
                  style={{
                    marginTop: theme.spacing.s,
                    padding: theme.spacing.s,
                    borderRadius: theme.borderRadius.s,
                    backgroundColor: `${theme.colors.error}15`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: theme.typography.caption.fontSize,
                      color: theme.colors.error,
                      fontWeight: "600",
                      textAlign: "center",
                    }}
                  >
                    ⚠ Projected deficit — review spending or increase income
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const renderAnalyticsTab = () => {
    const pva = analyticsData.planVsActual;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xxl }}
      >
        {pva ? (
          <>
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
                    {p.is_locked ? "🔒 Locked" : "Draft"}
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
        <View style={styles.settlementProgress}>
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
        </View>

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
        variant="pill"
      />
      {activeTab === "plan" && renderPlanTab()}
      {activeTab === "forecast" && renderForecastTab()}
      {activeTab === "analytics" && renderAnalyticsTab()}
      {activeTab === "settle" && renderSettleTab()}
    </View>
  );
}
