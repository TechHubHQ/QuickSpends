import React from "react";
import { useColorScheme, View } from "react-native";
import { BaseToast, ErrorToast, ToastProps } from "react-native-toast-message";
import { darkTheme, lightTheme } from "../theme/theme";

/*
  Custom Premium Toast Config
  Uses the app's theme colors to create a modern, clean look.
*/

export const toastConfig = {
  success: (props: ToastProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const theme = isDark ? darkTheme : lightTheme;
    const { key, ...rest } = props;

    return (
      <BaseToast
        key={key}
        {...rest}
        style={{
          borderLeftColor: theme.colors.success,
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 6,
          height: 80,
          width: "90%",
          borderRadius: theme.borderRadius.m,
          ...theme.shadows.medium,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
        }}
        renderLeadingIcon={() => (
          <View
            style={{
              width: 40,
              height: "100%",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "transparent", // could add an icon here if desired
            }}
          />
        )}
      />
    );
  },

  error: (props: ToastProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const theme = isDark ? darkTheme : lightTheme;
    const { key, ...rest } = props;

    return (
      <ErrorToast
        key={key}
        {...rest}
        style={{
          borderLeftColor: theme.colors.error,
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 6,
          height: 80,
          width: "90%",
          borderRadius: theme.borderRadius.m,
          ...theme.shadows.medium,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
        }}
      />
    );
  },

  info: (props: ToastProps) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === "dark";
    const theme = isDark ? darkTheme : lightTheme;
    const { key, ...rest } = props;

    return (
      <BaseToast
        key={key}
        {...rest}
        style={{
          borderLeftColor: theme.colors.info,
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 6,
          height: 80,
          width: "90%",
          borderRadius: theme.borderRadius.m,
          ...theme.shadows.medium,
        }}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: theme.colors.text,
        }}
        text2Style={{
          fontSize: 14,
          color: theme.colors.textSecondary,
        }}
      />
    );
  },
};
