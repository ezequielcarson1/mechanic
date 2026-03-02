import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function VideoCallScreen() {
    const { id, roomUrl } = useGlobalSearchParams();
    const router = useRouter();
    const webViewRef = useRef<WebView>(null);

    const urlStr = Array.isArray(roomUrl) ? roomUrl[0] : roomUrl || '';
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Countdown timer (optional UI enhancement)
    useEffect(() => {
        if (!urlStr) return;
        // Start a 5-minute countdown
        const startTime = Date.now();
        const duration = 5 * 60 * 1000; // 5 minutes

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, duration - elapsed);
            setTimeLeft(Math.ceil(remaining / 1000));

            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [urlStr]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleLeaveCall = () => {
        router.back();
    };

    if (!urlStr) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Ionicons name="videocam-off" size={64} color="#9CA3AF" />
                    <Text style={styles.errorTitle}>No Video Room</Text>
                    <Text style={styles.errorSubtitle}>
                        The video room is not available. It may have expired.
                    </Text>
                    <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                        <Text style={styles.goBackText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Timer Bar */}
            <View style={styles.timerBar}>
                <View style={styles.timerLeft}>
                    <View style={[styles.liveDot, timeLeft !== null && timeLeft <= 0 && styles.liveDotExpired]} />
                    <Text style={styles.timerLabel}>
                        {timeLeft !== null && timeLeft <= 0 ? 'Room Expired' : 'Live'}
                    </Text>
                </View>
                {timeLeft !== null && timeLeft > 0 && (
                    <Text style={[
                        styles.timerText,
                        timeLeft <= 60 && styles.timerTextWarning
                    ]}>
                        {formatTime(timeLeft)}
                    </Text>
                )}
            </View>

            {/* WebView for Daily.co Room */}
            <View style={styles.webViewContainer}>
                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#0047AB" />
                        <Text style={styles.loadingText}>Connecting to video room...</Text>
                    </View>
                )}

                {hasError ? (
                    <View style={styles.centerContent}>
                        <Ionicons name="warning" size={64} color="#EF4444" />
                        <Text style={styles.errorTitle}>Connection Error</Text>
                        <Text style={styles.errorSubtitle}>
                            Could not connect to the video room. The room may have expired.
                        </Text>
                        <TouchableOpacity style={styles.goBackButton} onPress={() => router.back()}>
                            <Text style={styles.goBackText}>Go Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={() => {
                                setHasError(false);
                                setIsLoading(true);
                                webViewRef.current?.reload();
                            }}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <WebView
                        ref={webViewRef}
                        source={{ uri: urlStr }}
                        style={styles.webView}
                        javaScriptEnabled={true}
                        domStorageEnabled={true}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        mediaCapturePermissionGrantType="grant"
                        allowsFullscreenVideo={true}
                        onLoadStart={() => setIsLoading(true)}
                        onLoadEnd={() => setIsLoading(false)}
                        onError={(syntheticEvent) => {
                            console.error('WebView error:', syntheticEvent.nativeEvent);
                            setHasError(true);
                            setIsLoading(false);
                        }}
                        onHttpError={(syntheticEvent) => {
                            const { statusCode } = syntheticEvent.nativeEvent;
                            if (statusCode >= 400) {
                                console.error('HTTP error:', statusCode);
                                setHasError(true);
                                setIsLoading(false);
                            }
                        }}
                        // Required for camera/mic permissions on Android
                        {...(Platform.OS === 'android' && {
                            androidLayerType: 'hardware',
                        })}
                    />
                )}
            </View>

            {/* Bottom Controls */}
            <View style={styles.controls}>
                <TouchableOpacity
                    style={styles.leaveButton}
                    onPress={handleLeaveCall}
                    activeOpacity={0.8}
                >
                    <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
                    <Text style={styles.leaveButtonText}>Leave Call</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    timerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 56 : 36,
        paddingBottom: 10,
        backgroundColor: '#1F2937',
    },
    timerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    liveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#22C55E',
    },
    liveDotExpired: {
        backgroundColor: '#EF4444',
    },
    timerLabel: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    timerText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
    timerTextWarning: {
        color: '#EF4444',
    },
    webViewContainer: {
        flex: 1,
        position: 'relative',
    },
    webView: {
        flex: 1,
        backgroundColor: '#111827',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    loadingText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 12,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    errorTitle: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 16,
    },
    errorSubtitle: {
        fontFamily: 'Outfit_400Regular',
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: 8,
    },
    goBackButton: {
        marginTop: 24,
        backgroundColor: '#374151',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    goBackText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 14,
        color: '#FFFFFF',
    },
    retryButton: {
        marginTop: 12,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    retryText: {
        fontFamily: 'Outfit_500Medium',
        fontSize: 14,
        color: '#60A5FA',
    },
    controls: {
        backgroundColor: '#1F2937',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        alignItems: 'center',
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#EF4444',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 30,
        gap: 10,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    leaveButtonText: {
        fontFamily: 'Outfit_700Bold',
        fontSize: 16,
        color: '#FFFFFF',
    },
});
