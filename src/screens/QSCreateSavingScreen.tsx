import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { QSCategoryPicker } from "../components/QSCategoryPicker";
import { QSHeader } from "../components/QSHeader";
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
    const [categoryId, setCategoryId] = useState("");
    const [showCategoryPicker, setShowCategoryPicker] = useState(false);
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
                setCategoryId(goal.category_id || "");
            }
        }
    }, [savingId, getSavingsGoal]);

    React.useEffect(() => {
        fetchSavingData();
    }, [fetchSavingData]);

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
                category_id: categoryId || undefined
            });
        } else {
            success = await addSavingsGoal({
                user_id: user.id,
                name,
                target_amount: parseFloat(targetAmount),
                category_id: categoryId || undefined
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

    const getSelectedCategory = () => categories.find(c => c.id === categoryId);

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
                    <Text style={styles.label}>Category (Optional)</Text>
                    <TouchableOpacity
                        style={styles.inputWrapper}
                        onPress={() => setShowCategoryPicker(true)}
                    >
                        <Text style={[styles.selectText, { color: getSelectedCategory() ? theme.colors.text : (theme.isDark ? '#64748B' : '#94A3B8') }]}>
                            {getSelectedCategory()?.name || "Select Category"}
                        </Text>
                        <MaterialCommunityIcons name="chevron-down" size={24} color={theme.isDark ? '#64748B' : '#94A3B8'} />
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.buttonContainer}>
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
                selectedId={categoryId}
                onSelect={(cat) => setCategoryId(cat.id)}
            />
        </View>
    );
}

