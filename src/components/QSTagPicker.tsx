import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View, TextInput, ActivityIndicator } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useTags, Tag, SYSTEM_TAG_NAMES } from "../hooks/useTags";
import { useAuth } from "../context/AuthContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSTagPickerProps {
    visible: boolean;
    onClose: () => void;
    selectedIds?: string[];
    onSelect: (tags: Tag[]) => void;
}

export function QSTagPicker({
    visible,
    onClose,
    selectedIds = [],
    onSelect,
}: QSTagPickerProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { getTagsByUser, addTag, loading } = useTags();

    const [tags, setTags] = useState<Tag[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [creating, setCreating] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));

    useEffect(() => {
        if (visible) {
            setSelected(new Set(selectedIds));
        }
    }, [visible, selectedIds]);

    useEffect(() => {
        if (visible && user) {
            loadTags();
        }
    }, [visible, user]);

    const loadTags = async () => {
        if (!user) return;
        const fetchedTags = await getTagsByUser(user.id);
        setTags(fetchedTags);
    };

    const filteredTags = tags.filter(tag =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleToggle = (tag: Tag) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(tag.id)) {
                next.delete(tag.id);
            } else {
                next.add(tag.id);
            }
            return next;
        });
    };

    const handleDone = () => {
        const selectedTags = tags.filter(t => selected.has(t.id));
        onSelect(selectedTags);
        onClose();
    };

    const handleQuickCreate = async () => {
        if (!user || !searchQuery.trim()) return;
        const cleanName = searchQuery.trim().replace(/^#/, "");
        if (SYSTEM_TAG_NAMES.includes(cleanName as any)) return;
        setCreating(true);
        try {
            const colors = ["#6366F1", "#10B981", "#F59E0B", "#F43F5E", "#06B6D4", "#8B5CF6", "#EC4899"];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];

            const newTag = await addTag({
                user_id: user.id,
                name: cleanName,
                color: randomColor,
                is_event: false,
            });

            if (newTag) {
                setSearchQuery("");
                setTags(prev => [newTag, ...prev].sort((a, b) => a.name.localeCompare(b.name)));
                setSelected(prev => new Set(prev).add(newTag.id));
            }
        } catch (error) {
            console.error("Error creating tag on the fly:", error);
        } finally {
            setCreating(false);
        }
    };

    const exactMatchExists = tags.some(
        (tag) => tag.name.toLowerCase() === searchQuery.trim().toLowerCase()
    );

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Select Tags"
            showSearch
            searchPlaceholder="Search or type new tag..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            showDoneButton
            onDone={handleDone}
        >
            <View style={styles.list}>
                {/* Quick Create option if text typed does not match exactly */}
                {searchQuery.trim().length > 0 && !exactMatchExists && (
                    <TouchableOpacity
                        style={[
                            styles.item,
                            {
                                backgroundColor: theme.colors.primary + "08",
                                borderColor: theme.colors.primary + "30",
                                borderStyle: "dashed",
                                borderWidth: 1,
                            },
                        ]}
                        onPress={handleQuickCreate}
                        disabled={creating}
                    >
                        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + "20" }]}>
                            {creating ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : (
                                <MaterialCommunityIcons name="tag-plus" size={22} color={theme.colors.primary} />
                            )}
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemText, { color: theme.colors.primary }]}>
                                {`Create tag "#${searchQuery.trim().replace(/^#/, "")}"`}
                            </Text>
                            <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>
                                Create and attach this tag instantly
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                {/* Tags List */}
                {loading && tags.length === 0 ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                ) : filteredTags.length === 0 ? (
                    searchQuery.trim() === "" ? (
                        <View style={styles.center}>
                            <Text style={[styles.noTagsText, { color: theme.colors.textSecondary }]}>
                                No tags created yet.
                            </Text>
                            <Text style={[styles.noTagsSub, { color: theme.colors.textTertiary }]}>
                                Type in search to create a new tag.
                            </Text>
                        </View>
                    ) : null
                ) : (
                    filteredTags.map((tag) => {
                        const isSelected = selected.has(tag.id);
                        return (
                            <TouchableOpacity
                                key={tag.id}
                                style={[
                                    styles.item,
                                    isSelected && {
                                        backgroundColor: theme.colors.primary + "10",
                                        borderColor: theme.colors.primary + "30",
                                    },
                                ]}
                                onPress={() => handleToggle(tag)}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: tag.color + "20" }]}>
                                    <MaterialCommunityIcons
                                        name={tag.is_system ? "shield-check" : tag.is_event ? "calendar-star" : "tag"}
                                        size={22}
                                        color={tag.color}
                                    />
                                </View>
                                <View style={styles.tagInfo}>
                                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                                        <Text style={[styles.itemText, { color: theme.colors.text }]}>
                                            {tag.name}
                                        </Text>
                                        {tag.is_system && (
                                            <View style={[styles.eventBadge, { backgroundColor: tag.color + "20" }]}>
                                                <Text style={[styles.eventBadgeText, { color: tag.color }]}>
                                                    System
                                                </Text>
                                            </View>
                                        )}
                                        {tag.is_event && !tag.is_system && (
                                            <View style={[styles.eventBadge, { backgroundColor: theme.colors.success + "15" }]}>
                                                <Text style={[styles.eventBadgeText, { color: theme.colors.success }]}>
                                                    {tag.event_type || "Event"}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[styles.subText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                        {tag.is_system
                                            ? "Auto-classification tag"
                                            : tag.is_event
                                                ? `Budget: ${tag.budget ? `₹${tag.budget}` : "No budget"} • ${tag.description || "Event Group"}`
                                                : "Categorization Tag"}
                                    </Text>
                                </View>
                                {isSelected ? (
                                    <MaterialCommunityIcons name="checkbox-marked" size={24} color={theme.colors.primary} />
                                ) : (
                                    <MaterialCommunityIcons
                                        name="checkbox-blank-outline"
                                        size={24}
                                        color={theme.isDark ? "#475569" : "#CBD5E1"}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })
                )}
            </View>
        </QSBottomSheet>
    );
}

const styles = StyleSheet.create({
    list: {
        gap: 8,
        paddingBottom: 24,
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "transparent",
    },
    clearItem: {
        borderStyle: "dashed",
        borderWidth: 1,
        borderColor: "#EF444450",
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    tagInfo: {
        flex: 1,
    },
    itemText: {
        fontSize: 15,
        fontWeight: "600",
    },
    subText: {
        fontSize: 12,
        marginTop: 2,
    },
    eventBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    eventBadgeText: {
        fontSize: 9,
        fontWeight: "bold",
        textTransform: "uppercase",
    },
    center: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
    },
    noTagsText: {
        fontSize: 15,
        fontWeight: "600",
        marginBottom: 4,
    },
    noTagsSub: {
        fontSize: 13,
    },
});
