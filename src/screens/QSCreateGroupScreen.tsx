import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeInRight, FadeInUp } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { QSHeader } from "../components/QSHeader";
import { QSMemberSheet } from "../components/QSMemberSheet";
import { useAuth } from "../context/AuthContext";
import { useGroups } from "../hooks/useGroups";
import { useNotifications } from "../hooks/useNotifications";
import { useTrips } from "../hooks/useTrips";
import { useTheme } from "../theme/ThemeContext";

const SCREEN_WIDTH = Dimensions.get('window').width;

const COLORS = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#8B5CF6', // Violet
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#14B8A6', // Teal
];

export default function QSCreateGroupScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { createGroup, addMembersToGroup, loading } = useGroups();
    const { getTripsByUser } = useTrips();
    const { sendInvite } = useNotifications();

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(COLORS[0]);
    const [linkTrip, setLinkTrip] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
    const [trips, setTrips] = useState<any[]>([]);
    const [members, setMembers] = useState<{ name: string, email: string, id?: string }[]>([]);
    const [showInviteSheet, setShowInviteSheet] = useState(false);

    const [tripsLoading, setTripsLoading] = useState(false);

    // Fetch trips when toggled
    const handleLinkTripToggle = async (val: boolean) => {
        setLinkTrip(val);
        if (val && user && trips.length === 0) {
            setTripsLoading(true);
            const userTrips = await getTripsByUser(user.id);
            setTrips(userTrips);
            setTripsLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            Toast.show({
                type: 'error',
                text1: 'Required',
                text2: 'Please enter a group name'
            });
            return;
        }

        const groupId = await createGroup(name, "Group created via app", selectedTrip || undefined);
        if (groupId) {
            // Add members immediately
            if (members.length > 0) {
                await addMembersToGroup(groupId, members);
            }

            // Send invites to selected members
            for (const member of members) {
                await sendInvite(user?.username || "Someone", member.email, name, groupId);
            }
            if (members.length > 0) {
                Toast.show({
                    type: 'success',
                    text1: 'Success',
                    text2: 'Group created and invites sent!'
                });
                router.back();
            } else {
                router.back();
            }
        } else {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to create group'
            });
        }
    };

    const handleMembersAdded = (newMembers: { name: string; email: string; id?: string }[]) => {
        const filteredNewMembers = newMembers.filter(nm => !members.find(m => m.email === nm.email));
        if (filteredNewMembers.length > 0) {
            setMembers([...members, ...filteredNewMembers]);
        }
    };

    // Dynamic Gradient based on selection
    const getGradientColors = () => {
        // Return a complementary gradient
        return [selectedColor, theme.colors.background];
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <StatusBar barStyle="light-content" />

            {/* Background Gradient */}
            <LinearGradient
                colors={[selectedColor, theme.colors.background]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.4 }}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.15 }]}
            />

            <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.content}>
                    <QSHeader
                        title="New Group"
                        showBack
                        onBackPress={() => router.back()}
                        rightElement={
                            <TouchableOpacity onPress={handleCreate} disabled={loading}>
                                <Text style={[styles.createButtonText, { color: selectedColor, opacity: loading ? 0.5 : 1 }]}>
                                    {loading ? 'Creating...' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        }
                    />

                    {/* Icon & Name Input */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.topSection}>
                        <TouchableOpacity style={[styles.iconPicker, { backgroundColor: selectedColor }]}>
                            <MaterialCommunityIcons name="account-group" size={40} color="#FFFFFF" />
                            <View style={styles.editIconBadge}>
                                <MaterialCommunityIcons name="pencil" size={12} color={theme.colors.text} />
                            </View>
                        </TouchableOpacity>

                        <TextInput
                            style={[styles.nameInput, { color: theme.colors.text }]}
                            placeholder="Group Name"
                            placeholderTextColor={theme.colors.textTertiary}
                            value={name}
                            onChangeText={setName}
                            autoFocus
                        />
                    </Animated.View>

                    {/* Color Picker */}
                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>THEME COLOR</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorList}>
                            {COLORS.map((color, index) => (
                                <Animated.View key={color} entering={FadeInRight.delay(300 + index * 50).springify()}>
                                    <TouchableOpacity
                                        onPress={() => setSelectedColor(color)}
                                        style={[
                                            styles.colorOption,
                                            { backgroundColor: color },
                                            selectedColor === color && styles.selectedColorOption
                                        ]}
                                    >
                                        {selectedColor === color && (
                                            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                                        )}
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </Animated.View>

                    {/* Link to Trip */}
                    <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.section}>
                        <View style={styles.row}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <View style={[styles.iconBox, { backgroundColor: 'rgba(251, 191, 36, 0.1)' }]}>
                                    <MaterialCommunityIcons name="airplane" size={20} color="#FBBF24" />
                                </View>
                                <Text style={[styles.rowLabel, { color: theme.colors.text }]}>Link to a Trip</Text>
                            </View>
                            <Switch
                                value={linkTrip}
                                onValueChange={handleLinkTripToggle}
                                trackColor={{ false: theme.colors.border, true: selectedColor }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        {linkTrip && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tripList}>
                                {tripsLoading ? (
                                    <Text style={{ color: theme.colors.textSecondary, marginLeft: 16 }}>Loading trips...</Text>
                                ) : trips.length > 0 ? (
                                    trips.map((trip, index) => (
                                        <Animated.View key={trip.id} entering={FadeInRight.delay(400 + index * 50).springify()}>
                                            <TouchableOpacity
                                                style={[
                                                    styles.tripCard,
                                                    selectedTrip === trip.id && { borderColor: selectedColor, borderWidth: 2, backgroundColor: selectedColor + '10' }
                                                ]}
                                                onPress={() => setSelectedTrip(trip.id)}
                                            >
                                                <Text style={[styles.tripName, { color: theme.colors.text }]}>{trip.name}</Text>
                                                <Text style={[styles.tripDate, { color: theme.colors.textSecondary }]}>
                                                    {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </Text>
                                            </TouchableOpacity>
                                        </Animated.View>
                                    ))
                                ) : (
                                    <Text style={{ color: theme.colors.textSecondary, marginLeft: 16 }}>No active trips found.</Text>
                                )}
                            </ScrollView>
                        )}
                    </Animated.View>

                    {/* Members */}
                    <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>MEMBERS ({members.length + 1})</Text>
                        <View style={styles.membersList}>
                            {/* Admin (You) */}
                            <View style={styles.memberRow}>
                                <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                                    <Text style={styles.avatarText}>ME</Text>
                                </View>
                                <Text style={[styles.memberName, { color: theme.colors.text }]}>You (Admin)</Text>
                            </View>

                            {/* Added Members */}
                            {members.map((m, idx) => (
                                <Animated.View key={idx} entering={FadeInUp.delay(500 + idx * 50).springify()} style={styles.memberRow}>
                                    <View style={[styles.avatar, { backgroundColor: theme.colors.surface }]}>
                                        <Text style={[styles.avatarText, { color: theme.colors.text }]}>{m.name.charAt(0).toUpperCase()}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.memberName, { color: theme.colors.text }]}>{m.name}</Text>
                                        <Text style={{ fontSize: 10, color: theme.colors.textTertiary }}>{m.email}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setMembers(members.filter((_, i) => i !== idx))}>
                                        <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textTertiary} />
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}

                            {/* Add Button */}
                            <TouchableOpacity style={styles.addMemberButton} onPress={() => setShowInviteSheet(true)}>
                                <View style={[styles.addMemberIcon, { borderColor: theme.colors.border }]}>
                                    <MaterialCommunityIcons name="plus" size={20} color={theme.colors.textSecondary} />
                                </View>
                                <Text style={[styles.addMemberText, { color: theme.colors.textSecondary }]}>Add Member</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                </ScrollView>
            </View>

            {/* Invite Sheet */}
            <QSMemberSheet
                visible={showInviteSheet}
                onClose={() => setShowInviteSheet(false)}
                onMembersSelected={handleMembersAdded}
                existingMembers={members.map(m => m.name)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    closeButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: '700',
        padding: 8,
    },
    content: {
        paddingBottom: 40,
    },
    topSection: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    iconPicker: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    editIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FFF',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    nameInput: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        width: '80%',
        textAlignVertical: 'center',
    },
    section: {
        marginTop: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    colorList: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 10,
    },
    colorOption: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedColorOption: {
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
    },
    iconBox: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    tripList: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 10,
    },
    tripCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 12,
        borderRadius: 12,
        width: 140,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tripName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    tripDate: {
        fontSize: 12,
    },
    membersList: {
        paddingHorizontal: 20,
        gap: 16,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1,
    },
    addMemberButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    addMemberIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    addMemberText: {
        fontSize: 16,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        borderRadius: 16,
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    modalInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 16,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
});
