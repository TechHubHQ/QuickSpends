import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
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
    View
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertButton, QSAlertModal } from "../components/QSAlertModal";
import { QSDatePicker } from "../components/QSDatePicker";
import { QSHeader } from "../components/QSHeader";
import { useAuth } from "../context/AuthContext";
import { useTrips } from "../hooks/useTrips";
import { fetchAndCacheImage } from "../lib/imageService";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");

export default function QSTripCreationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const tripId = params.tripId as string | undefined;

    const { theme } = useTheme();
    const isDark = theme.isDark;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { addTrip, editTrip, getTripById } = useTrips();

    const [name, setName] = useState("");
    const [budget, setBudget] = useState("");
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [tripMode, setTripMode] = useState<"single" | "multi">("single");
    const [locations, setLocations] = useState<string[]>([""]);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message?: string;
        buttons?: AlertButton[];
    }>({
        visible: false,
        title: "",
    });

    const showAlert = (title: string, message?: string, buttons?: AlertButton[]) => {
        setAlertConfig({ visible: true, title, message, buttons });
    };

    const hideAlert = () => {
        setAlertConfig((prev) => ({ ...prev, visible: false }));
    };

    useEffect(() => {
        if (tripId) {
            loadTripDetails();
        }
    }, [tripId]);

    const loadTripDetails = async () => {
        if (!tripId) return;
        const trip = await getTripById(tripId);
        if (trip) {
            setName(trip.name);
            setBudget(trip.budget ? trip.budget.toString() : "");
            setStartDate(new Date(trip.startDate));
            setEndDate(new Date(trip.endDate));
            setTripMode(trip.tripMode || "single");
            setLocations(trip.locations && trip.locations.length > 0 ? trip.locations : [""]);
            setExistingImageUrl(trip.image);
        }
    };

    const addLocationField = () => {
        setLocations([...locations, ""]);
    };

    const updateLocation = (text: string, index: number) => {
        const newLocations = [...locations];
        newLocations[index] = text;
        setLocations(newLocations);
    };

    const removeLocation = (index: number) => {
        if (locations.length > 1) {
            const newLocations = locations.filter((_, i) => i !== index);
            setLocations(newLocations);
        }
    };

    const getLocalDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSave = async () => {
        if (!name) {
            showAlert("Error", "Please enter a trip name");
            return;
        }
        if (!user) {
            showAlert("Error", "User session not found. Please log in again.");
            return;
        }

        setLoading(true);
        try {
            const validLocations = locations.filter(loc => loc.trim() !== "");
            const primaryLocation = validLocations[0] || name;

            // Fetch image only if location changed or new trip, else keep existing
            // Simple check: if editing, and primary location name is in existing image url (unreliable) 
            // OR just strictly check if validLocations[0] changed? 
            // For now: Always fetch new image if name/location changed? 
            // Let's reuse existing image if editing and not forcing update, but here we don't have "force update".
            // Let's just fetch if it's a new trip. If editing, maybe keep old image unless user wants to change?
            // Current simplified logic: If editing, keep image unless we want to implement logic to detect change. 
            // Note: User can't explicitly change image in UI yet.
            // Let's re-fetch image if the primary location string has changed significantly from what might be cached? 
            // Safest: If editing, keep existingImageUrl. If new, fetch.

            let imageUrl = existingImageUrl;
            
            // Check for local file paths which are not shareable
            const isLocalImage = imageUrl && (imageUrl.startsWith('file://') || imageUrl.startsWith('/') || imageUrl.startsWith('content://'));
            
            if (!tripId || !imageUrl || isLocalImage) {
                // Fetch new image if none exists or if it's a local file
                imageUrl = await fetchAndCacheImage(primaryLocation);
            }

            if (tripId) {
                // UPDATE
                const result = await editTrip(tripId, {
                    name,
                    budget: budget ? parseFloat(budget) : 0,
                    startDate: getLocalDateString(startDate),
                    endDate: getLocalDateString(endDate),
                    locations: validLocations,
                    tripMode: tripMode,
                });

                if (result.success) {
                    router.back();
                } else {
                    showAlert("Error", `Failed to update trip: ${result.error}`);
                }

            } else {
                // CREATE
                const result = await addTrip({
                    name,
                    user_id: user.id,
                    budget_amount: budget ? parseFloat(budget) : 0,
                    start_date: getLocalDateString(startDate),
                    end_date: getLocalDateString(endDate),
                    base_currency: "INR", // Default to INR
                    locations: validLocations,
                    trip_mode: tripMode,
                    image_url: imageUrl || undefined
                });

                if (result.success) {
                    router.back();
                } else {
                    showAlert("Error", `Failed to create trip: ${result.error || "Unknown error"}`);
                }
            }
        } catch (err: any) {
            showAlert("Error", `An unexpected error occurred: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    // UI Colors
    const bgColor = isDark ? "#000000" : "#FFFFFF";
    const gradColors = isDark
        ? ["#0F172A", "#1E293B", "#0F172A"]
        : ["#F8FAFC", "#FFFFFF", "#F1F5F9"];

    const Container: any = Platform.OS === "web" ? View : TouchableWithoutFeedback;
    const containerProps = Platform.OS === "web" ? { style: { flex: 1 } } : { onPress: Keyboard.dismiss };

    return (
        <Container {...containerProps}>
            <View style={{ flex: 1, backgroundColor: bgColor }}>
                <LinearGradient
                    colors={gradColors as [string, string, ...string[]]}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 0 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <QSHeader
                            title={tripId ? "Edit Trip" : "Plan New Trip"}
                            showBack
                            onBackPress={() => router.back()}
                        />
                        <View style={{ paddingHorizontal: 24 }}>

                            {/* Trip Name */}
                            <Animated.View entering={FadeInDown.delay(100).springify()}>
                                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                    Where are you going?
                                </Text>
                                <View style={[styles.inputContainer, { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                    <TextInput
                                        style={[styles.nameInput, { color: theme.colors.text }]}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Trip Name (e.g. Goa Vibes)"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        autoFocus={!tripId}
                                        multiline={false}
                                        numberOfLines={1}
                                    />
                                </View>
                            </Animated.View>

                            {/* Date Range */}
                            <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 32 }}>
                                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                    When is it happening?
                                </Text>
                                <View style={styles.dateRow}>
                                    <TouchableOpacity
                                        style={[styles.dateButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderColor: theme.colors.border }]}
                                        onPress={() => setShowStartDatePicker(true)}
                                    >
                                        <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>Start Date</Text>
                                        <Text style={[styles.dateValue, { color: theme.colors.text }]}>{formatDate(startDate)}</Text>
                                    </TouchableOpacity>

                                    <View style={styles.dateSeparator}>
                                        <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.textTertiary} />
                                    </View>

                                    <TouchableOpacity
                                        style={[styles.dateButton, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFFFFF", borderColor: theme.colors.border }]}
                                        onPress={() => setShowEndDatePicker(true)}
                                    >
                                        <Text style={[styles.dateLabel, { color: theme.colors.textSecondary }]}>End Date</Text>
                                        <Text style={[styles.dateValue, { color: theme.colors.text }]}>{formatDate(endDate)}</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>

                            {/* Budget */}
                            <Animated.View entering={FadeInDown.delay(400).springify()} style={{ marginTop: 32 }}>
                                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                    Budget (Optional)
                                </Text>
                                <View style={[styles.amountInputContainer, { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                    <Text style={[styles.currencyPrefix, { color: theme.colors.primary }]}>₹</Text>
                                    <TextInput
                                        style={[styles.amountInput, { color: theme.colors.text }]}
                                        value={budget}
                                        onChangeText={setBudget}
                                        placeholder="0"
                                        placeholderTextColor={theme.colors.textSecondary}
                                        keyboardType="numeric"
                                        multiline={false}
                                        numberOfLines={1}
                                        textAlignVertical="center"
                                    />
                                </View>
                            </Animated.View>

                            {/* Location Selection */}
                            <Animated.View entering={FadeInDown.delay(450).springify()} style={{ marginTop: 32 }}>
                                <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>
                                    Where are you heading?
                                </Text>
                                <View style={[styles.toggleContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", marginBottom: 16 }]}>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggleOption,
                                            tripMode === "single" && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                                        ]}
                                        onPress={() => setTripMode("single")}
                                    >
                                        <Text style={[styles.toggleText, { color: tripMode === "single" ? "#FFF" : theme.colors.textSecondary }]}>Single</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.toggleOption,
                                            tripMode === "multi" && { backgroundColor: theme.colors.primary, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                                        ]}
                                        onPress={() => setTripMode("multi")}
                                    >
                                        <Text style={[styles.toggleText, { color: tripMode === "multi" ? "#FFF" : theme.colors.textSecondary }]}>Multi-city</Text>
                                    </TouchableOpacity>
                                </View>

                                {tripMode === "single" ? (
                                    <View style={[styles.inputContainer, { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                        <TextInput
                                            style={[styles.nameInput, { color: theme.colors.text, fontSize: 18 }]}
                                            value={locations[0]}
                                            onChangeText={(text) => updateLocation(text, 0)}
                                            placeholder="Enter city or place"
                                            placeholderTextColor={theme.colors.textSecondary}
                                        />
                                    </View>
                                ) : (
                                    <View style={{ gap: 12 }}>
                                        {locations.map((loc, index) => (
                                            <View key={index} style={styles.multiLocationRow}>
                                                <View style={[styles.inputContainer, { flex: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }]}>
                                                    <TextInput
                                                        style={[styles.nameInput, { color: theme.colors.text, fontSize: 16, height: 40 }]}
                                                        value={loc}
                                                        onChangeText={(text) => updateLocation(text, index)}
                                                        placeholder={`Stop ${index + 1}`}
                                                        placeholderTextColor={theme.colors.textSecondary}
                                                    />
                                                </View>
                                                {locations.length > 1 && (
                                                    <TouchableOpacity onPress={() => removeLocation(index)} style={styles.removeLocButton}>
                                                        <MaterialCommunityIcons name="close-circle-outline" size={24} color={theme.colors.error} />
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                        <TouchableOpacity style={styles.addLocButton} onPress={addLocationField}>
                                            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.primary} />
                                            <Text style={[styles.addLocText, { color: theme.colors.primary }]}>Add another stop</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </Animated.View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer Action */}
                <Animated.View
                    entering={FadeInUp.delay(500).springify()}
                    style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }]}
                >
                    <TouchableOpacity
                            style={[
                                styles.saveButton,
                                { backgroundColor: theme.colors.primary },
                            !name && { opacity: 0.5 }
                        ]}
                        disabled={!name || loading || !user}
                        onPress={handleSave}
                    >
                        <Text style={styles.saveButtonText}>
                            {loading ? (tripId ? "Updating..." : "Creating...") : (tripId ? "Update Trip" : "Create Trip")}
                        </Text>
                        {!loading && <MaterialCommunityIcons name={tripId ? "check" : "airplane-takeoff"} size={24} color="#FFF" />}
                    </TouchableOpacity>
                </Animated.View>

                {/* Date Pickers */}
                <QSDatePicker
                    visible={showStartDatePicker}
                    onClose={() => setShowStartDatePicker(false)}
                    selectedDate={startDate}
                    onSelect={(date) => {
                        setStartDate(date);
                        if (date > endDate) setEndDate(new Date(date.getTime() + 24 * 60 * 60 * 1000));
                    }}
                />
                <QSDatePicker
                    visible={showEndDatePicker}
                    onClose={() => setShowEndDatePicker(false)}
                    selectedDate={endDate}
                    onSelect={(date) => setEndDate(date)}
                />

                <QSAlertModal
                    visible={alertConfig.visible}
                    title={alertConfig.title}
                    message={alertConfig.message}
                    onClose={hideAlert}
                    buttons={alertConfig.buttons}
                />
            </View>
        </Container>
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
    inputContainer: {
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    nameInput: {
        fontSize: 23,
        fontWeight: 'bold',
        height: 50,
        paddingVertical: 0,
    },
    toggleContainer: {
        flexDirection: 'row',
        padding: 4,
        borderRadius: 16,
    },
    toggleOption: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        gap: 8,
    },
    toggleText: {
        fontSize: 16,
        fontWeight: '600',
    },
    selectorButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    selectorText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateButton: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
    },
    dateLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginBottom: 4,
    },
    dateValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    dateSeparator: {
        width: 20,
        alignItems: 'center',
    },
    amountInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingBottom: 8,
    },
    currencyPrefix: {
        fontSize: 32,
        fontWeight: 'bold',
        marginRight: 8,
    },
    amountInput: {
        flex: 1,
        fontSize: 32,
        fontWeight: 'bold',
        height: 50,
        paddingVertical: 0,
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
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
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
    multiLocationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    removeLocButton: {
        padding: 4,
    },
    addLocButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    addLocText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
