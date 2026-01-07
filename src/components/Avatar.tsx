import { Image } from 'expo-image';
import React, { useMemo } from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const avatarContext = require.context('../../assets/avatars', false, /\.png$/);
const AVATAR_IMAGES = avatarContext.keys().map((key) => avatarContext(key));

export const TOTAL_AVATARS = AVATAR_IMAGES.length;

interface AvatarProps {
    seed: string;
    size?: number;
    variant?: 'beam' | 'bauhaus' | 'ring' | 'sunset' | 'pixel';
    colors?: string[];
    style?: ViewStyle;
}

export const Avatar = ({
    seed,
    size = 40,
    style
}: AvatarProps) => {
    const { theme } = useTheme();

    const avatarSource = useMemo(() => {
        // Check if seed is a remote URL (http/https) or local file URI
        if (seed && (typeof seed === 'string') && (seed.startsWith('http') || seed.startsWith('file:'))) {
            return { uri: seed };
        }

        // If seed is a number string within range, use it directly (for explicit selection)
        if (/^\d+$/.test(seed)) {
            const index = parseInt(seed, 10);
            if (index >= 0 && index < AVATAR_IMAGES.length) {
                return AVATAR_IMAGES[index];
            }
        }

        // Otherwise use hash for deterministic random assignment
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % AVATAR_IMAGES.length;
        return AVATAR_IMAGES[index];
    }, [seed]);

    return (
        <View style={[{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: theme.colors.backgroundSecondary,
        }, style]}>
            <Image
                source={avatarSource}
                style={{ width: size, height: size }}
                contentFit="cover"
                transition={200}
            />
        </View>
    );
};
