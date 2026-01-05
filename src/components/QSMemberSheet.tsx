import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useTheme } from "../theme/ThemeContext";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSMemberSheetProps {
    visible: boolean;
    onClose: () => void;
    onMembersSelected: (members: { name: string; phone: string; id?: string }[]) => void;
    existingMembers?: string[]; // to avoid adding duplicates
}

import { useAuth } from "../context/AuthContext";

import * as Contacts from 'expo-contacts';

export const QSMemberSheet: React.FC<QSMemberSheetProps> = ({
    visible,
    onClose,
    onMembersSelected,
    existingMembers = []
}) => {
    const { theme } = useTheme();
    const { user } = useAuth(); // Get current user
    const [searchText, setSearchText] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Contacts.requestPermissionsAsync();
            setPermissionGranted(status === 'granted');
        })();
    }, []);

    // Fetch contacts and sync with DB
    useEffect(() => {
        if (visible && user) {
            syncContacts();
            setSelectedUsers([]); // Reset selection when sheet opens
        }
    }, [visible, user, permissionGranted]);

    const normalizePhone = (phone: string) => {
        // Remove spaces, dashes, parentheses
        let cleaned = phone.replace(/[\s\-\(\)]/g, '');
        // If it starts with 0, remove it (assuming localized)
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        // If it doesn't have country code (assuming +91 for IN or general), just return as is or handle logic
        // For matching, we might want to match last 10 digits
        return cleaned.slice(-10);
    };

    const syncContacts = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const avatarUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAD7mWjrHawdcvg72D_ee4L0F4QjJxoQfOzVfXjJ65F9-GC4F5LyIrnMaId9frI4qeCg0TvlKBdDSNmWtiIXcvzMtxtiwiNEIJSnOYjpaC8kpvJn35xAqmWHbLQkuntEU0NLJiMseBtsZzfgZJxAgPOXlJp65B5pZcpbE-2irapS00uAdbPfoTTob9nEFve_mYCgfdMkaIK0KqYRMODRUtvH4jAlt6Ry8sMSn7WWgSzKNKqJI2HNH5uydSuMzSb2cA_Wt261a4Kz7o';

            // 1. Get Mobile Contacts
            let mobileContacts: string[] = [];
            if (permissionGranted) {
                const { data } = await Contacts.getContactsAsync({
                    fields: [Contacts.Fields.PhoneNumbers],
                });

                if (data.length > 0) {
                    data.forEach(c => {
                        if (c.phoneNumbers) {
                            c.phoneNumbers.forEach(p => {
                                const normalized = normalizePhone(p.number || '');
                                if (normalized.length >= 10) {
                                    mobileContacts.push(normalized);
                                }
                            });
                        }
                    });
                }
            }

            // 2. Fetch All Users from profiles (Optimized: In real app, send contacts list to backend)
            // For now, fetching users that match mobile contacts
            const { data: matchedUsers, error } = await supabase
                .from('profiles')
                .select('id, username, phone, avatar')
                .neq('id', user.id)
                .in('phone', mobileContacts); // Assuming phone in DB matches what we extracted

            if (error) throw error;

            setSuggestedUsers((matchedUsers || []).map(u => ({
                id: u.id,
                name: u.username,
                phone: u.phone,
                avatar: u.avatar
            })));

        } catch (error) {
            console.log("Error syncing contacts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (text: string) => {
        setSearchText(text);
        if (text.length > 0 && user) {
            setLoading(true);
            try {
                const { data: users, error } = await supabase
                    .from('profiles')
                    .select('id, username, phone')
                    .neq('id', user.id)
                    .or(`phone.ilike.%${text}%,username.ilike.%${text}%`);

                if (error) throw error;

                setSearchResults((users || []).map(u => ({
                    id: u.id,
                    name: u.username,
                    phone: u.phone
                })));
            } catch (error) {
                console.log("Error searching users:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const toggleSelection = (user: any) => {
        const isSelected = selectedUsers.find(u => u.phone === user.phone);
        if (isSelected) {
            setSelectedUsers(selectedUsers.filter(u => u.phone !== user.phone));
        } else {
            setSelectedUsers([...selectedUsers, user]);
        }
    };

    const handleDone = () => {
        if (selectedUsers.length > 0) {
            onMembersSelected(selectedUsers.map(u => ({
                name: u.name,
                phone: u.phone,
                id: u.id
            })));
        }
        setSearchText("");
        setSearchResults([]);
        setSelectedUsers([]);
        onClose();
    };

    const renderUserItem = (user: any, isSuggestion = false) => {
        const isAlreadyMember = existingMembers.includes(user.name); // Simple check by name for now
        const isSelected = selectedUsers.find(u => u.phone === user.phone);

        return (
            <TouchableOpacity
                key={user.id || user.phone}
                style={[styles.userRow, { borderColor: theme.colors.border }]}
                onPress={() => !isAlreadyMember && toggleSelection(user)}
                disabled={isAlreadyMember}
            >
                <View style={[styles.avatar, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={{ color: theme.colors.primary, fontWeight: '700' }}>
                        {user.name.charAt(0).toUpperCase()}
                    </Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>{user.name}</Text>
                    <Text style={[styles.userPhone, { color: theme.colors.textSecondary }]}>{user.phone}</Text>
                </View>
                {isAlreadyMember ? (
                    <MaterialCommunityIcons name="check-circle" size={24} color={theme.colors.success} />
                ) : isSelected ? (
                    <View style={[styles.addButton, { backgroundColor: theme.colors.primary }]}>
                        <MaterialCommunityIcons name="check" size={20} color="#FFF" />
                    </View>
                ) : (
                    <View style={[styles.addButton, { backgroundColor: theme.colors.surface }]}>
                        <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title="Add Members"
            showSearch
            searchPlaceholder="Search by name or phone"
            searchValue={searchText}
            onSearchChange={handleSearch}
            showDoneButton={selectedUsers.length > 0}
            onDone={handleDone}
        >
            <View style={{ paddingBottom: 24 }}>
                {searchText.length > 0 ? (
                    <>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SEARCH RESULTS</Text>
                        {searchResults.length > 0 ? (
                            searchResults.map(user => renderUserItem(user))
                        ) : (
                            !loading && <Text style={{ padding: 16, color: theme.colors.textTertiary, textAlign: 'center' }}>No users found</Text>
                        )}
                    </>
                ) : (
                    <>
                        {suggestedUsers.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>SUGGESTED</Text>
                                {suggestedUsers.map(user => renderUserItem(user, true))}
                            </>
                        )}
                    </>
                )}
            </View>
        </QSBottomSheet>
    );
};

const styles = StyleSheet.create({
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        marginTop: 8,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
    },
    userPhone: {
        fontSize: 12,
        marginTop: 2,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
