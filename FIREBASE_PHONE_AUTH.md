# Firebase Phone Authentication — Implementation Walkthrough

This document covers everything required to implement Firebase Phone Auth (SMS OTP) in a React Native / Expo app using `@react-native-firebase/auth`. It captures every issue encountered and how it was resolved.

---

## Overview

Firebase Phone Auth on iOS works through two verification methods:
1. **APNs silent push** (preferred) — Firebase sends a silent push notification to verify the device
2. **reCAPTCHA fallback** — opens a Safari WebView for verification if APNs fails

Both methods require specific native configuration that must survive `expo prebuild --clean` (which EAS always runs). The solution is **Expo Config Plugins**.

---

## Prerequisites

- Firebase project (must be on **Blaze billing plan** — see [Billing](#billing))
- Apple Developer account with Push Notifications capability
- APNs Auth Key (.p8 file) from Apple Developer portal
- `@react-native-firebase/app` and `@react-native-firebase/auth` installed

---

## Step 1 — Firebase Project Setup

### 1.1 Create iOS app in Firebase
- Firebase Console → Project Settings → Your apps → Add app → iOS
- Bundle ID must exactly match `ios.bundleIdentifier` in `app.json`
- Set the Team ID (found in Apple Developer portal)
- Download `GoogleService-Info.plist`

### 1.2 Enable Phone Auth
- Firebase Console → Authentication → Sign-in method → Phone → **Enable**

### 1.3 Billing — CRITICAL
**Firebase Phone Auth requires the Blaze (pay-as-you-go) plan for real SMS on real devices.**
- Spark (free) plan blocks real SMS with `BILLING_NOT_ENABLED`
- Test phone numbers (see [Testing](#testing)) still work on any plan
- Blaze has a free tier: 10,000 SMS/month at no charge

To verify billing is active:
```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+11234567890", "recaptchaToken": "test"}'
```
- `BILLING_NOT_ENABLED` → upgrade to Blaze
- `CAPTCHA_CHECK_FAILED` → billing is active (fake reCAPTCHA token expected)

### 1.4 Upload APNs Auth Key
- Firebase Console → Project Settings → Cloud Messaging → Apple app configuration
- Upload the `.p8` APNs Auth Key from Apple Developer portal
- The p8 key covers both sandbox (debug) and production environments

---

## Step 2 — GoogleService-Info.plist

Download the **complete** plist from Firebase Console (not a minimal one). It must contain:
- `API_KEY`
- `GOOGLE_APP_ID`
- `BUNDLE_ID`
- `CLIENT_ID`
- `REVERSED_CLIENT_ID` ← **required for reCAPTCHA fallback**
- `GCM_SENDER_ID`
- `PROJECT_ID`

Place it at `firebase/GoogleService-Info.plist` and reference it in `app.json`:
```json
"ios": {
  "googleServicesFile": "./firebase/GoogleService-Info.plist"
}
```

Expo copies this to `ios/Mechanic/GoogleService-Info.plist` during prebuild.

---

## Step 3 — app.json Configuration

```json
{
  "expo": {
    "ios": {
      "bundleIdentifier": "com.yourapp.bundle",
      "googleServicesFile": "./firebase/GoogleService-Info.plist",
      "entitlements": {
        "aps-environment": "production"
      }
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      ["expo-build-properties", { "ios": { "useFrameworks": "static" } }],
      "./plugins/withFirebasePodfile",
      "./plugins/withFirebaseAuthAPNS"
    ]
  }
}
```

Key points:
- `aps-environment: production` entitlement is required for Push Notifications (even in debug builds)
- `expo-build-properties` with `useFrameworks: static` is required for RNFirebase CocoaPods
- The two custom plugins (Steps 4 and 5) make all native changes persistent across `expo prebuild --clean`

---

## Step 4 — Config Plugin: Podfile Fixes (`plugins/withFirebasePodfile.js`)

EAS runs `expo prebuild --clean` which wipes `ios/`. All Podfile changes must go through a config plugin.

```javascript
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

const withFirebasePodfile = (config) => {
    return withDangerousMod(config, ['ios', (config) => {
        const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
        let podfile = fs.readFileSync(podfilePath, 'utf8');

        // Required for @react-native-firebase to build as static framework
        if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
            podfile = podfile.replace('prepare_react_native_project!',
                '# Required for @react-native-firebase to build as static framework\n$RNFirebaseAsStaticFramework = true\n\nprepare_react_native_project!');
        }

        // Required for modular headers with static frameworks
        if (!podfile.includes('use_modular_headers!')) {
            podfile = podfile.replace(/(\s+use_frameworks!.*?\n)/, '$1  use_modular_headers!\n');
        }

        // Fix: "include of non-modular header inside framework module RNFBApp"
        if (!podfile.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
            podfile = podfile.replace(/([ \t]*react_native_post_install\([\s\S]*?\)\s*\n)/,
                '$1\n    installer.pods_project.targets.each do |target|\n      target.build_configurations.each do |config|\n        config.build_settings[\'CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES\'] = \'YES\'\n      end\n    end\n');
        }

        fs.writeFileSync(podfilePath, podfile);
        return config;
    }]);
};

module.exports = withFirebasePodfile;
```

This fixes three CocoaPods build errors:
- *"Swift pods cannot yet be integrated as static libraries"*
- *"include of non-modular header inside framework module RNFBApp"*
- Xcode build exit code 65

---

## Step 5 — Config Plugin: APNs Forwarding (`plugins/withFirebaseAuthAPNS.js`)

Firebase Phone Auth requires the iOS app to forward APNs tokens and silent push notifications to the Firebase Auth SDK. This must be done in `AppDelegate.swift`.

```javascript
const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const APNS_METHODS = `
  // Firebase Auth APNs forwarding — required for phone auth silent push (no reCAPTCHA)
  public override func application(
    _ application: UIApplication,
    didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
  ) {
    let tokenString = deviceToken.map { String(format: "%02x", $0) }.joined()
    print("[FirebaseAuth] ✅ APNs token received: \\(tokenString.prefix(20))...")
    #if DEBUG
    print("[FirebaseAuth] Setting APNs token type: sandbox")
    Auth.auth().setAPNSToken(deviceToken, type: .sandbox)
    #else
    print("[FirebaseAuth] Setting APNs token type: prod")
    Auth.auth().setAPNSToken(deviceToken, type: .prod)
    #endif
    super.application(application, didRegisterForRemoteNotificationsWithDeviceToken: deviceToken)
  }

  public override func application(
    _ application: UIApplication,
    didFailToRegisterForRemoteNotificationsWithError error: Error
  ) {
    print("[FirebaseAuth] ❌ Failed to register for APNs: \\(error.localizedDescription)")
    super.application(application, didFailToRegisterForRemoteNotificationsWithError: error)
  }

  public override func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    print("[FirebaseAuth] 📬 Remote notification received")
    if Auth.auth().canHandleNotification(userInfo) {
      print("[FirebaseAuth] ✅ Firebase handled the notification")
      completionHandler(.noData)
      return
    }
    print("[FirebaseAuth] ℹ️ Notification not for Firebase, forwarding to super")
    super.application(application, didReceiveRemoteNotification: userInfo, fetchCompletionHandler: completionHandler)
  }
`;

const withFirebaseAuthAPNS = (config) => {
    // 1. Inject APNs methods into AppDelegate
    config = withAppDelegate(config, (config) => {
        let contents = config.modResults.contents;

        if (!contents.includes('FirebaseAuth')) {
            contents = contents.replace(
                'import FirebaseCore',
                'import FirebaseCore\nimport FirebaseAuth'
            );
        }

        if (!contents.includes('didRegisterForRemoteNotificationsWithDeviceToken')) {
            // Inject before closing brace of AppDelegate class
            contents = contents.replace(
                /\n}\n\nclass ReactNativeDelegate:/,
                `\n${APNS_METHODS}\n}\n\nclass ReactNativeDelegate:`
            );
        }

        config.modResults.contents = contents;
        return config;
    });

    // 2. Add UIBackgroundModes: remote-notification to Info.plist
    config = withInfoPlist(config, (config) => {
        const plist = config.modResults;
        if (!plist.UIBackgroundModes) {
            plist.UIBackgroundModes = [];
        }
        if (!plist.UIBackgroundModes.includes('remote-notification')) {
            plist.UIBackgroundModes.push('remote-notification');
        }
        return config;
    });

    return config;
};

module.exports = withFirebaseAuthAPNS;
```

---

## Step 6 — Add Push Notifications Capability in Xcode

Even with the entitlement in `app.json`, you must add it in Xcode:
1. Open `ios/YourApp.xcworkspace` in Xcode
2. Select the app target → **Signing & Capabilities**
3. Click **+ Capability** → add **Push Notifications**
4. EAS will regenerate the provisioning profile to include it

If using EAS Build, the profile is regenerated automatically once the capability exists.

---

## Step 7 — JS Implementation (`lib/firebase/auth.ts`)

```typescript
import auth, { FirebaseAuthTypes, getIdToken as firebaseGetIdToken } from '@react-native-firebase/auth';

let pendingConfirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

export const sendOTP = async (phoneNumber: string): Promise<void> => {
    // Sign out any existing Firebase session first — avoids auth/internal-error
    if (auth().currentUser) {
        await auth().signOut();
    }

    // Use the NAMESPACED API (auth().signInWithPhoneNumber)
    // The modular API (signInWithPhoneNumber(getAuth(), ...)) does NOT properly
    // handle the reCAPTCHA fallback on iOS despite being the "new" API.
    pendingConfirmation = await auth().signInWithPhoneNumber(phoneNumber);
};

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

export const getIdToken = async (): Promise<string | null> => {
    const user = auth().currentUser;
    return user ? firebaseGetIdToken(user) : null;
};

export const hasPendingOTP = (): boolean => pendingConfirmation !== null;

export const firebaseSignOut = async (): Promise<void> => {
    await auth().signOut();
};
```

**Critical**: use `auth().signInWithPhoneNumber()` (namespaced), NOT `signInWithPhoneNumber(getAuth(), ...)` (modular). The modular wrapper is incomplete for iOS phone auth in `@react-native-firebase` v23.

---

## Step 8 — Build and Run

```bash
# Regenerate native iOS project with all plugin changes applied
npx expo prebuild --clean

# Run on real device (phone auth requires real device for APNs)
npx expo run:ios --device
```

When a new device is connected for the first time:
- Xcode must register it with your Apple Developer account
- Open `ios/YourApp.xcworkspace` → Signing & Capabilities → let Xcode auto-manage
- Or just run with `--device` and Xcode will prompt to register

---

## Testing

### Test Phone Numbers (recommended for development)
Firebase Console → Authentication → Sign-in method → Phone → **"Phone numbers for testing"**

Add numbers with fixed OTP codes:
```
+19546486744  →  123456
+11111111111  →  123456
```

Benefits:
- No SMS cost
- No rate limiting
- Works on any billing plan
- Works on simulators

### Real SMS on Real Device
- Requires Blaze billing plan
- Requires APNs to be configured (or reCAPTCHA fallback)
- Debug builds use APNs **sandbox** — can be unreliable
- **TestFlight / App Store builds use production APNs — most reliable**

### Simulator
Real phone numbers never work on simulator (no APNs). Always use test phone numbers.

---

## Errors Encountered and Fixes

### `BILLING_NOT_ENABLED`
**Cause**: Firebase project on Spark (free) plan
**Fix**: Upgrade to Blaze at Firebase Console → Project Settings → Usage and billing

Verify with:
```bash
curl -X POST "https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+11234567890", "recaptchaToken": "test"}'
# BILLING_NOT_ENABLED → still on Spark
# CAPTCHA_CHECK_FAILED → Blaze is active ✅
```

---

### `auth/too-many-requests`
**Cause**: Too many failed OTP attempts from the same device (happens during debugging)
**Fix**: Wait ~1 hour, or add the phone number as a Firebase test phone number to bypass rate limiting

---

### `auth/internal-error` (fast, <500ms)
**Cause 1**: Existing Firebase user signed in before calling `signInWithPhoneNumber`
**Fix**: Sign out first — `if (auth().currentUser) await auth().signOut()`

**Cause 2**: Using modular API `signInWithPhoneNumber(getAuth(), ...)` which doesn't handle reCAPTCHA on iOS
**Fix**: Use namespaced API `auth().signInWithPhoneNumber(phoneNumber)`

**Cause 3**: Billing not enabled (see above)

---

### `auth/internal-error` (slow, ~13 seconds)
**Cause**: Firebase user already signed in AND APNs verification timing out
**Fix**: Sign out existing user before calling `signInWithPhoneNumber`

---

### Xcode build exit code 65 — "Swift pods cannot yet be integrated as static libraries"
**Cause**: RNFirebase requires static framework linkage
**Fix**: `withFirebasePodfile` plugin adds `$RNFirebaseAsStaticFramework = true` + `use_frameworks! :linkage => :static` + `use_modular_headers!`

---

### Xcode build exit code 65 — "include of non-modular header inside framework module RNFBApp"
**Cause**: Framework module restrictions conflict with RNFirebase headers
**Fix**: `withFirebasePodfile` plugin adds `CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES` in `post_install`

---

### EXC_BREAKPOINT / SIGTRAP crash in `PhoneAuthProvider.verifyPhoneNumber`
**Cause**: `REVERSED_CLIENT_ID` missing from `GoogleService-Info.plist`
**Fix**: Download the complete plist from Firebase Console (not a partial one). Must include `CLIENT_ID` and `REVERSED_CLIENT_ID`.

---

### Provisioning profile doesn't include Push Notifications (EAS build)
**Cause**: Push Notifications capability not added in Xcode
**Fix**: Xcode → Target → Signing & Capabilities → + Capability → Push Notifications. EAS regenerates the profile.

---

### `override` can only be specified on class members (AppDelegate.swift build error)
**Cause**: Plugin injected APNs methods AFTER the closing `}` of AppDelegate class
**Fix**: Use regex `/\n}\n\nclass ReactNativeDelegate:/` to inject BEFORE the class boundary

---

### reCAPTCHA showing instead of silent SMS
**Cause**: APNs not working for the build type (expected behavior for debug builds)
**Note**: reCAPTCHA appearing and then showing the OTP screen is acceptable. For production builds (TestFlight / App Store), APNs works silently without reCAPTCHA.

---

## Files Reference

| File | Purpose |
|------|---------|
| `firebase/GoogleService-Info.plist` | Firebase iOS config — must include `REVERSED_CLIENT_ID` |
| `plugins/withFirebasePodfile.js` | Config plugin: static framework + modular headers Podfile fixes |
| `plugins/withFirebaseAuthAPNS.js` | Config plugin: APNs token forwarding in AppDelegate + UIBackgroundModes |
| `lib/firebase/auth.ts` | JS Firebase Auth wrapper — sendOTP, verifyOTP, getIdToken |
| `ios/Mechanic/AppDelegate.swift` | Generated by prebuild + plugins — contains APNs delegate methods |
| `ios/Mechanic/Info.plist` | Generated by prebuild — contains `UIBackgroundModes` and URL schemes |
| `app.json` | `aps-environment` entitlement + plugin registrations |

---

## Checklist for New Setup

- [ ] Firebase project on **Blaze** billing plan
- [ ] Phone Auth **enabled** in Firebase Console
- [ ] iOS app registered in Firebase with correct **Bundle ID** and **Team ID**
- [ ] **APNs Auth Key (.p8)** uploaded to Firebase Console
- [ ] `GoogleService-Info.plist` downloaded (complete version with `REVERSED_CLIENT_ID`)
- [ ] `app.json` has `aps-environment: production` entitlement
- [ ] `app.json` has `expo-build-properties` plugin with `useFrameworks: static`
- [ ] `plugins/withFirebasePodfile.js` created and registered in `app.json`
- [ ] `plugins/withFirebaseAuthAPNS.js` created and registered in `app.json`
- [ ] Push Notifications capability added in Xcode
- [ ] `lib/firebase/auth.ts` uses `auth().signInWithPhoneNumber()` (namespaced API)
- [ ] Signs out existing Firebase user before calling `sendOTP`
- [ ] Test phone numbers added in Firebase Console for development
- [ ] `npx expo prebuild --clean` run after any plugin changes
