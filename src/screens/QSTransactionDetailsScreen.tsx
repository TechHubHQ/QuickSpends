import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSHeader } from "../components/QSHeader";
import { useAlert } from "../context/AlertContext";
import { useTransactions } from "../hooks/useTransactions";
import { useTheme } from "../theme/ThemeContext";
import { getSafeIconName } from "../utils/iconMapping"; // Assuming this exists based on QSHomeScreen

export default function QSTransactionDetailsScreen() {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { deleteTransaction } = useTransactions();
  const [deleting, setDeleting] = useState(false);

  // Parse the transaction data from params
  // In a real app we might pass just ID and fetch, but for now let's try to parse the full object
  // or fallback to a mock if we're just previewing the UI.
  const transaction = params.transaction
    ? JSON.parse(params.transaction as string)
    : null;

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Helper to format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
    };
  };

  const { date, time } = transaction
    ? formatDate(transaction.date)
    : { date: "Oct 24, 2023", time: "4:30 PM" };

  const isDark = theme.isDark;

  // Fallback data if no transaction is passed (for development/preview matching the HTML)
  const handleEdit = () => {
    if (!transaction) return;
    router.push({
      pathname: "/add-transaction",
      params: { editTransaction: JSON.stringify(transaction) },
    });
  };

  const handleDelete = async () => {
    if (!transaction) return;

    showAlert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            const success = await deleteTransaction(transaction.id);
            setDeleting(false);
            if (success) {
              router.back();
              Toast.show({
                type: "success",
                text1: "Success",
                text2: "Transaction deleted successfully",
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to delete transaction",
              });
            }
          },
        },
      ],
    );
  };

  // Fallback data if no transaction is passed (for development/preview matching the HTML)
  const data = transaction || {
    amount: 124.5,
    name: "Whole Foods Market",
    category_name: "Groceries",
    category_color: "#F97316", // Orange
    category_icon: "cart",
    type: "expense",
    description:
      "Weekly grocery run for the party. Bought extra snacks and drinks.",
    account_name: "Chase Sapphire •••• 4589", // We don't have this in Transaction type yet
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={styles.content}>
        <QSHeader
          title="Details"
          showBack
          onBackPress={() => router.back()}
          style={{ marginHorizontal: -16 }} // Compensate for ScrollView padding if needed? Wait. contentContainerStyle has paddingHorizontal: 16. QSHeader has its own padding.
          // If contentContainer has padding, QSHeader will be indented.
          // QSHeader styles have paddingHorizontal: theme.spacing.l (24? or 16?).
          // Let's check theme.spacing.l. Usually 24.
          // The screen has paddingHorizontal: 16.
          // If we put QSHeader inside, it will be double padded?
          // YES.
          // Option 1: Remove padding from contentContainerStyle and add it to children.
          // Option 2: Negative margin on QSHeader.
          // Let's use negative margin for simplicity to break out of container padding.
          rightElement={
            <TouchableOpacity
              style={[
                styles.editButton,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.05)",
                },
              ]}
              onPress={handleEdit}
            >
              <Text
                style={[styles.editButtonText, { color: theme.colors.primary }]}
              >
                Edit
              </Text>
            </TouchableOpacity>
          }
        />

        {/* Hero Section */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          style={styles.heroSection}
        >
          <View
            style={[
              styles.heroIconContainer,
              {
                backgroundColor: theme.colors.card,
                borderColor: isDark
                  ? "rgba(255,255,255,0.1)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <MaterialCommunityIcons
              name={getSafeIconName(data.category_icon || "cart")}
              size={32}
              color={data.category_color || theme.colors.primary}
            />
          </View>
          <Text style={[styles.heroAmount, { color: theme.colors.text }]}>
            {data.type === "expense" ? "-" : "+"}
            {formatCurrency(data.amount)}
          </Text>
          <Text
            style={[styles.heroMerchant, { color: theme.colors.textSecondary }]}
          >
            {data.name}
          </Text>
        </Animated.View>

        {/* General Info Card */}
        <Animated.View
          entering={FadeInUp.delay(200).springify()}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            GENERAL INFO
          </Text>

          <View
            style={[styles.row, { borderBottomColor: theme.colors.border }]}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(59, 130, 246, 0.2)"
                      : "rgba(59, 130, 246, 0.1)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="calendar-blank"
                  size={16}
                  color="#3B82F6"
                />
              </View>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
              >
                Date
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.colors.text }]}>
              {date}
            </Text>
          </View>

          <View
            style={[styles.row, { borderBottomColor: theme.colors.border }]}
          >
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isDark
                      ? "rgba(168, 85, 247, 0.2)"
                      : "rgba(168, 85, 247, 0.1)",
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={16}
                  color="#A855F7"
                />
              </View>
              <Text
                style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
              >
                Time
              </Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.colors.text }]}>
              {time}
            </Text>
          </View>

          {/* Description in General Info */}
          {!!data.description && (
            <View
              style={[
                styles.row,
                {
                  borderBottomWidth: 0,
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 8,
                  paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
              >
                Note
              </Text>
              <Text
                style={[
                  styles.notesText,
                  { color: theme.colors.text, fontSize: 14 },
                ]}
              >
                {data.description}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Details Card */}
        <Animated.View
          entering={FadeInUp.delay(300).springify()}
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.card,
              borderColor: isDark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
            DETAILS
          </Text>

          <View
            style={[styles.row, { borderBottomColor: theme.colors.border }]}
          >
            <Text
              style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
            >
              Category
            </Text>
            <View
              style={[
                styles.categoryBadge,
                { maxWidth: "70%", justifyContent: "flex-end" },
              ]}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: data.category_color || theme.colors.text },
                ]}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.rowValue,
                  {
                    color: theme.colors.text,
                    flexShrink: 1,
                    textAlign: "right",
                  },
                ]}
              >
                {data.category_name || "Uncategorized"}
              </Text>
            </View>
          </View>

          <View
            style={[styles.row, { borderBottomColor: theme.colors.border }]}
          >
            <Text
              style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
            >
              Account
            </Text>
            <View style={styles.accountBadge}>
              {/* Placeholder for Account Icon */}
              <View
                style={[
                  styles.accountIcon,
                  { backgroundColor: theme.colors.backgroundSecondary },
                ]}
              />
              <Text style={[styles.rowValue, { color: theme.colors.text }]}>
                {data.account_name || "Account"}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.row,
              {
                borderBottomWidth: data.description ? 1 : 0,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[styles.rowLabel, { color: theme.colors.textSecondary }]}
            >
              Type
            </Text>
            <Text
              style={[
                styles.rowValue,
                { color: theme.colors.text, textTransform: "capitalize" },
              ]}
            >
              {data.type}
            </Text>
          </View>
        </Animated.View>

        {/* Tags Card - Only show if we have trip info, group info or recurring info */}
        {!!(
          data.trip_id ||
          data.group_id ||
          data.recurring_id ||
          data.savings_id
        ) && (
          <Animated.View
            entering={FadeInUp.delay(400).springify()}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.card,
                borderColor: isDark
                  ? "rgba(255,255,255,0.05)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
              TAGS
            </Text>

            {/* Trip Tag */}
            {!!data.trip_id && (
              <TouchableOpacity
                style={[
                  styles.tagRow,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth:
                      data.group_id || data.savings_id || data.recurring_id
                        ? 1
                        : 0,
                  },
                ]}
              >
                <View style={styles.tagLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isDark
                          ? "rgba(236, 72, 153, 0.2)"
                          : "rgba(236, 72, 153, 0.1)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="airplane"
                      size={16}
                      color="#EC4899"
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.tagName, { color: theme.colors.text }]}
                    >
                      {data.trip_name || "Trip"}
                    </Text>
                    <Text
                      style={[
                        styles.tagType,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Trip
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            )}

            {/* Group Tag */}
            {!!data.group_id && (
              <TouchableOpacity
                style={[
                  styles.tagRow,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth:
                      data.savings_id || data.recurring_id ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.tagLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isDark
                          ? "rgba(59, 130, 246, 0.2)"
                          : "rgba(59, 130, 246, 0.1)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="account-group"
                      size={16}
                      color="#3B82F6"
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.tagName, { color: theme.colors.text }]}
                    >
                      {data.group_name || "Group"}
                    </Text>
                    <Text
                      style={[
                        styles.tagType,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Group
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            )}

            {/* Savings Tag */}
            {!!data.savings_id && (
              <TouchableOpacity
                style={[
                  styles.tagRow,
                  {
                    borderBottomColor: theme.colors.border,
                    borderBottomWidth: data.recurring_id ? 1 : 0,
                  },
                ]}
              >
                <View style={styles.tagLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isDark
                          ? "rgba(233, 30, 99, 0.2)"
                          : "rgba(233, 30, 99, 0.1)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="piggy-bank"
                      size={16}
                      color="#E91E63"
                    />
                  </View>
                  <View>
                    <Text
                      style={[styles.tagName, { color: theme.colors.text }]}
                    >
                      {data.savings_name || "Savings"}
                    </Text>
                    <Text
                      style={[
                        styles.tagType,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Savings Goal
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            )}

            {/* Recurring Tag */}
            {!!data.recurring_id && (
              <TouchableOpacity
                style={[styles.tagRow, { borderBottomWidth: 0 }]}
              >
                <View style={styles.tagLeft}>
                  <View
                    style={[
                      styles.iconBox,
                      {
                        backgroundColor: isDark
                          ? "rgba(99, 102, 241, 0.2)"
                          : "rgba(99, 102, 241, 0.1)",
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="refresh"
                      size={16}
                      color="#6366F1"
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.tagName,
                        {
                          color: theme.colors.text,
                          textTransform: "capitalize",
                        },
                      ]}
                    >
                      {data.recurring_frequency || "Monthly"}
                    </Text>
                    <Text
                      style={[
                        styles.tagType,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      Recurring
                    </Text>
                  </View>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Delete Button */}
        {/* Delete Button */}
        <TouchableOpacity
          style={[
            styles.deleteButton,
            {
              backgroundColor: isDark
                ? "rgba(239, 68, 68, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
            },
          ]}
          onPress={handleDelete}
          disabled={deleting}
        >
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={theme.colors.error}
          />
          <Text
            style={[styles.deleteButtonText, { color: theme.colors.error }]}
          >
            {deleting ? "Deleting..." : "Delete Transaction"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  editButton: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  editButtonText: {
    fontWeight: "700",
    fontSize: 14,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 4,
    letterSpacing: -1,
  },
  heroMerchant: {
    fontSize: 18,
    fontWeight: "500",
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    opacity: 0.8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  tagLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tagName: {
    fontSize: 14,
    fontWeight: "600",
  },
  tagType: {
    fontSize: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
