import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class LoggerService {
    private static instance: LoggerService;
    private logFilePath: string;
    private maxFileSize: number = 500 * 1024; // 500KB

    private constructor() {
        this.logFilePath = `${(FileSystem as any).cacheDirectory}app_logs.txt`;
        this.init();
    }

    public static getInstance(): LoggerService {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }

    private async init() {
        try {
            if (Platform.OS === 'web') return;
            const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
            if (fileInfo.exists && fileInfo.size > this.maxFileSize) {
                // Truncate or delete if too large
                await FileSystem.deleteAsync(this.logFilePath);
                // await FileSystem.writeAsStringAsync(this.logFilePath, ''); // Re-create empty
                console.log('[Logger] Log file exceeded size limit and was reset.');
            }
        } catch (error) {
            console.error('[Logger] Failed to initialize log file:', error);
        }
    }

    private async appendToFile(message: string) {
        try {
            if (Platform.OS === 'web') return;
            // Note: Expo FileSystem does not have a native append for text in 'writeAsStringAsync' easily for web/all platforms.
            // We will read-append-write for now, assuming low verbosity.
            // For higher performance, we would use a buffer or native modules, but this meets "not too verbose" requirement.
            let content = '';
            const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);

            if (fileInfo.exists) {
                // Optional: Check size again before reading?
                if (fileInfo.size > this.maxFileSize) {
                    // Rotate: keep last 50% ? or just clear. Let's clear for simplicity and storage safety.
                    // Reading a huge file to slice it is also memory intensive.
                    await FileSystem.deleteAsync(this.logFilePath);
                    content = ''; // Start fresh
                } else {
                    content = await FileSystem.readAsStringAsync(this.logFilePath);
                }
            }

            const timestamp = new Date().toISOString();
            const logEntry = `[${timestamp}] ${message}\n`;

            await FileSystem.writeAsStringAsync(this.logFilePath, content + logEntry);
        } catch (error) {
            console.error('[Logger] Failed to write to log file:', error);
        }
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        let logMessage = `[${level}] ${message}`;
        if (data) {
            if (data instanceof Error) {
                logMessage += `\nError: ${data.message}\nStack: ${data.stack}`;
            } else {
                try {
                    logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
                } catch (e) {
                    logMessage += `\nData: [Circular or Unserializable]`;
                }
            }
        }
        return logMessage;
    }

    public log(level: LogLevel, message: string, data?: any) {
        const formattedMessage = this.formatMessage(level, message, data);

        // Console output
        switch (level) {
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
            case 'INFO':
                console.log(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'ERROR':
                console.error(formattedMessage);
                break;
        }

        // File output
        this.appendToFile(formattedMessage);
    }

    public debug(message: string, data?: any) {
        this.log('DEBUG', message, data);
    }

    public info(message: string, data?: any) {
        this.log('INFO', message, data);
    }

    public warn(message: string, data?: any) {
        this.log('WARN', message, data);
    }

    public error(message: string, error?: any, data?: any) {
        // If error is passed as 2nd arg
        this.log('ERROR', message, error || data);
    }

    public async getLogs(): Promise<string> {
        try {
            if (Platform.OS === 'web') return '';
            const fileInfo = await FileSystem.getInfoAsync(this.logFilePath);
            if (!fileInfo.exists) return '';
            return await FileSystem.readAsStringAsync(this.logFilePath);
        } catch (error) {
            return `Failed to read logs: ${error}`;
        }
    }

    public async clearLogs() {
        try {
            if (Platform.OS === 'web') return;
            await FileSystem.deleteAsync(this.logFilePath);
        } catch (error) {
            console.error('Failed to clear logs', error);
        }
    }
}

export const Logger = LoggerService.getInstance();
