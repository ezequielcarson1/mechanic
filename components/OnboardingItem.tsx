import { Image, ImageSourcePropType, Text, useWindowDimensions, View } from 'react-native';

export type OnboardingData = {
    id: string;
    title: string;
    image: ImageSourcePropType;
};

interface OnboardingItemProps {
    item: OnboardingData;
}

export function OnboardingItem({ item }: OnboardingItemProps) {
    const { width } = useWindowDimensions();

    return (
        <View style={{ width }} className="flex-1 justify-center items-center px-8">
            <View className="flex-1 justify-center items-center w-full">
                <Image
                    source={item.image}
                    style={{ width: width * 0.8, height: width * 0.8 }}
                    resizeMode="contain"
                    className="mb-12"
                />
                <Text className="text-white text-3xl font-outfit-bold text-center leading-tight">
                    {item.title}
                </Text>
            </View>
        </View>
    );
}
