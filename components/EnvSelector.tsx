import { ConfigService } from '@/lib/config/ConfigService';
import { EnvType } from '@/lib/config/types';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function EnvSelector() {
    const [allowSwitch, setAllowSwitch] = useState(false);
    const [currentEnv, setCurrentEnv] = useState<EnvType>('prod');
    const [endpoints, setEndpoints] = useState({ apiBaseUrl: '', wsUrl: '' });

    const updateState = () => {
        setAllowSwitch(ConfigService.getAllowEnvSwitch());
        setCurrentEnv(ConfigService.getEnv());
        setEndpoints({
            apiBaseUrl: ConfigService.getApiBaseUrl(),
            wsUrl: ConfigService.getWsUrl(),
        });
    };

    useEffect(() => {
        updateState();
        ConfigService.addListener(updateState);
        return () => {
            ConfigService.removeListener(updateState);
        };
    }, []);

    const handleSwitch = async (env: EnvType) => {
        if (env === currentEnv) return;

        if (env === 'prod') {
            await ConfigService.setEnv('prod');
            updateState();
            return;
        }

        // DEV logic
        await ConfigService.setEnv('dev');
        updateState();
        return;
    };

    if (!allowSwitch) return null;

    return (
        <View style={styles.container}>
            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[styles.segment, currentEnv === 'prod' && styles.segmentActiveProd]}
                    onPress={() => handleSwitch('prod')}
                >
                    <Text style={[styles.segmentText, currentEnv === 'prod' && styles.segmentTextActive]}>PROD</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.segment, currentEnv === 'dev' && styles.segmentActiveDev]}
                    onPress={() => handleSwitch('dev')}
                >
                    <Text style={[styles.segmentText, currentEnv === 'dev' && styles.segmentTextActive]}>DEV</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.infoContainer}>
                <Text style={styles.infoText}>API: {endpoints.apiBaseUrl}</Text>
                <Text style={styles.infoText}>WS: {endpoints.wsUrl}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        right: 12,
        zIndex: 9999,
        elevation: 100,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 8,
        padding: 6,
        width: 140, // fix width so it doesn't stretch
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 6,
        padding: 2,
        marginBottom: 4,
    },
    segment: {
        flex: 1,
        paddingVertical: 4,
        alignItems: 'center',
        borderRadius: 4,
    },
    segmentActiveProd: {
        backgroundColor: '#10b981', // green default
    },
    segmentActiveDev: {
        backgroundColor: '#f59e0b', // orange default
    },
    segmentText: {
        color: '#ccc',
        fontWeight: 'bold',
        fontSize: 10,
    },
    segmentTextActive: {
        color: '#fff',
    },
    infoContainer: {},
    infoText: {
        color: '#9ca3af',
        fontSize: 8,
        fontFamily: 'monospace',
        marginBottom: 2,
    },
});
