import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSButton } from "../components/QSButton";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useSettlements } from "../hooks/useSettlements";
import { createStyles } from "../styles/QSNewSettlement.styles";
import { useTheme } from "../theme/ThemeContext";

export default function QSNewSettlementScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { addSettlement } = useSettlements();
    const styles = useMemo(() => createStyles(theme), [theme]);

    const [name, setName] = useState("");
    const [personName, setPersonName] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState<'lent' | 'borrowed'>('lent');
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim() || !personName.trim() || !amount) {
            Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in all required fields' });
            return;
        }

        setLoading(true);
        const id = await addSettlement({
            user_id: user.id,
            name: name.trim(),
            person_name: personName.trim(),
            total_amount: parseFloat(amount),
            type,
            notes: notes.trim() || undefined
        });

        if (id) {
            Toast.show({ type: 'success', text1: 'Success', text2: 'Settlement created' });
            router.back();
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <QSHeader title="New Settlement" showBack onBackPress={() => router.back()} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.typeContainer}>
                    {(['lent', 'borrowed'] as const).map((t) => (
                        <TouchableOpacity
                            key={t}
                            style={[styles.typeButton, type === t && { backgroundColor: theme.colors.primary }]}
                            onPress={() => setType(t)}
                        >
                            <Text style={[styles.typeText, type === t ? { color: theme.colors.onPrimary } : { color: theme.colors.text }]}>
                                {t === 'lent' ? 'I Lent' : 'I Borrowed'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(150).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Settlement Name *</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="handshake" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Dinner split, Rent share"
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            value={name}
                            onChangeText={setName}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Person Name *</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="account" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <TextInput
                            style={styles.input}
                            placeholder="Who is this with?"
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            value={personName}
                            onChangeText={setPersonName}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(250).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Amount *</Text>
                    <View style={styles.inputWrapper}>
                        <Text style={styles.currency}>₹</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="0.00"
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            keyboardType="decimal-pad"
                            value={amount}
                            onChangeText={setAmount}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.inputGroup}>
                    <Text style={styles.label}>Notes (Optional)</Text>
                    <View style={styles.inputWrapper}>
                        <MaterialCommunityIcons name="note-text-outline" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <TextInput
                            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                            placeholder="Add any notes..."
                            placeholderTextColor={theme.isDark ? '#64748B' : '#94A3B8'}
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                        />
                    </View>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(350).springify()} style={styles.buttonContainer}>
                    <QSButton
                        title="Create Settlement"
                        onPress={handleSave}
                        loading={loading}
                        variant="primary"
                    />
                </Animated.View>
            </ScrollView>
        </View>
    );
}
