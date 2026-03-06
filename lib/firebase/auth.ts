import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';

// Module-level store for the pending confirmation result (shared between screens during setup flow)
let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

/**
 * Sends an OTP SMS via Firebase Phone Auth.
 * @param phoneNumber  E.164 format, e.g. "+11234567890"
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
    pendingConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
};

/**
 * Verifies the OTP code entered by the user.
 * Works for both login and signup flows.
 */
export const verifyOTP = async (code: string): Promise<FirebaseAuthTypes.User> => {
    if (!pendingConfirmation) {
        throw new Error('No pending OTP. Please request a new code.');
    }
    const credential = await pendingConfirmation.confirm(code);
    if (!credential?.user) {
        throw new Error('OTP verification failed. Please try again.');
    }
    pendingConfirmation = null;
    return credential.user;
};

/** Returns the Firebase ID token for the currently signed-in Firebase user. */
export const getIdToken = async (): Promise<string | null> => {
    const user = auth().currentUser;
    return user ? user.getIdToken() : null;
};

/** True if we have a pending OTP confirmation waiting to be verified. */
export const hasPendingOTP = (): boolean => pendingConfirmation !== null;

/** Signs the user out of Firebase (called on app logout). */
export const firebaseSignOut = async (): Promise<void> => {
    await auth().signOut();
};
