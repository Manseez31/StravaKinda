import { Platform } from "react-native";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import { hasPremium } from "../utils/entitlements";
let configured = false;
export async function purchaseClient(userId: string) {
  const apiKey =
    Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (Platform.OS === "web" || !apiKey)
    throw new Error(
      "Store products are not configured. Add RevenueCat keys and use a development build.",
    );
  if (!configured) {
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } else await Purchases.logIn(userId);
  return Purchases;
}
export async function packages(userId: string) {
  const client = await purchaseClient(userId);
  const offerings = await client.getOfferings();
  return offerings.current?.availablePackages ?? [];
}
export async function buy(userId: string, item: PurchasesPackage) {
  const result = await (await purchaseClient(userId)).purchasePackage(item);
  return hasPremium(result.customerInfo.entitlements.active.premium);
}
export async function restore(userId: string) {
  const info = await (await purchaseClient(userId)).restorePurchases();
  return hasPremium(info.entitlements.active.premium);
}
export async function premiumStatus(userId: string) {
  return hasPremium(
    (await (await purchaseClient(userId)).getCustomerInfo()).entitlements.active
      .premium,
  );
}
export async function logoutPurchases() {
  if (configured) await Purchases.logOut();
}
