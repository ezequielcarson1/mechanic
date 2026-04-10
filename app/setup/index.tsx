import { userDAO } from "@/lib/dao/UserDAO";
import { sendOTP } from "@/lib/firebase/auth";
import { saveSetupProgress } from "@/lib/storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export default function PhoneNumberScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState(""); // raw digits only
  const [isChecking, setIsChecking] = useState(false);
  const [errorModal, setErrorModal] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const inputRef = useRef<TextInput>(null);

  const showError = (title: string, message: string) =>
    setErrorModal({ visible: true, title, message });
  const hideError = () =>
    setErrorModal({ visible: false, title: "", message: "" });

  // Keep only digits, max 10
  const handleChangeText = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 10);
    setPhoneNumber(digits);
  };

  // Format digits → (XXX) XXX-XXXX
  const formattedNumber = (() => {
    if (!phoneNumber) return "";
    const area = phoneNumber.slice(0, 3);
    const prefix = phoneNumber.slice(3, 6);
    const line = phoneNumber.slice(6, 10);
    if (phoneNumber.length > 6) return `(${area}) ${prefix}-${line}`;
    if (phoneNumber.length > 3) return `(${area}) ${prefix}`;
    return area ? `(${area}` : "";
  })();

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (phoneNumber.length < 10) {
      showError(
        "Invalid number",
        "Please enter a valid 10-digit phone number.",
      );
      return;
    }

    setIsChecking(true);
    try {
      const fullPhone = `+1${phoneNumber}`;

      const exists = await userDAO.checkPhoneExists(fullPhone);
      if (exists) {
        showError(
          "Account Exists",
          "This phone number is already registered. Please log in instead or use a different number.",
        );
        return;
      }

      await saveSetupProgress("phone", { phoneNumber: fullPhone });
      await sendOTP(fullPhone);
      router.push("/setup/otp");
    } catch (error: any) {
      const rawMessage = error.message || "";
      const displayMessage = rawMessage.includes("auth/too-many-requests")
        ? "Too many login attempts. Please wait a few minutes and try again later."
        : rawMessage || "Something went wrong. Please try again.";
      showError("Error", displayMessage);
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="px-8 pt-8 flex-1">
          <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2">
            What's your number?
          </Text>
          <Text className="text-base font-outfit-medium text-[#0047AB] mb-12">
            We'll send you an SMS to verify your phone.
          </Text>

          {/* Phone input row */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => inputRef.current?.focus()}
            className="flex-row items-center mb-8 border-b-2 border-slate-200 pb-2"
          >
            <Text className="text-3xl font-outfit-bold text-[#0F172A] mr-4">
              +1
            </Text>
            <TextInput
              ref={inputRef}
              value={formattedNumber}
              onChangeText={handleChangeText}
              keyboardType="phone-pad"
              placeholder="(000) 000-0000"
              placeholderTextColor="#E2E8F0"
              maxLength={14} // (XXX) XXX-XXXX = 14 chars
              className="text-3xl font-outfit-regular flex-1 text-gray-700"
              style={{ paddingVertical: 0 }}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
            />
          </TouchableOpacity>

          <View className="bg-blue-50/50 p-4 rounded-xl mt-auto mb-4">
            <Text className="text-xs text-slate-500 text-center font-outfit-regular leading-5">
              By providing my mobile number, I hereby agree and accept the{" "}
              <Text className="font-outfit-bold text-[#0047AB]">
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text className="font-outfit-bold text-[#0047AB]">
                Privacy Policy
              </Text>{" "}
              in use of the mechanic assistance app and to receive text message
              communications from mechanic on my mobile device.
            </Text>
          </View>

          {/* Continue button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={phoneNumber.length < 10 || isChecking}
            className={`w-full py-4 rounded-xl mb-8 items-center ${
              phoneNumber.length === 10 ? "bg-blue-700" : "bg-blue-200"
            }`}
          >
            {isChecking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-outfit-bold text-lg">
                Continue
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Modal */}
        <Modal
          visible={errorModal.visible}
          transparent
          animationType="fade"
          onRequestClose={hideError}
        >
          <View className="flex-1 bg-black/40 justify-center items-center px-6">
            <View className="bg-white rounded-3xl w-full p-8 items-center shadow-xl">
              <View className="w-16 h-16 bg-red-50 rounded-full justify-center items-center mb-6">
                <Ionicons name="alert-circle" size={32} color="#EF4444" />
              </View>

              <Text className="text-xl font-outfit-bold text-[#0F172A] mb-2 text-center">
                {errorModal.title}
              </Text>

              <Text className="text-base font-outfit-regular text-slate-500 text-center mb-8">
                {errorModal.message}
              </Text>

              <TouchableOpacity
                className="bg-blue-700 w-full py-4 rounded-xl shadow-sm"
                onPress={hideError}
              >
                <Text className="text-white text-center font-outfit-bold text-lg">
                  Got it
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}
