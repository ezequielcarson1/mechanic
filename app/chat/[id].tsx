import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Mic, Paperclip, Phone, Play, Send, Video } from 'lucide-react-native';
import { useState } from 'react';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

const MOCK_MESSAGES = [
    {
        id: '1',
        type: 'text',
        sender: 'other',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        time: '09:00'
    },
    {
        id: '2',
        type: 'text',
        sender: 'other',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        time: '09:30'
    },
    {
        id: '3',
        type: 'text',
        sender: 'other',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        time: '09:43'
    },
    {
        id: '4',
        type: 'audio',
        sender: 'other',
        duration: '02:50',
        time: '09:50'
    }
];

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [message, setMessage] = useState('');

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-blue-600 px-4 pt-12 pb-4 flex-row items-center border-b border-blue-500 shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <View className="flex-row items-center flex-1">
                    <Image
                        source={{ uri: 'https://i.pravatar.cc/150?u=edward' }}
                        className="w-10 h-10 rounded-full border border-white/20"
                    />
                    <View className="ml-3">
                        <Text className="text-white font-outfit-bold text-lg">Edward Milton</Text>
                        <View className="flex-row items-center">
                            <View className="w-2 h-2 bg-emerald-400 rounded-full mr-1.5" />
                            <Text className="text-white/80 text-xs font-outfit-regular">Online</Text>
                        </View>
                    </View>
                </View>
                <View className="flex-row items-center gap-4 mr-2">
                    <TouchableOpacity onPress={() => router.navigate(`/call/${id}`)}>
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                            <Phone size={18} color="white" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                            <Video size={18} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 py-6" showsVerticalScrollIndicator={false}>
                {MOCK_MESSAGES.map((msg) => (
                    <View key={msg.id} className="mb-6">
                        <View className={`max-w-[85%] ${msg.sender === 'me' ? 'self-end' : 'self-start'}`}>
                            {msg.type === 'text' ? (
                                <View className={`p-4 rounded-2xl ${msg.sender === 'me' ? 'bg-blue-600 rounded-tr-none' : 'bg-gray-50 border border-gray-100 rounded-tl-none'}`}>
                                    <Text className={`font-outfit-regular text-[13px] leading-5 ${msg.sender === 'me' ? 'text-white' : 'text-gray-700'}`}>
                                        {msg.text}
                                    </Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-3 bg-gray-50 border border-gray-100 p-3 rounded-2xl rounded-tl-none min-w-[200px]">
                                    <Image
                                        source={{ uri: 'https://i.pravatar.cc/150?u=edward' }}
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <View className="bg-blue-100/50 w-8 h-8 rounded-full items-center justify-center">
                                        <Play size={14} color="#3B82F6" fill="#3B82F6" />
                                    </View>
                                    <View className="flex-1 flex-row gap-0.5 items-center px-1">
                                        {[1, 0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3, 0.8, 0.6].map((h, i) => (
                                            <View key={i} style={{ height: 12 * h }} className="w-[3px] bg-blue-400 rounded-full" />
                                        ))}
                                    </View>
                                    <Text className="text-gray-400 text-[10px] font-outfit-medium">{msg.duration}</Text>
                                </View>
                            )}
                            <Text className={`text-gray-400 text-[10px] mt-1 font-outfit-medium ${msg.sender === 'me' ? 'text-right' : 'text-left'}`}>
                                {msg.time}
                            </Text>
                        </View>
                    </View>
                ))}

                <View className="flex-row items-center mt-2 mb-10">
                    <Text className="text-blue-500 font-outfit-medium italic text-xs">Mechanic is typing...</Text>
                </View>
            </ScrollView>

            {/* Input Area */}
            <View className="px-4 pb-10 pt-4 border-t border-gray-100">
                <View className="flex-row items-center bg-gray-50 rounded-full px-2 py-1.5 border border-gray-200">
                    <TouchableOpacity className="w-9 h-9 items-center justify-center bg-blue-100 rounded-full mr-2">
                        <Paperclip size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TextInput
                        className="flex-1 font-outfit-regular text-sm px-2"
                        placeholder="Write Here..."
                        value={message}
                        onChangeText={setMessage}
                        placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity className="w-9 h-9 items-center justify-center mr-1">
                        <Mic size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="bg-blue-600 w-10 h-10 rounded-full items-center justify-center shadow-sm"
                        onPress={() => setMessage('')}
                    >
                        <Send size={18} color="white" style={{ transform: [{ rotate: '-45deg' }, { translateX: 2 }] }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

