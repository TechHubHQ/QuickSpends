import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { QSCategoryPicker } from "../components/QSCategoryPicker";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { QSInfoSheet } from "../components/QSInfoSheet";
import {
  INVESTMENT_TYPE_META,
  INVESTMENT_TYPES_LIST,
  InvestmentType,
} from "../config/investmentTypes";
import { useAuth } from "../context/AuthContext";
import { useCategories } from "../hooks/useCategories";
import { useSavings } from "../hooks/useSavings";
import { createStyles } from "../styles/QSCreateSaving.styles";
import { useTheme } from "../theme/ThemeContext";

export default function QSAddSavingScreen() {
  const { savingId } = useLocalSearchParams<{ savingId: string }>();
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { addSavingsGoal, getSavingsGoal, updateSavingsGoal } = useSavings();
  const { getCategories } = useCategories();

  const styles = useMemo(() => createStyles(theme), [theme]);

  const [isInvestment, setIsInvestment] = useState(false);
  const [investmentType, setInvestmentType] = useState<InvestmentType | null>(null);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [initialAmount, setInitialAmount] = useState("");
  const [tenureYears, setTenureYears] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [sipAmount, setSipAmount] = useState("");
  const [lumpsumAmount, setLumpsumAmount] = useState("");
  const [annualContribution, setAnnualContribution] = useState("");
  const [parentCategoryId, setParentCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [initialCategoryId, setInitialCategoryId] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [includeInNetWorth, setIncludeInNetWorth] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showNetWorthInfo, setShowNetWorthInfo] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showSubCategoryPicker, setShowSubCategoryPicker] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      getCategories("expense").then(setCategories);
    }
  }, [user]);

  const fetchSavingData = useCallback(async () => {
    if (savingId) {
      const goal = await getSavingsGoal(savingId);
      if (goal) {
        setName(goal.name);
        setTargetAmount(goal.target_amount.toString());
        setInitialCategoryId(goal.category_id || null);
        setTargetDate(goal.target_date ? new Date(goal.target_date) : null);
        setIncludeInNetWorth(goal.include_in_net_worth || false);
        if (goal.is_investment && goal.investment_type) {
          setIsInvestment(true);
          setInvestmentType(goal.investment_type as InvestmentType);
          if (goal.tenure_years) setTenureYears(String(goal.tenure_years));
          if (goal.expected_return_rate) setExpectedReturn(String(goal.expected_return_rate));
          if (goal.monthly_allocation) setSipAmount(String(goal.monthly_allocation));
        }
      }
    }
  }, [savingId, getSavingsGoal]);

  React.useEffect(() => {
    fetchSavingData();
  }, [fetchSavingData]);

  React.useEffect(() => {
    if (!categories.length || initialCategoryId === null) return;

    if (!initialCategoryId) {
      setParentCategoryId("");
      setSubCategoryId("");
      setInitialCategoryId(null);
      return;
    }

    const selected = categories.find((c) => c.id === initialCategoryId);
    if (!selected) {
      setParentCategoryId("");
      setSubCategoryId("");
    } else if (selected.parent_id) {
      setParentCategoryId(selected.parent_id);
      setSubCategoryId(selected.id);
    } else {
      setParentCategoryId(initialCategoryId);
      setSubCategoryId("");
    }
    setInitialCategoryId(null);
  }, [categories, initialCategoryId]);

  useEffect(() => {
    if (isInvestment && investmentType) {
      const meta = INVESTMENT_TYPE_META[investmentType];
      if (!expectedReturn && meta) setExpectedReturn(String(meta.defaultReturn));
    }
  }, [investmentType, isInvestment]);

  const effectiveCategoryId = subCategoryId || parentCategoryId;
  const selectedParentCategory = categories.find((c) => c.id === parentCategoryId);
  const selectedSubCategory = categories.find((c) => c.id === subCategoryId);
  const subCategories = categories.filter((c) => c.parent_id === parentCategoryId);
  const hasSubCategories = subCategories.length > 0;

  const currentMeta = isInvestment && investmentType ? INVESTMENT_TYPE_META[investmentType] : null;

  const projectedMaturity = useMemo(() => {
    if (!currentMeta || !tenureYears) return null;
    const tenure = parseFloat(tenureYears);
    if (tenure <= 0) return null;
    const rate = parseFloat(expectedReturn) || currentMeta.defaultReturn;
    const current = parseFloat(initialAmount) || 0;
    return currentMeta.calc({
      monthlySip: parseFloat(sipAmount) || undefined,
      lumpsum: parseFloat(lumpsumAmount) || undefined,
      annualContribution: parseFloat(annualContribution) || undefined,
      currentAmount: current,
      tenureYears: tenure,
      returnRate: rate,
    });
  }, [currentMeta, tenureYears, expectedReturn, sipAmount, lumpsumAmount, annualContribution, initialAmount]);

  const handlePresetReturn = (val: number) => {
    setExpectedReturn(String(val));
  };

  const handleSave = async () => {
    if (!user) return;
    if (!name || !targetAmount) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill in all fields",
      });
      return;
    }

    setLoading(true);
    const goalPayload: any = {
      name,
      target_amount: parseFloat(targetAmount),
      category_id: effectiveCategoryId || undefined,
      target_date: targetDate?.toISOString(),
      include_in_net_worth: includeInNetWorth,
      is_investment: isInvestment || undefined,
    };

    if (isInvestment && investmentType) {
      goalPayload.investment_type = investmentType;
      goalPayload.tenure_years = parseFloat(tenureYears) || 0;
      goalPayload.expected_return_rate = parseFloat(expectedReturn) || currentMeta?.defaultReturn || 0;
      if (currentMeta?.fields.includes("sip")) {
        goalPayload.monthly_allocation = parseFloat(sipAmount) || 0;
      }
    }

    let success;
    if (savingId) {
      success = await updateSavingsGoal(savingId, goalPayload);
    } else {
      success = await addSavingsGoal(goalPayload, initialAmount ? parseFloat(initialAmount) : 0);
    }

    if (success) {
      Toast.show({
        type: "success",
        text1: "Success",
        text2: savingId ? "Goal updated" : "Goal created",
      });
      router.back();
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <QSHeader
          title={savingId ? "Edit Goal" : "New Goal"}
          showBack
          onBackPress={() => router.back()}
        />

        {/* Type Toggle */}
        <Animated.View entering={FadeInDown.delay(80).springify()} style={styles.typeToggle}>
          <Pressable
            style={[styles.typeToggleBtn, !isInvestment && styles.typeToggleBtnActive]}
            onPress={() => { setIsInvestment(false); setInvestmentType(null); }}
          >
            <MaterialCommunityIcons
              name="piggy-bank-outline"
              size={18}
              color={!isInvestment ? theme.colors.text : theme.colors.textSecondary}
            />
            <Text style={[styles.typeToggleText, !isInvestment && styles.typeToggleTextActive]}>
              Saving
            </Text>
          </Pressable>
          <Pressable
            style={[styles.typeToggleBtn, isInvestment && styles.typeToggleBtnActive]}
            onPress={() => setIsInvestment(true)}
          >
            <MaterialCommunityIcons
              name="chart-line"
              size={18}
              color={isInvestment ? theme.colors.text : theme.colors.textSecondary}
            />
            <Text style={[styles.typeToggleText, isInvestment && styles.typeToggleTextActive]}>
              Investment
            </Text>
          </Pressable>
        </Animated.View>

        {/* Investment Type Grid */}
        {isInvestment && (
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            <Text style={styles.label}>Investment Type</Text>
            <View style={styles.typeGrid}>
              {INVESTMENT_TYPES_LIST.map((item) => {
                const selected = investmentType === item.key;
                return (
                  <Pressable
                    key={item.key}
                    style={[styles.typeCard, selected && styles.typeCardSelected]}
                    onPress={() => {
                      setInvestmentType(item.key);
                      setExpectedReturn(String(item.defaultReturn));
                    }}
                  >
                    <LinearGradient
                      colors={[`${item.color}25`, `${item.color}10`]}
                      style={[styles.typeCardIcon]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={24}
                        color={item.color}
                      />
                    </LinearGradient>
                    <Text style={styles.typeCardLabel}>{item.label}</Text>
                    <Text style={styles.typeCardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Goal Name */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.inputGroup}>
          <Text style={styles.label}>
            {isInvestment ? "Investment Name" : "Goal Name"}
          </Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={currentMeta?.placeholder || (isInvestment ? "e.g. Nifty 50 Index" : "e.g. New Car")}
              placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
              value={name}
              onChangeText={setName}
            />
          </View>
        </Animated.View>

        {/* Tenure (for investments) */}
        {isInvestment && (
          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Tenure (Years)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="e.g. 5"
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={tenureYears}
                onChangeText={setTenureYears}
              />
            </View>
          </Animated.View>
        )}

        {/* SIP Amount (for MF, Gold, Stocks) */}
        {currentMeta?.fields.includes("sip") && (
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Monthly SIP Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={sipAmount}
                onChangeText={setSipAmount}
              />
            </View>
          </Animated.View>
        )}

        {/* Lumpsum Amount (for FD, Real Estate) */}
        {currentMeta?.fields.includes("lumpsum") && (
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Principal Amount</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={lumpsumAmount}
                onChangeText={setLumpsumAmount}
              />
            </View>
          </Animated.View>
        )}

        {/* Annual Contribution (for PPF/EPF) */}
        {currentMeta?.fields.includes("annual_contribution") && (
          <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Annual Contribution</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={annualContribution}
                onChangeText={setAnnualContribution}
              />
            </View>
          </Animated.View>
        )}

        {/* Expected Return Rate (for investments) */}
        {isInvestment && (
          <Animated.View entering={FadeInDown.delay(280).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Expected Return (% p.a.)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={String(currentMeta?.defaultReturn || 0)}
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={expectedReturn}
                onChangeText={setExpectedReturn}
              />
              <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.textSecondary }}>%</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
              {[5, 8, 10, 12, 15].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => handlePresetReturn(v)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 4,
                    borderRadius: 8,
                    backgroundColor: parseFloat(expectedReturn || "0") === v
                      ? `${theme.colors.info}20`
                      : theme.colors.backgroundSecondary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: parseFloat(expectedReturn || "0") === v
                        ? theme.colors.info
                        : theme.colors.textSecondary,
                    }}
                  >
                    {v}%
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Auto-Calc Projected Maturity */}
        {projectedMaturity !== null && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <LinearGradient
              colors={[`${currentMeta?.color || theme.colors.primary}12`, `${currentMeta?.color || theme.colors.primary}04`]}
              style={styles.autoCalcCard}
            >
              <MaterialCommunityIcons
                name="calculator-variant"
                size={32}
                color={currentMeta?.color || theme.colors.primary}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.autoCalcLabel}>Projected Maturity</Text>
                <Text style={styles.autoCalcValue}>
                  ₹{projectedMaturity.toLocaleString("en-IN")}
                </Text>
                <Text style={styles.autoCalcNote}>
                  Based on {tenureYears} years at {expectedReturn || currentMeta?.defaultReturn}% return
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Target Amount */}
        <Animated.View entering={FadeInDown.delay(340).springify()} style={styles.inputGroup}>
          <Text style={styles.label}>
            {isInvestment ? "Target Amount" : "Target Amount"}
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currency}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
              keyboardType="decimal-pad"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />
          </View>
          {projectedMaturity !== null && parseFloat(targetAmount || "0") > 0 && (
            <Text
              style={{
                fontSize: 11,
                color: theme.colors.textTertiary,
                marginTop: 4,
                fontStyle: "italic",
              }}
            >
              Projected: ₹{projectedMaturity.toLocaleString("en-IN")}
              {projectedMaturity !== parseFloat(targetAmount) &&
                ` | ${projectedMaturity > parseFloat(targetAmount) ? "Exceeds" : "Below"} target by ₹${Math.abs(projectedMaturity - parseFloat(targetAmount)).toLocaleString("en-IN")}`}
            </Text>
          )}
        </Animated.View>

        {/* Initial Amount (only on create) */}
        {!savingId && (
          <Animated.View entering={FadeInDown.delay(380).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>
              {isInvestment ? "Already Invested (Optional)" : "Already Saved (Optional)"}
            </Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.isDark ? "#64748B" : "#94A3B8"}
                keyboardType="decimal-pad"
                value={initialAmount}
                onChangeText={setInitialAmount}
              />
            </View>
          </Animated.View>
        )}

        {/* Target Date (for regular savings only) */}
        {!isInvestment && (
          <Animated.View entering={FadeInDown.delay(420).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>End Date / Term (Optional)</Text>
            <Pressable style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
              <Text
                style={[
                  styles.selectText,
                  { color: targetDate ? theme.colors.text : (theme.isDark ? "#64748B" : "#94A3B8") },
                ]}
              >
                {targetDate ? format(targetDate, "PP") : "Select End Date"}
              </Text>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color={theme.isDark ? "#64748B" : "#94A3B8"}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* Category */}
        <Animated.View entering={FadeInDown.delay(460).springify()} style={styles.inputGroup}>
          <Text style={styles.label}>Category (Optional)</Text>
          <Pressable style={styles.inputWrapper} onPress={() => setShowCategoryPicker(true)}>
            <Text
              style={[
                styles.selectText,
                { color: selectedParentCategory ? theme.colors.text : (theme.isDark ? "#64748B" : "#94A3B8") },
              ]}
            >
              {selectedSubCategory && selectedParentCategory
                ? `${selectedParentCategory.name} > ${selectedSubCategory.name}`
                : selectedParentCategory?.name || "Select Category"}
            </Text>
            <MaterialCommunityIcons
              name="chevron-down"
              size={24}
              color={theme.isDark ? "#64748B" : "#94A3B8"}
            />
          </Pressable>
        </Animated.View>

        {hasSubCategories && (
          <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.inputGroup}>
            <Text style={styles.label}>Sub Category (Optional)</Text>
            <Pressable style={styles.inputWrapper} onPress={() => setShowSubCategoryPicker(true)}>
              <Text
                style={[
                  styles.selectText,
                  { color: selectedSubCategory ? theme.colors.text : (theme.isDark ? "#64748B" : "#94A3B8") },
                ]}
              >
                {selectedSubCategory?.name || "Select Sub Category"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={24}
                color={theme.isDark ? "#64748B" : "#94A3B8"}
              />
            </Pressable>
          </Animated.View>
        )}

        {/* Include in Net Worth */}
        <Animated.View entering={FadeInDown.delay(540).springify()} style={styles.switchContainer}>
          <View style={styles.switchLabel}>
            <Text style={styles.label}>Include in Net Worth</Text>
            <Pressable onPress={() => setShowNetWorthInfo(true)}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
            </Pressable>
          </View>
          <Switch
            value={includeInNetWorth}
            onValueChange={setIncludeInNetWorth}
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </Animated.View>

        {/* Save Button */}
        <Animated.View entering={FadeInDown.delay(600).springify()} style={styles.buttonContainer}>
          <QSButton
            title={savingId ? "Update Goal" : "Create Goal"}
            onPress={handleSave}
            loading={loading}
            variant="primary"
          />
        </Animated.View>
      </ScrollView>

      <QSCategoryPicker
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        categories={categories}
        selectedId={parentCategoryId}
        onSelect={(cat) => {
          setParentCategoryId(cat.id);
          setSubCategoryId("");
          setShowCategoryPicker(false);
          if (categories.some((c) => c.parent_id === cat.id)) {
            setTimeout(() => setShowSubCategoryPicker(true), 250);
          }
        }}
      />

      <QSCategoryPicker
        visible={showSubCategoryPicker}
        onClose={() => setShowSubCategoryPicker(false)}
        categories={categories}
        selectedId={subCategoryId}
        parentId={parentCategoryId}
        onSelect={(cat) => {
          setSubCategoryId(cat.id);
          setShowSubCategoryPicker(false);
        }}
      />

      <QSDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={targetDate || new Date()}
        onSelect={(date) => setTargetDate(date)}
      />

      <QSInfoSheet
        visible={showNetWorthInfo}
        onClose={() => setShowNetWorthInfo(false)}
        title="Asset Guidance"
      >
        <View style={styles.infoContent}>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>What is an Asset?</Text>
            <Text style={styles.infoText}>
              An asset is anything of value that can be converted into cash. For your Net Worth, only include
              savings that have a real cash value.
            </Text>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Common Assets (Include ✅)</Text>
            <View style={styles.assetList}>
              {[
                { icon: "bank", text: "Bank Balances & FDs" },
                { icon: "stocking", text: "Stocks & Mutual Funds" },
                { icon: "gold", text: "Gold & Silver" },
                { icon: "file-check", text: "Cash-Value Insurance (ULIP, Endowment)" },
              ].map((item, i) => (
                <View key={i} style={styles.assetItem}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={theme.colors.success} />
                  <Text style={styles.assetItemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Non-Assets (Exclude ❌)</Text>
            <View style={styles.assetList}>
              {[
                { icon: "file-cancel", text: "Term Insurance (Protection only)" },
                { icon: "medical-bag", text: "Health / Medical Insurance" },
                { icon: "car-wash", text: "General Insurance (Car, Home)" },
              ].map((item, i) => (
                <View key={i} style={styles.assetItem}>
                  <MaterialCommunityIcons name={item.icon as any} size={18} color={theme.colors.error} />
                  <Text style={styles.assetItemText}>{item.text}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </QSInfoSheet>
    </View>
  );
}
