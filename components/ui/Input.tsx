import { cn } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface InputProps extends TextInputProps {
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerClassName?: string;
}

export function Input({
  className,
  containerClassName,
  leftIcon,
  isPassword = false,
  style,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(!isPassword);

  return (
    <View
      className={cn(
        "flex-row items-center bg-white rounded-xl px-4 py-3",
        containerClassName,
      )}
    >
      {leftIcon && <View className="mr-3">{leftIcon}</View>}
      <TextInput
        className={cn(
          "flex-1 font-outfit-medium text-black text-base",
          className,
        )}
        style={[{ paddingVertical: 0 }, style]}
        secureTextEntry={isPassword && !showPassword}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {isPassword && (
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          {showPassword ? (
            <Ionicons name="eye-off" size={20} color="#9CA3AF" />
          ) : (
            <Ionicons name="eye" size={20} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}
