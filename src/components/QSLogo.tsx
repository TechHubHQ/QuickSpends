import React from "react";
import { Image, ImageStyle, View, ViewStyle } from "react-native";
import { createStyles } from "../styles/components/QSLogo.styles";
import { useTheme } from "../theme/ThemeContext";

interface QSLogoProps {
    size?: number;
    style?: ViewStyle;
    imageStyle?: ImageStyle;
}

export const QSLogo: React.FC<QSLogoProps> = ({ size, style, imageStyle }) => {
    const { theme } = useTheme();
    const isDark = theme.isDark;
    const styles = createStyles(theme.colors, isDark);
    // If size is provided, use it for width/height. Otherwise let parent control or default.
    // In LandingScreen, it fills the container.

    const containerStyle = [
        styles.container,
        size ? { width: size, height: size } : { width: "100%" as any, aspectRatio: 1 },
        style
    ];

    return (
        <View style={containerStyle}>
            <Image
                source={require("../../assets/logo/qslogo.png")}
                style={[styles.logoImage, imageStyle]}
                resizeMode="contain"
            />
        </View>
    );
};


