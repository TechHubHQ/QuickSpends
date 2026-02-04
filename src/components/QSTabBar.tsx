import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Dimensions, Modal, Pressable, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Path, Svg } from "react-native-svg";
import { createStyles } from "../styles/components/QSTabBar.styles";
import { useTheme } from "../theme/ThemeContext";

const { width } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 70;
const FAB_SIZE = 56;

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme.isDark;
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme.colors, isDark);
    const [isMenuVisible, setIsMenuVisible] = useState(false);

    const FULL_HEIGHT = TAB_BAR_HEIGHT + insets.bottom;

    // SVG path for the curved tab bar with rounded top corners
    const lineGenerator = () => {
        const rectWidth = width;
        const holeWidth = 80;
        const holeHeight = 35;
        const x0 = (rectWidth - holeWidth) / 2;
        const radius = 20;

        return `
            M 0 ${radius}
            Q 0 0 ${radius} 0
            L ${x0} 0
            C ${x0 + 10} 0, ${x0 + 15} ${holeHeight}, ${x0 + holeWidth / 2} ${holeHeight}
            C ${x0 + holeWidth - 15} ${holeHeight}, ${x0 + holeWidth - 10} 0, ${x0 + holeWidth} 0
            L ${rectWidth - radius} 0
            Q ${rectWidth} 0 ${rectWidth} ${radius}
            L ${rectWidth} ${FULL_HEIGHT}
            L 0 ${FULL_HEIGHT}
            Z
        `;
    };

    const toggleMenu = () => setIsMenuVisible(!isMenuVisible);

    return (
        <View style={[styles.container, { height: FULL_HEIGHT }]}>
            {/* Solid Background */}
            <View style={StyleSheet.absoluteFill}>
                <Svg width={width} height={FULL_HEIGHT}>
                    <Path
                        d={lineGenerator()}
                        fill={isDark ? theme.colors.backgroundSecondary : "#FFFFFF"}
                        stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                        strokeWidth={1}
                    />
                </Svg>
            </View>

            {/* Tab Items */}
            <View style={styles.tabsContainer}>
                {state.routes.map((route, index) => {
                    const { options } = descriptors[route.key];
                    const label = options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const getIcon = (name: string, focused: boolean) => {
                        switch (name.toLowerCase()) {
                            case 'home': return "home";

                            case 'analytics': return "chart-bar";
                            case 'accounts': return "credit-card";
                            case 'settings': return "cog";
                            default: return "circle";
                        }
                    };

                    // We still keep the side spacing for the floating FAB
                    const isRightSide = index >= 2;

                    return (
                        <Pressable
                            key={route.key}
                            onPress={onPress}
                            style={({ pressed }) => [
                                styles.tabItem,
                                isRightSide ? { marginLeft: index === 2 ? 40 : 0 } : { marginRight: index === 1 ? 40 : 0 },
                                pressed && { opacity: 0.7 }
                            ]}
                        >
                            <MaterialCommunityIcons
                                name={getIcon(route.name, isFocused) as any}
                                size={24}
                                color={isFocused ? theme.colors.primary : (isDark ? "#9FB3C8" : "#64748B")}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: isFocused ? theme.colors.primary : (isDark ? "#9FB3C8" : "#64748B") }
                            ]}>
                                {label as string}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* FAB Button */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    { backgroundColor: theme.colors.primary },
                    pressed && { opacity: 0.9 }
                ]}
                onPress={toggleMenu}
            >
                <MaterialCommunityIcons name="plus" size={32} color={theme.colors.onPrimary} />
            </Pressable>

            {/* FAB Menu Overlay */}
            <Modal
                visible={isMenuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={[styles.menuContainer, { backgroundColor: theme.colors.surface }]}>
                            <MenuOption
                                icon="receipt-text"
                                label="Add Transaction"
                                color="#4CAF50"
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    router.push("/add-transaction");
                                }}
                                styles={styles}
                            />
                            <MenuOption
                                icon="bank"
                                label="Add Account"
                                color="#2196F3"
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    router.push("/setup-account");
                                }}
                                styles={styles}
                            />
                            <MenuOption
                                icon="airplane-takeoff"
                                label="Add Trip"
                                color="#FF9800"
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    router.push("/create-trip");
                                }}
                                styles={styles}
                            />
                            <MenuOption
                                icon="chart-pie"
                                label="Add Budget"
                                color="#9C27B0"
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    router.push("/budget-creation");
                                }}
                                styles={styles}
                            />
                            <MenuOption
                                icon="calendar-clock"
                                label="Add Upcoming Bill"
                                color="#F59E0B"
                                onPress={() => {
                                    setIsMenuVisible(false);
                                    router.push("/add-upcoming-bill");
                                }}
                                styles={styles}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
}

function MenuOption({ icon, label, color, onPress, styles }: { icon: string, label: string, color: string, onPress: () => void, styles: any }) {
    const { theme } = useTheme();
    return (
        <Pressable
            style={({ pressed }) => [
                styles.menuOption,
                pressed && { opacity: 0.7 }
            ]}
            onPress={onPress}
        >
            <View style={[styles.optionIcon, { backgroundColor: color + "15" }]}>
                <MaterialCommunityIcons name={icon as any} size={24} color={color} />
            </View>
            <Text style={[styles.optionLabel, { color: theme.colors.text }]}>{label}</Text>
        </Pressable>
    );
}


