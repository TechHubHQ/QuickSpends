import React from "react";
import { View } from "react-native";
import { BaseToast, ErrorToast, ToastProps } from "react-native-toast-message";
import { useTheme } from "../theme/ThemeContext";

const ToastWrapper = ({ children }: { children: (theme: Theme) => React.ReactNode }) => {
  const { theme } = useTheme();
  return <>{children(theme)}</>;
};

export const toastConfig = {
  success: (props: ToastProps) => (
    <ToastWrapper>
      {(theme) => (
        <BaseToast
          {...props}
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
                backgroundColor: "transparent",
              }}
            />
          )}
        />
      )}
    </ToastWrapper>
  ),

  error: (props: ToastProps) => (
    <ToastWrapper>
      {(theme) => (
        <ErrorToast
          {...props}
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
      )}
    </ToastWrapper>
  ),

  info: (props: ToastProps) => (
    <ToastWrapper>
      {(theme) => (
        <BaseToast
          {...props}
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
      )}
    </ToastWrapper>
  ),
};
