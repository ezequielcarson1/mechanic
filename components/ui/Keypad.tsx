import { ArrowRight, Delete } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface KeypadProps {
    onPress: (key: string) => void;
    onDelete: () => void;
    onSubmit: () => void;
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

export function Keypad({ onPress, onDelete, onSubmit }: KeypadProps) {
    return (
        <View className="bg-[#1F2937] px-6 pt-6 pb-12">
            <View className="flex-row flex-wrap justify-between">
                {keys.map((key) => (
                    <TouchableOpacity
                        key={key}
                        onPress={() => onPress(key)}
                        className="w-[30%] aspect-[1.5] justify-center items-center mb-4"
                    >
                        <Text className="text-white text-4xl font-outfit-regular">{key}</Text>
                    </TouchableOpacity>
                ))}

                {/* Backspace Key (aligns with the grid) */}
                <TouchableOpacity
                    onPress={onDelete}
                    className="w-[30%] aspect-[1.5] justify-center items-center mb-4"
                >
                    <Delete size={32} color="white" />
                </TouchableOpacity>

                {/* Submit Key (Bottom Right, usually distinct) - In the grid flow it might be weird. 
            The design shows a 3-column grid. 
            1 2 3
            4 5 6
            7 8 9
              0
            
            Wait, standard keypads are:
            1 2 3
            4 5 6
            7 8 9
            . 0 <del>
            
            Or the prompt image shows "Next" button might be separate or part of it? 
            "buttons for the numbers should be part of the web site"
            Image crop shows:
            1 2 3 -
            4 5 6 _
            7 8 9 X
               0    <-- arrow
            
            The layout in the crop is:
            Row 1: 1, 2, 3, - (dash?)
            Row 2: 4, 5, 6, _ (space?)
            Row 3: 7, 8, 9, X (backspace)
            Row 4:    0,    , <- (arrow)
            
            Actually, looking closely at the crop provided in the prompt context:
            1   2   3   -
            4   5   6   _
            7   8   9   <X]
                0       (<-)
            
            It looks like a 4-column grid? Or 3 columns + side actions?
            Let's stick to a standard mobile keypad for usability if the image is ambiguous, 
            BUT the user said "copy the exact UI".
            The crop shows a dark background.
            Let's implement a clean 3-column grid which is standard:
            1 2 3
            4 5 6
            7 8 9
            . 0 <
            
            And maybe the "Next" button is floated or part of the keypad.
            In the crop: bottom right is a circle with an arrow.
        */}

                {/* Re-rendering the grid to match standard phone visual but with the dark theme */}
                {/* Ideally we put the Submit button in the bottom right corner of the screen/keypad area */}
            </View>

            {/* Floating Submit Action or placed in grid? 
          Let's place the submit button in the bottom right slot if we treat it as a grid.
      */}
            <View className="absolute bottom-10 right-8">
                <TouchableOpacity
                    onPress={onSubmit}
                    className="w-14 h-14 bg-[#5eead4] rounded-full justify-center items-center" // Teal color
                >
                    <ArrowRight size={28} color="#134e4a" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

// Re-writing the component to be cleaner for the specific layout
export function NumericKeypad({ onKeyPress, onDelete, onSubmit }: { onKeyPress: (k: string) => void, onDelete: () => void, onSubmit?: () => void }) {
    const rows = [
        ['1', '2', '3', '-'],
        ['4', '5', '6', '_'], 
        ['7', '8', '9', 'del'],
        ['', '0', '.', 'next']
    ];

    return (
        <View className="bg-[#1F2937] pb-8 pt-4">
            <View className="flex-row flex-wrap px-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                    <TouchableOpacity
                        key={num}
                        onPress={() => onKeyPress(num.toString())}
                        className="w-[33.33%] h-20 justify-center items-center"
                    >
                        <Text className="text-white text-3xl font-outfit-light">{num}</Text>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    onPress={onDelete}
                    className="w-[33.33%] h-20 justify-center items-center"
                >
                    <Delete size={28} color="white" />
                </TouchableOpacity>
            </View>

            {onSubmit && (
                <TouchableOpacity
                    onPress={onSubmit}
                    className="absolute bottom-8 right-8 w-14 h-14 bg-[#99F6E4] rounded-full justify-center items-center shadow-lg"
                >
                    <ArrowRight size={24} color="#0F172A" />
                </TouchableOpacity>
            )}
        </View>
    );
}
