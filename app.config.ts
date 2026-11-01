import type { ExpoConfig } from "expo/config";
const config: ExpoConfig = {
  name: "StravaKinda",
  slug: "stravakinda",
  version: "1.0.0",
  scheme: "stravakinda",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.stravakinda.app",
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: "com.stravakinda.app",
    adaptiveIcon: {
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundColor: "#101416",
    },
  },
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-secure-store",
    "expo-dev-client",
    "expo-font",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#101416",
        image: "./assets/splash-icon.png",
        imageWidth: 160,
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "StravaKinda uses your location to measure workouts and save your route.",
        locationAlwaysAndWhenInUsePermission:
          "Allow background location to continue your workout while your screen is locked.",
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: true,
      },
    ],
    ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY
      ? ([
          [
            "react-native-maps",
            {
              androidGoogleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY,
            },
          ],
        ] as [string, Record<string, string>][])
      : []),
  ],
  experiments: { typedRoutes: false },
};
export default config;
