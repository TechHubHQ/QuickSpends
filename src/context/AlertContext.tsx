import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { AlertButton, QSAlertModal } from '../components/QSAlertModal';

interface AlertContextType {
    showAlert: (title: string, message?: string, buttons?: AlertButton[]) => void;
    hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [visible, setVisible] = useState(false);
    const [config, setConfig] = useState<{
        title: string;
        message?: string;
        buttons?: AlertButton[];
    }>({ title: '' });

    const showAlert = useCallback((title: string, message?: string, buttons?: AlertButton[]) => {
        setConfig({ title, message, buttons });
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <QSAlertModal
                visible={visible}
                title={config.title}
                message={config.message}
                buttons={config.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
};

export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
};
