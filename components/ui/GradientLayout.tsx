import { ImageBackground, ImageResizeMode, Platform, View, ViewProps } from 'react-native';

interface GradientLayoutProps extends ViewProps {
    resizeMode?: ImageResizeMode;
}

export function GradientLayout({ children, style, resizeMode = 'cover', ...props }: GradientLayoutProps) {
    const content = (
        <ImageBackground
            source={require('@/assets/images/background.jpeg')}
            style={[{ flex: 1, width: '100%', height: '100%' }, style]}
            resizeMode={resizeMode}
            {...props}
        >
            {children}
        </ImageBackground>
    );

    if (Platform.OS === 'web') {
        return (
            <View style={{ flex: 1, overflow: 'hidden' }}>
                {content}
            </View>
        );
    }

    return content;
}
