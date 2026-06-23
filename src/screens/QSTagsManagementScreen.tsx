import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useAlert } from "../context/AlertContext";
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

  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState(EVENT_COLORS[0]);
  const [formIsEvent, setFormIsEvent] = useState(false);
  const [formEventType, setFormEventType] = useState<string>("other");
  const [formEventDate, setFormEventDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formBudget, setFormBudget] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTags = useCallback(async () => {
    if (!user) return;
    const data = await getTagsByUser(user.id);
    setTags(data);
  }, [user, getTagsByUser]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

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
    setFormEventDate(null);
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
    setFormEventDate(tag.event_date ? new Date(tag.event_date) : null);
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
          event_date: formIsEvent && formEventDate ? formEventDate.toISOString() : null,
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
          event_date: formIsEvent && formEventDate ? formEventDate.toISOString() : null,
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

  const { showAlert } = useAlert();

  const handleDelete = (tag: Tag) => {
    showAlert("Delete Tag", `Permanently delete "${tag.name}"? Transactions linked will be unlinked.`, [
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
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 16,
          borderRadius: 20,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        }}
        onPress={() => router.push({ pathname: `/tag-details/[id]`, params: { id: tag.id } } as any)}
        onLongPress={() => openEdit(tag)}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: tag.color + "18",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: tag.color + "30",
            marginRight: 14,
          }}
        >
          <MaterialCommunityIcons
            name={tag.is_event ? "calendar-star" : "tag"}
            size={22}
            color={tag.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
              {tag.name}
            </Text>
            {tag.is_event && (
              <Text style={{ fontSize: 16 }}>{getEventImage(tag.event_type)}</Text>
            )}
          </View>
          {tag.is_event ? (
            <View style={{ marginTop: 4, gap: 2 }}>
              {tag.event_date && (
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  {formatDate(tag.event_date)} • {getCountdown(tag.event_date)}
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ fontSize: 12, color: theme.colors.textTertiary, marginTop: 2 }}>
              Simple Tag
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{ padding: 6, marginLeft: 8 }}
          onPress={() => handleDelete(tag)}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />
      <QSHeader
        title="Tags & Events"
        showBack
        onBackPress={() => router.back()}
        style={{ marginHorizontal: -16 }}
      />

      {/* Pill-style Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 24, marginBottom: 16, gap: 8 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: activeTab === "tags" ? theme.colors.primary : theme.colors.border,
            backgroundColor: activeTab === "tags" ? theme.colors.primary : theme.colors.card,
            alignItems: "center",
          }}
          onPress={() => setActiveTab("tags")}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: activeTab === "tags" ? "#FFFFFF" : theme.colors.textSecondary,
            }}
          >
            Tags ({simpleTags.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: activeTab === "events" ? theme.colors.primary : theme.colors.border,
            backgroundColor: activeTab === "events" ? theme.colors.primary : theme.colors.card,
            alignItems: "center",
          }}
          onPress={() => setActiveTab("events")}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: activeTab === "events" ? "#FFFFFF" : theme.colors.textSecondary,
            }}
          >
            Events ({eventTags.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
      >
        {loading && tags.length === 0 ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === "tags" && simpleTags.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.colors.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons name="tag-outline" size={32} color={theme.colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
              No tags yet
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: "center" }}>
              Tap + to create your first tag
            </Text>
          </View>
        ) : activeTab === "events" && eventTags.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.colors.primary + "15",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <MaterialCommunityIcons name="calendar-star" size={32} color={theme.colors.primary} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
              No events yet
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: "center" }}>
              Tap + to create your first event
            </Text>
          </View>
        ) : (
          (activeTab === "tags" ? simpleTags : eventTags).map(renderTagCard)
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        style={({ pressed }) => ({
          position: "absolute",
          right: 24,
          bottom: 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
          justifyContent: "center",
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          opacity: pressed ? 0.8 : 1,
        })}
        onPress={openCreate}
      >
        <MaterialCommunityIcons name="tag-plus" size={24} color={theme.colors.onPrimary} />
      </Pressable>

      {/* Create/Edit Modal */}
      <Modal transparent visible={showCreateModal} animationType="slide" onRequestClose={() => setShowCreateModal(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} onPress={() => setShowCreateModal(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, justifyContent: "flex-end" }}
          >
            <Pressable
              style={({ pressed }) => ({
                backgroundColor: theme.colors.modal,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                maxHeight: "90%",
              })}
              onPress={() => {}}
            >
              {/* Drag Handle */}
              <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.colors.textTertiary,
                    opacity: 0.4,
                  }}
                />
              </View>

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ padding: 24 }}
                showsVerticalScrollIndicator={false}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.colors.text,
                    marginBottom: 20,
                    textAlign: "center",
                  }}
                >
                  {editingTag ? "Edit Tag" : "Create Tag"}
                </Text>

                {/* Name */}
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Name
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: theme.colors.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: theme.colors.backgroundSecondary,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialCommunityIcons name="tag-outline" size={20} color={theme.colors.primary} />
                  </View>
                  <TextInput
                    style={{ flex: 1, fontSize: 16, fontWeight: "500", color: theme.colors.text, padding: 0 }}
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. reimbursable, wedding"
                    placeholderTextColor={theme.colors.textTertiary}
                  />
                </View>

                {/* Color */}
                <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Color
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                  {EVENT_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: c,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: formColor === c ? 3 : 0,
                        borderColor: theme.colors.text,
                      }}
                      onPress={() => setFormColor(c)}
                    >
                      {formColor === c && (
                        <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mark as Event Toggle */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: theme.colors.card,
                    borderRadius: 16,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    marginBottom: 16,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: formIsEvent ? "#FBBF2415" : theme.colors.backgroundSecondary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialCommunityIcons
                        name="calendar-star"
                        size={20}
                        color={formIsEvent ? "#FBBF24" : theme.colors.textSecondary}
                      />
                    </View>
                    <View>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: theme.colors.text }}>
                        Mark as Event
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.colors.textTertiary, marginTop: 1 }}>
                        Adds date, budget & countdown
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={{
                      width: 48,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: formIsEvent ? theme.colors.primary : theme.colors.border,
                      padding: 3,
                      justifyContent: "center",
                    }}
                    onPress={() => setFormIsEvent(!formIsEvent)}
                  >
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: "#FFFFFF",
                        alignSelf: formIsEvent ? "flex-end" : "flex-start",
                      }}
                    />
                  </TouchableOpacity>
                </View>

                {/* Event Fields */}
                {formIsEvent && (
                  <>
                    {/* Event Type */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Event Type
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {["birthday", "marriage", "anniversary", "festival", "travel", "other"].map((type) => (
                          <TouchableOpacity
                            key={type}
                            style={{
                              paddingHorizontal: 16,
                              paddingVertical: 10,
                              borderRadius: 20,
                              borderWidth: 1,
                              borderColor: formEventType === type ? theme.colors.primary : theme.colors.border,
                              backgroundColor: formEventType === type ? theme.colors.primary + "15" : theme.colors.card,
                            }}
                            onPress={() => setFormEventType(type)}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "600",
                                color: formEventType === type ? theme.colors.primary : theme.colors.textSecondary,
                              }}
                            >
                              {getEventImage(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Event Date with Date Picker */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Event Date
                    </Text>
                    <TouchableOpacity
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: theme.colors.card,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: formEventDate ? theme.colors.primary + "40" : theme.colors.border,
                        marginBottom: 16,
                      }}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#FB923C15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialCommunityIcons name="calendar" size={20} color="#FB923C" />
                      </View>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 16,
                          fontWeight: formEventDate ? "600" : "500",
                          color: formEventDate ? theme.colors.text : theme.colors.textTertiary,
                        }}
                      >
                        {formEventDate
                          ? formEventDate.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })
                          : "Select event date"}
                      </Text>
                      {formEventDate && (
                        <TouchableOpacity
                          onPress={() => setFormEventDate(null)}
                          style={{ padding: 4 }}
                        >
                          <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textTertiary} />
                        </TouchableOpacity>
                      )}
                      <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Budget */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Budget
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        backgroundColor: theme.colors.card,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        marginBottom: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#10B98115",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialCommunityIcons name="currency-inr" size={20} color="#10B981" />
                      </View>
                      <TextInput
                        style={{ flex: 1, fontSize: 16, fontWeight: "500", color: theme.colors.text, padding: 0 }}
                        value={formBudget}
                        onChangeText={setFormBudget}
                        placeholder="e.g. 50000"
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>

                    {/* Description */}
                    <Text style={{ fontSize: 11, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Description
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        gap: 12,
                        backgroundColor: theme.colors.card,
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        marginBottom: 16,
                        minHeight: 80,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: "#A78BFA15",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialCommunityIcons name="note-edit" size={20} color="#A78BFA" />
                      </View>
                      <TextInput
                        style={{ flex: 1, fontSize: 16, fontWeight: "500", color: theme.colors.text, padding: 0, minHeight: 48 }}
                        value={formDescription}
                        onChangeText={setFormDescription}
                        placeholder="Brief description of the event..."
                        multiline
                        placeholderTextColor={theme.colors.textTertiary}
                      />
                    </View>
                  </>
                )}

                {/* Action Buttons */}
                <View style={{ flexDirection: "row", gap: 12, marginTop: 8, marginBottom: 20 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: theme.colors.backgroundSecondary,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                    onPress={() => setShowCreateModal(false)}
                  >
                    <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.text }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 16,
                      backgroundColor: theme.colors.primary,
                      alignItems: "center",
                      opacity: saving || !formName.trim() ? 0.6 : 1,
                    }}
                    onPress={handleSave}
                    disabled={saving || !formName.trim()}
                  >
                    {saving ? (
                      <ActivityIndicator color={theme.colors.onPrimary} />
                    ) : (
                      <Text style={{ fontSize: 15, fontWeight: "700", color: theme.colors.onPrimary }}>
                        {editingTag ? "Update" : "Create"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>

      {/* Date Picker Sheet */}
      <QSDatePicker
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={formEventDate || new Date()}
        onSelect={(d) => {
          setFormEventDate(d);
          setShowDatePicker(false);
        }}
      />
    </View>
  );
}
