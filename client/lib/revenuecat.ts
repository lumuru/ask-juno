import Purchases from "react-native-purchases";
import { Platform } from "react-native";

const REVENUECAT_API_KEY_IOS =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? "";
const REVENUECAT_API_KEY_ANDROID =
  process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? "";

export async function initRevenueCat(userId: string) {
  const apiKey =
    Platform.OS === "ios"
      ? REVENUECAT_API_KEY_IOS
      : REVENUECAT_API_KEY_ANDROID;

  if (!apiKey) return;

  Purchases.configure({ apiKey, appUserID: userId });
}

export async function getSubscriptionStatus(): Promise<{
  isPaid: boolean;
  willRenew: boolean;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPaid =
      Object.keys(customerInfo.entitlements.active).length > 0;
    const activeEntitlement = Object.values(
      customerInfo.entitlements.active,
    )[0];

    return {
      isPaid,
      willRenew: activeEntitlement?.willRenew ?? false,
    };
  } catch {
    return { isPaid: false, willRenew: false };
  }
}

export async function getOfferings() {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return Object.keys(customerInfo.entitlements.active).length > 0;
}

export async function restorePurchases() {
  const customerInfo = await Purchases.restorePurchases();
  return Object.keys(customerInfo.entitlements.active).length > 0;
}
