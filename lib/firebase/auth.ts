import auth, { FirebaseAuthTypes, getIdToken as firebaseGetIdToken } from '@react-native-firebase/auth';

// Module-level store for the pending confirmation result (shared between screens during setup flow)
let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

/**
 * Sends an OTP SMS via Firebase Phone Auth.
 * @param phoneNumber  E.164 format, e.g. "+11234567890"
 */
export const sendOTP = async (phoneNumber: string): Promise<void> => {
    console.log('[FirebaseAuth] sendOTP called for:', phoneNumber);
    console.log('[FirebaseAuth] Current user before sendOTP:', auth().currentUser?.uid ?? 'none');

    // Sign out any existing Firebase session before starting phone auth
    // to avoid auth/internal-error when a previous user is still signed in
    if (auth().currentUser) {
        console.log('[FirebaseAuth] Signing out existing user before OTP...');
        await auth().signOut();
    }

    const startTime = Date.now();
    try {
        console.log('[FirebaseAuth] Calling signInWithPhoneNumber...');
        pendingConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
        const elapsed = Date.now() - startTime;
        console.log(`[FirebaseAuth] signInWithPhoneNumber resolved in ${elapsed}ms`);
        console.log('[FirebaseAuth] verificationId:', (pendingConfirmation as any)?.verificationId ?? 'n/a');
    } catch (err: any) {
        const elapsed = Date.now() - startTime;
        console.error(`[FirebaseAuth] signInWithPhoneNumber FAILED after ${elapsed}ms:`, err?.code, err?.message);
        console.error(`[FirebaseAuth] Full error:`, JSON.stringify(err, null, 2));
        console.error(`[FirebaseAuth] nativeErrorMessage:`, err?.nativeErrorMessage);
        console.error(`[FirebaseAuth] userInfo:`, JSON.stringify(err?.userInfo, null, 2));
        throw err;
    }
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
    return user ? firebaseGetIdToken(user) : null;
};

/** True if we have a pending OTP confirmation waiting to be verified. */
export const hasPendingOTP = (): boolean => pendingConfirmation !== null;

/** Signs the user out of Firebase (called on app logout). */
export const firebaseSignOut = async (): Promise<void> => {
    await auth().signOut();
};
