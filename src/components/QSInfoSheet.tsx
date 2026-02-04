import React, { ReactNode } from "react";
import { QSBottomSheet } from "./QSBottomSheet";

interface QSInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const QSInfoSheet: React.FC<QSInfoSheetProps> = ({
  visible,
  onClose,
  title,
  children,
}) => {
  return (
    <QSBottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      showDoneButton
      onDone={onClose}
      variant="floating"
    >
      {children}
    </QSBottomSheet>
  );
};
