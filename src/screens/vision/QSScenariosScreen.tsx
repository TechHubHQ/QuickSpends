import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
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
  ScenarioAssumptions,
  useFutureVision,
  VisionScenario,
} from "../../hooks/useFutureVision";
import { createStyles } from "../../styles/vision/QSVision.styles";
import { useTheme } from "../../theme/ThemeContext";

export default function QSScenariosScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useAuth();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) parent.setOptions({ tabBarStyle: { display: "none" } });
    return () => {
      if (parent) parent.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);

  const { getScenarios, saveScenario, deleteScenario, setDefaultScenario } = useFutureVision();

  const [scenarios, setScenarios] = useState<VisionScenario[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newInflation, setNewInflation] = useState("6");
  const [newReturn, setNewReturn] = useState("10");

  const loadScenarios = useCallback(async () => {
    if (!user) return;
    const data = await getScenarios(user.id);
    setScenarios(data);
  }, [user, getScenarios]);

  useEffect(() => { loadScenarios(); }, [loadScenarios]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadScenarios();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    const assumptions: ScenarioAssumptions = {
      inflation_rate: parseFloat(newInflation) || 6,
      investment_return: parseFloat(newReturn) || 10,
      savings_capacity: null,
      income_growth: 5,
      expense_growth: 3,
    };
    await saveScenario(user.id, newName.trim(), assumptions);
    setNewName("");
    setShowCreate(false);
    await loadScenarios();
  };

  const handleDelete = async (id: string) => {
    await deleteScenario(id);
    await loadScenarios();
  };

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    await setDefaultScenario(user.id, id);
    await loadScenarios();
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(160, insets.bottom + 140) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <QSHeader title="Scenarios" subtitle="Compare different assumption sets for your goals" />

          {/* Info Banner */}
          <Animated.View
            entering={FadeInDown.delay(50)}
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
              padding: 14,
              borderRadius: 16,
              backgroundColor: `${theme.colors.info}10`,
              borderWidth: 1,
              borderColor: `${theme.colors.info}20`,
            }}
          >
            <Text style={{ fontSize: 13, color: theme.colors.info, fontWeight: "600", lineHeight: 18 }}>
              Scenarios let you compare how different economic assumptions affect your goals.
              Mark one as default — it will be used across the Vision suite.
            </Text>
          </Animated.View>

          {scenarios.map((scenario, idx) => (
            <Animated.View key={scenario.id} entering={FadeInDown.delay(100 + idx * 80)}>
              <View style={styles.scenarioCard}>
                <View style={styles.scenarioHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <LinearGradient
                      colors={scenario.is_default
                        ? [`${theme.colors.primary}25`, `${theme.colors.primary}08`]
                        : [theme.colors.backgroundSecondary, theme.colors.backgroundSecondary]
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name={scenario.is_default ? "check-circle" : "circle-outline"}
                        size={22}
                        color={scenario.is_default ? theme.colors.primary : theme.colors.textTertiary}
                      />
                    </LinearGradient>
                    <View>
                      <Text style={styles.scenarioName}>{scenario.name}</Text>
                      {scenario.is_default && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {!scenario.is_default && (
                      <Pressable
                        onPress={() => handleSetDefault(scenario.id)}
                        style={({ pressed }) => ({
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: `${theme.colors.warning}12`,
                          alignItems: "center",
                          justifyContent: "center",
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <MaterialCommunityIcons name="star-outline" size={18} color={theme.colors.warning} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDelete(scenario.id)}
                      style={({ pressed }) => ({
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: `${theme.colors.error}12`,
                        alignItems: "center",
                        justifyContent: "center",
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={18} color={theme.colors.error} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.scenarioAssumptions}>
                  <View style={styles.assumptionChip}>
                    <Text style={styles.assumptionText}>
                      Inflation: {scenario.assumptions.inflation_rate}%
                    </Text>
                  </View>
                  <View style={styles.assumptionChip}>
                    <Text style={styles.assumptionText}>
                      Returns: {scenario.assumptions.investment_return}%
                    </Text>
                  </View>
                  <View style={styles.assumptionChip}>
                    <Text style={styles.assumptionText}>
                      Income growth: {scenario.assumptions.income_growth}%
                    </Text>
                  </View>
                  <View style={styles.assumptionChip}>
                    <Text style={styles.assumptionText}>
                      Expense growth: {scenario.assumptions.expense_growth}%
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>
          ))}

          {showCreate && (
            <Animated.View entering={FadeInDown} style={styles.scenarioCard}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 0, marginTop: 0, marginBottom: 8 }]}>
                New Scenario
              </Text>
              <View style={{ gap: 14 }}>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Scenario name"
                  placeholderTextColor={theme.colors.textTertiary}
                />
                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Inflation %</Text>
                    <TextInput
                      style={styles.input}
                      value={newInflation}
                      onChangeText={setNewInflation}
                      keyboardType="decimal-pad"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Text style={styles.inputLabel}>Return %</Text>
                    <TextInput
                      style={styles.input}
                      value={newReturn}
                      onChangeText={setNewReturn}
                      keyboardType="decimal-pad"
                      placeholderTextColor={theme.colors.textTertiary}
                    />
                  </View>
                </View>
                <View style={styles.wizardNav}>
                  <Pressable
                    onPress={() => setShowCreate(false)}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.backgroundSecondary,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "600", color: theme.colors.text }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleCreate}
                    style={({ pressed }) => ({
                      flex: 1,
                      height: 48,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.primary,
                      opacity: pressed ? 0.92 : 1,
                    })}
                  >
                    <Text style={{ fontWeight: "700", color: "#ffffff" }}>Create</Text>
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          )}

          {!showCreate && (
            <Pressable
              onPress={() => setShowCreate(true)}
              style={({ pressed }) => ({
                marginHorizontal: 16,
                marginTop: 8,
                marginBottom: insets.bottom + 24,
                height: 54,
                borderRadius: 16,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: theme.colors.border,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.7 : 1,
                backgroundColor: theme.colors.backgroundSecondary,
              })}
            >
              <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
              <Text style={{ fontSize: 15, fontWeight: "600", color: theme.colors.primary }}>
                Add Scenario
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}