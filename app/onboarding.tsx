import { OnboardingData, OnboardingItem } from '@/components/OnboardingItem';
import { Button } from '@/components/ui/Button';
import { GradientLayout } from '@/components/ui/GradientLayout';
import { cn } from '@/lib/utils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const DATA: OnboardingData[] = [
    {
        id: '1',
        title: 'Get Paid Providing Your Professional Services',
        // Placeholder until images are generated
        image: require('@/assets/images/react-logo.png'),
    },
    {
        id: '2',
        title: 'Provide Immediate Assistance',
        image: require('@/assets/images/react-logo.png'),
    },
    {
        id: '3',
        title: 'Provide Scheduled Assistance',
        image: require('@/assets/images/react-logo.png'),
    },
    {
        id: '4',
        title: 'Provide Video Call Assistance',
        image: require('@/assets/images/react-logo.png'),
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const { width, height } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleFinish = () => {
        router.replace('/login');
    };

    return (
        <GradientLayout className="flex-1" resizeMode="stretch">
            <View className="flex-1 justify-center">
                <Carousel
                    loop={false}
                    width={width}
                    height={height * 0.7}
                    autoPlay={false}
                    data={DATA}
                    scrollAnimationDuration={1000}
                    onSnapToItem={(index) => setCurrentIndex(index)}
                    renderItem={({ item }) => <OnboardingItem item={item} />}
                />

                <View className="items-center px-6 pb-12 w-full absolute bottom-0">
                    {/* Pagination Dots */}
                    <View className="flex-row justify-center space-x-2 mb-8">
                        {DATA.map((_, index) => (
                            <View
                                key={index}
                                className={cn(
                                    'h-2 rounded-full transition-all',
                                    currentIndex === index ? 'w-6 bg-white' : 'w-2 bg-white/40'
                                )}
                            />
                        ))}
                    </View>

                    <Button
                        onPress={handleFinish}
                        fullWidth
                        size="lg"
                        variant="outline"
                    >
                        Get Started
                    </Button>
                </View>
            </View>
        </GradientLayout>
    );
}
