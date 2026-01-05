import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { QSBottomSheet } from './QSBottomSheet';

interface QSSelectSheetProps {
    visible: boolean;
    onClose: () => void;
    title: string;
    options: { label: string; value: string; icon?: string }[];
    selectedValue: string;
    onSelect: (value: string) => void;
}

export function QSSelectSheet({ visible, onClose, title, options, selectedValue, onSelect }: QSSelectSheetProps) {
    const { theme } = useTheme();

    return (
        <QSBottomSheet
            visible={visible}
            onClose={onClose}
            title={title}
        >
            <View style={{ gap: 8, paddingBottom: 24 }}>
                {options.map((option) => {
                    const isSelected = option.value === selectedValue;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 16,
                                borderRadius: 12,
                                backgroundColor: isSelected ? theme.colors.primary + '10' : theme.colors.card,
                                borderWidth: 1,
                                borderColor: isSelected ? theme.colors.primary : 'transparent'
                            }}
                            onPress={() => {
                                onSelect(option.value);
                                onClose();
                            }}
                        >
                            {option.icon && (
                                <MaterialCommunityIcons
                                    name={option.icon as any}
                                    size={24}
                                    color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                                    style={{ marginRight: 16 }}
                                />
                            )}
                            <Text style={{
                                flex: 1,
                                fontSize: 16,
                                fontWeight: '600',
                                color: theme.colors.text
                            }}>
                                {option.label}
                            </Text>
                            {isSelected && (
                                <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </QSBottomSheet>
    );
}
