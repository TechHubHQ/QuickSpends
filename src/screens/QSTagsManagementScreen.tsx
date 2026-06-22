import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { Tag, useTags } from "../hooks/useTags";
import { useTheme } from "../theme/ThemeContext";

const EVENT_COLORS = ["#F43F5E", "#8B5CF6", "#10B981", "#F59E0B", "#06B6D4", "#EC4899", "#6366F1"];

function getEventImage(eventType?: string | null): string {
  switch (eventType) {
    case "birthday": return "🎂";
    case "marriage": return "💒";
    case "anniversary": return "💍";
    case "festival": return "🎉";
    case "travel": return "✈️";
    default: return "📌";
  }
}

export default function QSTagsManagementScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { getTagsByUser, addTag, updateTag, deleteTag, loading } = useTags();

  const [tags, setTags] = useState<Tag[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"tags" | "events">("tags");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);
  const [formIsEvent, setFormIsEvent] = useState(false);
  const [formEventType, setFormEventType] = useState<string>("other");
  const [formEventDate, setFormEventDate] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTags = async () => {
    if (!user) return;
    const data = await getTagsByUser(user.id);
    setTags(data);
  };

  useEffect(() => {
    loadTags();
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTags();
    setRefreshing(false);
  };

  const simpleTags = tags.filter((t) => !t.is_event);
  const eventTags = tags.filter((t) => t.is_event);

  const openCreate = () => {
    setEditingTag(null);
    setFormName("");
    setFormColor(EVENT_COLORS[0]);
    setFormIsEvent(false);
    setFormEventType("other");
    setFormEventDate("");
    setFormBudget("");
    setFormDescription("");
    setShowCreateModal(true);
  };

  const openEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormName(tag.name);
    setFormColor(tag.color);
    setFormIsEvent(tag.is_event);
    setFormEventType(tag.event_type || "other");
    setFormEventDate(tag.event_date ? new Date(tag.event_date).toISOString().split("T")[0] : "");
    setFormBudget(tag.budget ? String(tag.budget) : "");
    setFormDescription(tag.description || "");
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!user || !formName.trim()) return;
    setSaving(true);
    try {
      if (editingTag) {
        const updates: any = {
          name: formName.trim(),
          color: formColor,
          is_event: formIsEvent,
          event_type: formIsEvent ? formEventType : null,
          event_date: formIsEvent && formEventDate ? new Date(formEventDate).toISOString() : null,
          budget: formIsEvent && formBudget ? parseFloat(formBudget) : null,
          description: formIsEvent ? formDescription : null,
        };
        const result = await updateTag(editingTag.id, updates);
        if (result) {
          Toast.show({ type: "success", text1: "Updated", text2: "Tag updated successfully" });
        }
      } else {
        const result = await addTag({
          user_id: user.id,
          name: formName.trim(),
          color: formColor,
          is_event: formIsEvent,
          event_type: formIsEvent ? (formEventType as any) : null,
          event_date: formIsEvent && formEventDate ? new Date(formEventDate).toISOString() : null,
          budget: formIsEvent && formBudget ? parseFloat(formBudget) : null,
          description: formIsEvent ? formDescription : null,
        });
        if (result) {
          Toast.show({ type: "success", text1: "Created", text2: "Tag created successfully" });
        }
      }
      setShowCreateModal(false);
      loadTags();
    } catch (err) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to save tag" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tag: Tag) => {
    Alert.alert("Delete Tag", `Permanently delete "${tag.name}"? Transactions linked will be unlinked.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const ok = await deleteTag(tag.id);
          if (ok) {
            Toast.show({ type: "success", text1: "Deleted" });
            loadTags();
          } else {
            Toast.show({ type: "error", text1: "Error", text2: "Failed to delete tag" });
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const getCountdown = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff < 0) return "Past";
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days === 0 ? "Today!" : `${days}d left`;
  };

  const renderTagCard = (tag: Tag) => (
    <Animated.View key={tag.id} entering={FadeInUp.delay(50).springify()}>
      <TouchableOpacity
        style={[styles.tagCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        // @ts-ignore
        onPress={() => router.push({ pathname: `/tag-details/[id]`, params: { id: tag.id } })}
        onLongPress={() => openEdit(tag)}
      >
        <View style={[styles.tagColorDot, { backgroundColor: tag.color }]} />
        <View style={styles.tagCardBody}>
          <View style={styles.tagCardHeader}>
            <Text style={[styles.tagCardName, { color: theme.colors.text }]}>{tag.name}</Text>
            {tag.is_event && (
              <Text style={styles.eventEmoji}>{getEventImage(tag.event_type)}</Text>
            )}
          </View>
          {tag.is_event ? (
            <View style={styles.eventMeta}>
              {tag.event_date && (
                <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                  {formatDate(tag.event_date)} • {getCountdown(tag.event_date)}
                </Text>
              )}
              {tag.budget && (
                <View style={styles.budgetRow}>
                  <View style={[styles.miniBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
                    <View style={[styles.miniBarFill, { width: "0%", backgroundColor: tag.color }]} />
                  </View>
                  <Text style={[styles.eventMetaText, { color: theme.colors.textSecondary }]}>
                    Budget: {formatCurrency(tag.budget)}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={[styles.tagTypeLabel, { color: theme.colors.textTertiary }]}>
              Simple Tag
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(tag)}>
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <QSHeader title="Tags & Events" showBack onBackPress={() => router.back()} style={{ marginHorizontal: -16 }} />

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "tags" && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("tags")}
        >
          <Text style={[styles.tabText, { color: activeTab === "tags" ? theme.colors.primary : theme.colors.textSecondary }]}>
            Simple Tags ({simpleTags.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "events" && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab("events")}
        >
          <Text style={[styles.tabText, { color: activeTab === "events" ? theme.colors.primary : theme.colors.textSecondary }]}>
            Events ({eventTags.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
      >
        {loading && tags.length === 0 ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === "tags" && simpleTags.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No simple tags yet. Tap + to create one.</Text>
        ) : activeTab === "events" && eventTags.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No events yet. Tap + to create an event.</Text>
        ) : (
          (activeTab === "tags" ? simpleTags : eventTags).map(renderTagCard)
        )}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => [styles.fab, { backgroundColor: theme.colors.primary }, pressed && { opacity: 0.8 }]}
        onPress={openCreate}
      >
        <MaterialCommunityIcons name="tag-plus" size={24} color={theme.colors.onPrimary} />
      </Pressable>

      {/* Create/Edit Modal */}
      <Modal transparent visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.modal }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              {editingTag ? "Edit Tag" : "Create Tag"}
            </Text>

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. reimbursable, wedding"
              placeholderTextColor={theme.colors.textTertiary}
            />

            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Color</Text>
            <View style={styles.colorRow}>
              {EVENT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, formColor === c && { borderWidth: 3, borderColor: theme.colors.text }]}
                  onPress={() => setFormColor(c)}
                />
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 0 }]}>Mark as Event</Text>
              <TouchableOpacity
                style={[styles.toggle, formIsEvent && { backgroundColor: theme.colors.primary }]}
                onPress={() => setFormIsEvent(!formIsEvent)}
              >
                <View style={[styles.toggleKnob, formIsEvent && { alignSelf: "flex-end" }]} />
              </TouchableOpacity>
            </View>

            {formIsEvent && (
              <>
                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Event Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventTypeRow}>
                  {["birthday", "marriage", "anniversary", "festival", "travel", "other"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.eventTypeChip, { backgroundColor: formEventType === type ? theme.colors.primary : theme.colors.backgroundSecondary }]}
                      onPress={() => setFormEventType(type)}
                    >
                      <Text style={[styles.eventTypeText, { color: formEventType === type ? theme.colors.onPrimary : theme.colors.text }]}>
                        {getEventImage(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Event Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={formEventDate}
                  onChangeText={setFormEventDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.colors.textTertiary}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Budget (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border }]}
                  value={formBudget}
                  onChangeText={setFormBudget}
                  placeholder="e.g. 50000"
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.textTertiary}
                />

                <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Description</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, borderColor: theme.colors.border, minHeight: 60 }]}
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Brief description of the event..."
                  multiline
                  placeholderTextColor={theme.colors.textTertiary}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.backgroundSecondary }]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={[styles.modalBtnText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: theme.colors.primary }]}
                onPress={handleSave}
                disabled={saving || !formName.trim()}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.onPrimary} />
                ) : (
                  <Text style={[styles.modalBtnText, { color: theme.colors.onPrimary }]}>
                    {editingTag ? "Update" : "Create"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  tagCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  tagColorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  tagCardBody: { flex: 1 },
  tagCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tagCardName: { fontSize: 15, fontWeight: "600" },
  eventEmoji: { fontSize: 16 },
  tagTypeLabel: { fontSize: 12, marginTop: 2 },
  eventMeta: { marginTop: 4, gap: 4 },
  eventMetaText: { fontSize: 12 },
  budgetRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  miniBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  miniBarFill: { height: "100%", borderRadius: 2 },
  deleteBtn: { padding: 6, marginLeft: 8 },
  emptyText: { textAlign: "center", marginTop: 40, fontSize: 14 },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  colorRow: { flexDirection: "row", gap: 10, marginVertical: 4 },
  colorSwatch: { width: 32, height: 32, borderRadius: 16 },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#475569",
    padding: 2,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFF",
  },
  eventTypeRow: { marginBottom: 4 },
  eventTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  eventTypeText: { fontSize: 13, fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalBtnText: { fontSize: 15, fontWeight: "700" },
});
