import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useBudgets } from "../hooks/useBudgets";
import { useCategories } from "../hooks/useCategories";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function QSBudgetCreationScreen() {
    const router = useRouter();
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { addBudget } = useBudgets();
    const { getCategories } = useCategories();

    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [period, setPeriod] = useState<"monthly" | "yearly">("monthly");
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        const allCats = await getCategories('expense');
        // Filter for parent categories only
        const topLevelCats = allCats.filter(c => !c.parent_id);
        setCategories(topLevelCats);
    };

    const handleSave = async () => {
        if (!amount || !selectedCategory || !user) return;

        setLoading(true);
        const success = await addBudget({
            user_id: user.id,
            category_id: selectedCategory.id,
            amount: parseFloat(amount),
            period: period,
        });
        setLoading(false);

        if (success) {
            router.back();
        }
    };

    // Calculate colors based on theme
    const bgColor = isDark ? "#000000" : "#FFFFFF"; // Solid bg fallback
    const gradColors = isDark
        ? ["#0F172A", "#1E293B", "#0F172A"]
        : ["#F8FAFC", "#FFFFFF", "#F1F5F9"];

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: bgColor }}>
                <LinearGradient
                    colors={gradColors as [string, string, ...string[]]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>New Budget</Text>
                    <View style={{ width: 44 }} />
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <Animated.View entering={FadeInDown.delay(100).springify()}>
                            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                How much do you want to spend?
                            </Text>
                            <View style={[styles.amountInputContainer, { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                <Text style={[styles.currencyPrefix, { color: theme.colors.primary }]}>₹</Text>
                                <TextInput
                                    style={[styles.amountInput, { color: theme.colors.text }]}
                                    value={amount}
                                    onChangeText={setAmount}
                                    placeholder="0"
                                    placeholderTextColor={theme.colors.textSecondary}
                                    keyboardType="numeric"
                                    autoFocus
                                />
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 32 }}>
                            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                Frequency
                            </Text>
                            <View style={[styles.periodToggle, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }]}>
                                <TouchableOpacity
                                    style={[
                                        styles.periodOption,
                                        period === "monthly" && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                                    ]}
                                    onPress={() => setPeriod("monthly")}
                                >
                                    <Text style={[styles.periodText, { color: period === "monthly" ? "#FFF" : theme.colors.textSecondary }]}>Monthly</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.periodOption,
                                        period === "yearly" && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                                    ]}
                                    onPress={() => setPeriod("yearly")}
                                >
                                    <Text style={[styles.periodText, { color: period === "yearly" ? "#FFF" : theme.colors.textSecondary }]}>Yearly</Text>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>

                        <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: 32 }}>
                            <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                Select Category
                            </Text>
                            <View style={styles.categoriesGrid}>
                                {categories.map((cat, index) => {
                                    const isSelected = selectedCategory?.id === cat.id;
                                    return (
                                        <Animated.View key={cat.id} entering={FadeInDown.delay(300 + index * 30).springify()}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.categoryItem,
                                                    {
                                                        backgroundColor: isSelected ? cat.color : (isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF"),
                                                        borderColor: isSelected ? "transparent" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"),
                                                    }
                                                ]}
                                                onPress={() => setSelectedCategory(cat)}
                                            >
                                                <MaterialCommunityIcons
                                                    // @ts-ignore
                                                    name={cat.icon || "shape"}
                                                    size={24}
                                                    color={isSelected ? "#FFF" : cat.color}
                                                />
                                                <Text
                                                    style={[
                                                        styles.categoryName,
                                                        { color: isSelected ? "#FFF" : theme.colors.text, fontWeight: isSelected ? "700" : "500" }
                                                    ]}
                                                    numberOfLines={1}
                                                >
                                                    {cat.name}
                                                </Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    );
                                })}
                            </View>
                        </Animated.View>
                    </ScrollView>
                </KeyboardAvoidingView>

                <Animated.View
                    entering={FadeInUp.delay(400).springify()}
                    style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}
                >
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: theme.colors.primary },
                            (!amount || !selectedCategory) && { opacity: 0.5 }
                        ]}
                        disabled={!amount || !selectedCategory || loading}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? "Creating..." : "Create Budget"}
                        </Text>
                        {!loading && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />}
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    currencyPrefix: {
        fontSize: 40,
        fontWeight: 'bold',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 40,
        fontWeight: 'bold',
        height: 60,
    },
    periodToggle: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
    },
    periodOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    periodText: {
        fontSize: 16,
        fontWeight: '600',
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryItem: {
        width: (width - 48 - 24) / 3,
        aspectRatio: 1,
        borderRadius: 16,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 8,
    },
    categoryName: {
        fontSize: 12,
        textAlign: 'center',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
