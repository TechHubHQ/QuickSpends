
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Logger } from '../src/services/logger';
// Assuming simple colors for now to avoid import errors if Colors file path is different.

export default function LogsScreen() {
    const [logs, setLogs] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const content = await Logger.getLogs();
            setLogs(content);
        } catch (error) {
            console.error('Failed to fetch logs', error);
            setLogs('Failed to load logs.');
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        Alert.alert(
            'Clear Logs',
            'Are you sure you want to delete all logs locally?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await Logger.clearLogs();
                        fetchLogs();
                    }
                }
            ]
        );
    };

    const handleShareLogs = async () => {
        try {
            await Share.share({
                message: logs,
                title: 'App Logs'
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share logs');
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ title: 'App Logs', headerBackTitle: 'Back' }} />

            <View style={styles.header}>
                <Text style={styles.infoText}>Path: /data/data/com.quickspends.app/cache/app_logs.txt</Text>
            </View>

            <View style={styles.buttonRow}>
                <Button title="Refresh" onPress={fetchLogs} />
                <Button title="Share / Copy" onPress={handleShareLogs} />
                <Button title="Clear Logs" color="red" onPress={handleClearLogs} />
            </View>

            <View style={styles.logsContainer}>
                {loading ? (
                    <ActivityIndicator size="large" />
                ) : (
                    <ScrollView style={styles.scrollView}>
                        <Text style={styles.logText} selectable>{logs || 'No logs found.'}</Text>
                    </ScrollView>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    infoText: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'monospace',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    logsContainer: {
        flex: 1,
        padding: 10,
    },
    scrollView: {
        flex: 1,
    },
    logText: {
        fontSize: 12,
        fontFamily: 'monospace',
        color: '#333',
    },
});
