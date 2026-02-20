import { useRouter } from 'expo-router';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useState } from 'react';
import { LayoutAnimation, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function HelpScreen() {
    const router = useRouter();
    const [expandedIds, setExpandedIds] = useState<number[]>([]);

    const toggleExpand = (id: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        if (expandedIds.includes(id)) {
            setExpandedIds(expandedIds.filter(i => i !== id));
        } else {
            setExpandedIds([...expandedIds, id]);
        }
    };

    const faqs = [
        { id: 1, question: 'Lorem ipsum dolor sit amet?', answer: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pellentesque congue lorem, vel tincidunt tortor placerat a. Proin ac diam quam.' },
        { id: 2, question: 'Lorem ipsum dolor sit amet?', answer: 'Answer for item 2...' },
        { id: 3, question: 'Lorem ipsum dolor sit amet?', answer: 'Answer for item 3...' },
        { id: 4, question: 'Lorem ipsum dolor sit amet?', answer: 'Answer for item 4...' },
    ];

    return (
        <ScrollView className="flex-1 bg-white px-6 pt-6">
            <View className="mb-6">
                <Text className="text-xl font-outfit-bold text-blue-900 mb-1">Help center</Text>
                <Text className="text-blue-500 font-outfit-regular leading-5">
                    We're here to guide you, check out our{'\n'}Frequently asked questions or contact{'\n'}us directly
                </Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row flex-wrap gap-3 mb-8">
                <TouchableOpacity className="flex-1 min-w-[45%] border border-gray-800 rounded-lg py-3 items-center">
                    <Text className="font-outfit-bold text-gray-900">Contact Us</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className="flex-1 min-w-[45%] border border-gray-800 rounded-lg py-3 items-center"
                    onPress={() => router.push('/live-chat')}
                >
                    <Text className="font-outfit-bold text-gray-900">Live chat</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 min-w-[45%] border border-gray-800 rounded-lg py-3 items-center">
                    <Text className="font-outfit-bold text-gray-900">FAQ</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 min-w-[45%] border border-gray-200 rounded-lg py-3 items-center">
                    <Text className="font-outfit-bold text-gray-900">Website</Text>
                </TouchableOpacity>
            </View>

            {/* Accordion FAQ */}
            <View className="gap-3 mb-10">
                {faqs.map((faq) => {
                    const isExpanded = expandedIds.includes(faq.id);
                    return (
                        <View key={faq.id} className="border border-blue-100 rounded-lg overflow-hidden bg-blue-50/30">
                            <TouchableOpacity
                                onPress={() => toggleExpand(faq.id)}
                                className={`flex-row justify-between items-center p-4 ${isExpanded ? 'bg-blue-600' : 'bg-transparent'}`}
                            >
                                <Text className={`font-outfit-bold text-base ${isExpanded ? 'text-white' : 'text-blue-900'}`}>
                                    {faq.question}
                                </Text>
                                {isExpanded ? <ChevronUp size={20} color="white" /> : <ChevronDown size={20} color="#0047AB" />}
                            </TouchableOpacity>
                            {isExpanded && (
                                <View className="p-4 bg-gray-50">
                                    <Text className="text-gray-600 font-outfit-regular leading-5">
                                        {faq.answer}
                                    </Text>
                                </View>
                            )}
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}
