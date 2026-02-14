import { MaterialCommunityIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { QSCategoryPicker } from "../components/QSCategoryPicker";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { QSInfoSheet } from "../components/QSInfoSheet";
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

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
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
            getCategories('expense').then(setCategories);
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

        const selected = categories.find(c => c.id === initialCategoryId);
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

    const effectiveCategoryId = subCategoryId || parentCategoryId;
    const selectedParentCategory = categories.find(c => c.id === parentCategoryId);
    const selectedSubCategory = categories.find(c => c.id === subCategoryId);
    const subCategories = categories.filter(c => c.parent_id === parentCategoryId);
    const hasSubCategories = subCategories.length > 0;

    const handleSave = async () => {
        if (!user) return;
        if (!name || !targetAmount) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill in all fields'
            });
            return;
        }

        setLoading(true);
        let success;
        if (savingId) {
            success = await updateSavingsGoal(savingId, {
                name,
                target_amount: parseFloat(targetAmount),
                category_id: effectiveCategoryId || undefined,
                target_date: targetDate?.toISOString(),
                include_in_net_worth: includeInNetWorth
            });
        } else {
            success = await addSavingsGoal({
                user_id: user.id,
                name,
                target_amount: parseFloat(targetAmount),
                category_id: effectiveCategoryId || undefined,
                target_date: targetDate?.toISOString(),
                include_in_net_worth: includeInNetWorth
            });
        }

        if (success) {
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: savingId ? 'Savings goal updated' : 'Savings goal created'
            });
            router.back();
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <QSHeader title={savingId ? "Edit Savings Goal" : "New Savings Goal"} showBack onBackPress={() => router.back()} />
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Goal Name</Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. New Car, Emergency Fund"
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Target Amount</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            keyboardType="decimal-pad"
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>End Date / Term (Optional)</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={[styles.selectText, { color: targetDate ? theme.colors.text : (theme.isDark ? '#64748B' : '#94A3B8') }]}>
                            {targetDate ? format(targetDate, "PP") : "Select End Date"}
                        </Text>
                        <MaterialCommunityIcons name="calendar" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Category (Optional)</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setShowCategoryPicker(true)}
                    >
                        <Text style={[styles.selectText, { color: selectedParentCategory ? theme.colors.text : (theme.isDark ? '#64748B' : '#94A3B8') }]}>
                            {selectedSubCategory && selectedParentCategory
                                ? `${selectedParentCategory.name} > ${selectedSubCategory.name}`
                                : selectedParentCategory?.name || "Select Category"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                    </TouchableOpacity>
                </Animated.View>

                {hasSubCategories && (
                    <Animated.View entering={FadeInDown.delay(450).springify()} style={styles.inputGroup}>
                        <Text style={styles.label}>Sub Category (Optional)</Text>
                        <TouchableOpacity
                            style={styles.inputWrapper}
                            onPress={() => setShowSubCategoryPicker(true)}
                        >
                            <Text style={[styles.selectText, { color: selectedSubCategory ? theme.colors.text : (theme.isDark ? '#64748B' : '#94A3B8') }]}>
                                {selectedSubCategory?.name || "Select Sub Category"}
                            </Text>
                            <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                        </TouchableOpacity>
                    </Animated.View>
                )}

                <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.switchContainer}>
                    <View style={styles.switchLabel}>
                        <Text style={styles.label}>Include in Net Worth</Text>
                        <TouchableOpacity onPress={() => setShowNetWorthInfo(true)}>
                            <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                    <Switch
                        value={includeInNetWorth}
                        onValueChange={setIncludeInNetWorth}
                        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                        thumbColor="#FFFFFF"
                    />
                </Animated.View>

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
                    if (categories.some(c => c.parent_id === cat.id)) {
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
                            An asset is anything of value that can be converted into cash. For your Net Worth, only include savings that have a real cash value.
                        </Text>
                    </View>

                    <View style={styles.infoSection}>
                        <Text style={styles.infoTitle}>Common Assets (Include ✅)</Text>
                        <View style={styles.assetList}>
                            {[
                                { icon: 'bank', text: 'Bank Balances & FDs' },
                                { icon: 'stocking', text: 'Stocks & Mutual Funds' },
                                { icon: 'gold', text: 'Gold & Silver' },
                                { icon: 'file-check', text: 'Cash-Value Insurance (ULIP, Endowment)' },
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
                                { icon: 'file-cancel', text: 'Term Insurance (Protection only)' },
                                { icon: 'medical-bag', text: 'Health / Medical Insurance' },
                                { icon: 'car-wash', text: 'General Insurance (Car, Home)' },
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

