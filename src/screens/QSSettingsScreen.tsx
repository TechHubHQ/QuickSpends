import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Avatar, TOTAL_AVATARS } from '../components/Avatar';
import { QSHeader } from '../components/QSHeader';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { PREMIUM_THEMES, Theme } from '../theme/theme';

// Premium 3D & Notion Style Avatars
const AVATAR_OPTIONS = Array.from({ length: TOTAL_AVATARS }, (_, i) => String(i));


const QSSettingsScreen = () => {
    const { theme, toggleTheme, themeId, setThemeId, updateCustomOverrides, customOverrides } = useTheme();
    const styles = createStyles(theme);
    const { user, signOut, updateProfile } = useAuth();
    const router = useRouter();

    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [editName, setEditName] = useState(user?.username || '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0]);

    const handleSaveProfile = async () => {
        try {
            await updateProfile({
                username: editName,
                avatar: selectedAvatar
            });
            setProfileModalVisible(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAvatarSelect = (url: string) => {
        setSelectedAvatar(url);
    };

    const renderThemeOption = (preset: typeof PREMIUM_THEMES[0]) => {
        const isSelected = themeId === preset.id;

        // Determine preview colors
        const previewBg = preset.background || (preset.type === 'dark' ? '#101922' : '#F8FAFC');
        const previewPrimary = preset.primary;

        return (
            <TouchableOpacity
                key={preset.id}
                style={[
                    styles.themeOption,
                    isSelected && styles.selectedThemeOption
                ]}
                onPress={() => setThemeId(preset.id)}
            >
                <View style={[styles.themePreview, { backgroundColor: previewBg }]}>
                    <View style={[styles.themePreviewCircle, { backgroundColor: previewPrimary }]} />
                    <View style={[styles.themePreviewLine, { backgroundColor: previewPrimary, opacity: 0.5 }]} />
                    <View style={[styles.themePreviewLine, { width: 20, backgroundColor: previewPrimary, opacity: 0.3 }]} />
                </View>
                <Text style={[styles.themeName, isSelected && { color: theme.colors.primary }]}>
                    {preset.name}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <QSHeader title="Settings" />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Profile</Text>
                    <View style={styles.profileCard}>
                        <Avatar
                            seed={user?.avatar || user?.username || 'User'}
                            size={60}
                            style={{ marginRight: 16 }}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.username || 'User'}</Text>
                            <Text style={styles.profilePhone}>{user?.email || 'No email'}</Text>
                        </View>
                        <TouchableOpacity style={styles.editButton} onPress={() => {
                            setEditName(user?.username || '');
                            setSelectedAvatar(user?.avatar || AVATAR_OPTIONS[0]);
                            setProfileModalVisible(true);
                        }}>
                            <MaterialCommunityIcons name="pencil" size={20} color={theme.colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Appearance Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Appearance</Text>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLabel}>
                            <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.colors.text} />
                            <Text style={styles.settingText}>Dark Mode Toggle</Text>
                        </View>
                        <Switch
                            value={theme.isDark}
                            onValueChange={toggleTheme}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={'#FFF'}
                        />
                    </View>

                    <View style={styles.colorPickerContainer}>
                        <Text style={styles.subLabel}>Theme Style</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.themeList}>
                            {PREMIUM_THEMES.map(renderThemeOption)}
                        </ScrollView>
                    </View>

                    {/* Customization Section */}
                    <View style={styles.customizationContainer}>
                        <Text style={styles.subLabel}>Primary Color</Text>
                        <View style={styles.customColorList}>
                            {[
                                { name: 'Indigo', color: '#6366F1' },
                                { name: 'Emerald', color: '#10B981' },
                                { name: 'Amber', color: '#F59E0B' },
                                { name: 'Rose', color: '#F43F5E' },
                                { name: 'Cyan', color: '#06B6D4' },
                                { name: 'Violet', color: '#8B5CF6' },
                            ].map((c) => (
                                <TouchableOpacity
                                    key={c.name}
                                    style={styles.customColorOption}
                                    onPress={() => updateCustomOverrides({ primary: c.color })}
                                >
                                    <View style={[styles.colorBubble, { backgroundColor: c.color }, customOverrides.primary === c.color && styles.selectedColorBubble]} />
                                    <Text style={styles.colorBubbleLabel}>{c.name}</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity
                                style={styles.customColorOption}
                                onPress={() => updateCustomOverrides({ primary: undefined })}
                            >
                                <View style={[styles.colorBubble, { backgroundColor: theme.colors.border, borderWidth: 1, borderStyle: 'dashed' }]} >
                                    <MaterialCommunityIcons name="close" size={16} color={theme.colors.textSecondary} />
                                </View>
                                <Text style={styles.colorBubbleLabel}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.subLabel, { marginTop: theme.spacing.m }]}>Corner Settings</Text>
                        <View style={styles.optionRow}>
                            {[
                                { id: 'sharp', label: 'Sharp', icon: 'square-outline' },
                                { id: 'medium', label: 'Default', icon: 'square-rounded-outline' },
                                { id: 'rounded', label: 'Rounded', icon: 'checkbox-blank-circle-outline' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.optionButton,
                                        customOverrides.borderRadius === opt.id && styles.selectedOptionButton
                                    ]}
                                    onPress={() => updateCustomOverrides({ borderRadius: opt.id as any })}
                                >
                                    <MaterialCommunityIcons
                                        name={opt.icon as any}
                                        size={20}
                                        color={customOverrides.borderRadius === opt.id ? theme.colors.onPrimary : theme.colors.textSecondary}
                                    />
                                    <Text style={[
                                        styles.optionButtonText,
                                        customOverrides.borderRadius === opt.id && { color: theme.colors.onPrimary }
                                    ]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.subLabel, { marginTop: theme.spacing.m }]}>Shadow Intensity</Text>
                        <View style={styles.optionRow}>
                            {[
                                { id: 'none', label: 'None' },
                                { id: 'low', label: 'Low' },
                                { id: 'medium', label: 'Med' },
                                { id: 'high', label: 'High' },
                            ].map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[
                                        styles.optionButton,
                                        (customOverrides.shadowIntensity === opt.id || (!customOverrides.shadowIntensity && opt.id === 'medium')) && styles.selectedOptionButton
                                    ]}
                                    onPress={() => updateCustomOverrides({ shadowIntensity: opt.id as any })}
                                >
                                    <Text style={[
                                        styles.optionButtonText,
                                        (customOverrides.shadowIntensity === opt.id || (!customOverrides.shadowIntensity && opt.id === 'medium')) && { color: theme.colors.onPrimary }
                                    ]}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </View>

                {/* App Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Settings</Text>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/category-management')}
                    >
                        <View style={styles.menuIcon}>
                            <MaterialCommunityIcons name="shape" size={24} color={theme.colors.secondary} />
                        </View>
                        <Text style={styles.menuText}>Manage Categories</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push('/notification-settings')}
                    >
                        <View style={styles.menuIcon}>
                            <MaterialCommunityIcons name="bell-outline" size={24} color={theme.colors.info} />
                        </View>
                        <Text style={styles.menuText}>Manage Notifications</Text>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.textTertiary} />
                    </TouchableOpacity>
                </View>

                {/* Account Section */}
                <View style={styles.section}>
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={async () => {
                            await signOut();
                            router.replace('/');
                        }}
                    >
                        <MaterialCommunityIcons name="logout" size={20} color={theme.colors.error} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Edit Profile Modal */}
            <Modal
                transparent
                visible={isProfileModalVisible}
                animationType="slide"
                onRequestClose={() => setProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>

                        <Text style={styles.inputLabel}>Choose Avatar</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarList}>
                            {AVATAR_OPTIONS.map((url, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleAvatarSelect(url)}
                                    style={[
                                        styles.avatarOption,
                                        selectedAvatar === url && styles.selectedAvatarOption
                                    ]}
                                >
                                    <Avatar
                                        seed={url}
                                        size={50}
                                        variant="beam"
                                    />
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Your Name"
                            placeholderTextColor={theme.colors.textTertiary}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setProfileModalVisible(false)}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveProfile}
                            >
                                <Text style={styles.saveText}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        padding: theme.spacing.m,
        paddingBottom: 40,
    },
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.l,
        ...theme.shadows.small,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: theme.spacing.m,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        ...theme.typography.h3,
        color: theme.colors.text,
    },
    profilePhone: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    editButton: {
        padding: theme.spacing.s,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.round,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.small,
    },
    settingLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.s,
    },
    settingText: {
        ...theme.typography.body,
        color: theme.colors.text,
    },
    colorPickerContainer: {
        marginTop: theme.spacing.m,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.small,
    },
    subLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.s,
    },
    themeList: {
        gap: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
    themeOption: {
        alignItems: 'center',
        gap: theme.spacing.s,
        width: 80,
    },
    selectedThemeOption: {
        opacity: 1,
    },
    themePreview: {
        width: 60,
        height: 60,
        borderRadius: 30, // Circle for premium feel
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.colors.border,
        ...theme.shadows.small,
        padding: 10,
        gap: 4,
    },
    themePreviewCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    themePreviewLine: {
        width: 30,
        height: 4,
        borderRadius: 2,
    },
    themeName: {
        ...theme.typography.caption,
        color: theme.colors.text,
        textAlign: 'center',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        marginBottom: theme.spacing.s,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.small,
    },
    menuIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.m,
    },
    menuText: {
        flex: 1,
        ...theme.typography.body,
        fontWeight: '500',
        color: theme.colors.text,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        borderWidth: 1,
        borderColor: theme.colors.error,
        gap: theme.spacing.s,
    },
    logoutText: {
        ...theme.typography.button,
        color: theme.colors.error,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        padding: theme.spacing.l,
    },
    modalContent: {
        backgroundColor: theme.colors.modal,
        borderRadius: theme.borderRadius.l,
        padding: theme.spacing.l,
    },
    modalTitle: {
        ...theme.typography.h2,
        color: theme.colors.text,
        marginBottom: theme.spacing.m,
        textAlign: 'center',
    },
    inputLabel: {
        ...theme.typography.bodySmall,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.s,
        marginTop: theme.spacing.m,
    },
    input: {
        backgroundColor: theme.colors.backgroundSecondary,
        padding: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        color: theme.colors.text,
        fontSize: 16,
    },
    avatarList: {
        flexDirection: 'row',
        marginBottom: theme.spacing.m,
    },
    avatarOption: {
        marginRight: theme.spacing.s,
        padding: 4,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedAvatarOption: {
        borderColor: theme.colors.primary,
    },
    avatarSmall: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: theme.colors.backgroundSecondary,
    },
    modalActions: {
        flexDirection: 'row',
        gap: theme.spacing.m,
        marginTop: theme.spacing.xl,
    },
    modalButton: {
        flex: 1,
        paddingVertical: theme.spacing.m,
        borderRadius: theme.borderRadius.m,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.backgroundSecondary,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
    },
    cancelText: {
        ...theme.typography.button,
        color: theme.colors.text,
    },
    saveText: {
        ...theme.typography.button,
        color: theme.colors.onPrimary,
    },
    customizationContainer: {
        marginTop: theme.spacing.m,
        padding: theme.spacing.m,
        backgroundColor: theme.colors.card,
        borderRadius: theme.borderRadius.m,
        ...theme.shadows.small,
    },
    customColorList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.m,
        paddingVertical: theme.spacing.s,
    },
    customColorOption: {
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    colorBubble: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    colorBubbleLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    selectedColorBubble: {
        borderWidth: 3,
        borderColor: theme.colors.text,
    },
    optionRow: {
        flexDirection: 'row',
        gap: theme.spacing.s,
        marginTop: theme.spacing.xs,
    },
    optionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.s,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.borderRadius.s,
        gap: 6,
    },
    selectedOptionButton: {
        backgroundColor: theme.colors.primary,
    },
    optionButtonText: {
        ...theme.typography.bodySmall,
        fontWeight: '600',
        color: theme.colors.text,
    },
});

export default QSSettingsScreen;
