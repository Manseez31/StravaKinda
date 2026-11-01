import { useState } from "react";
import { Linking, Platform } from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import { Screen, Heading, Card, Copy, Button } from "../../components/ui";
import { useSession } from "../../hooks/useSession";
import { useAction } from "../../hooks/useAction";
import { buy, packages, restore } from "../../services/purchases";
export default function Subscription() {
  const session = useSession(),
    a = useAction(),
    [items, setItems] = useState<PurchasesPackage[]>([]);
  const user = () => {
    if (!session) throw new Error("Sign in before purchasing or restoring.");
    return session.user.id;
  };
  return (
    <Screen>
      <Heading eyebrow="StravaKinda Plus">
        More perspective.{"\n"}Same love of moving.
      </Heading>
      <Copy muted>Free recording and your basic history remain free.</Copy>
      <Card>
        <Copy>Plus roadmap</Copy>
        <Copy muted>
          AI coaching has a server adapter. Advanced comparisons, heatmaps,
          advanced route tools, offline maps, and training reports are still
          under development. Do not enable paid products for public sale before
          completing these features and store review.
        </Copy>
        <Button
          title="Load store plans"
          disabled={a.busy}
          onPress={() =>
            void a.run(async () => {
              const result = await packages(user());
              setItems(result);
              if (!result.length)
                throw new Error(
                  "No offerings configured. Add monthly and annual products to the premium entitlement in RevenueCat.",
                );
            })
          }
        />
        {items.map((item) => (
          <Button
            key={item.identifier}
            disabled={a.busy}
            title={`${item.product.title} · ${item.product.priceString}`}
            onPress={() =>
              void a.run(async () => {
                if (!(await buy(user(), item)))
                  throw new Error(
                    "Purchase completed without an active premium entitlement. Contact support.",
                  );
              }, "Store purchase returned an active premium entitlement.")
            }
          />
        ))}
        <Button
          secondary
          title="Restore purchases"
          disabled={a.busy}
          onPress={() =>
            void a.run(async () => {
              if (!(await restore(user())))
                throw new Error(
                  "No active premium entitlement found for this store account.",
                );
            }, "Premium restored.")
          }
        />
      </Card>
      <Copy muted>
        Subscriptions renew according to the store’s terms. Prices and billing
        periods are supplied by the store. Real purchases require store
        configuration and sandbox validation.
      </Copy>
      <Button
        secondary
        title="Manage or cancel in store"
        onPress={() =>
          void Linking.openURL(
            Platform.OS === "ios"
              ? "https://apps.apple.com/account/subscriptions"
              : "https://play.google.com/store/account/subscriptions",
          )
        }
      />
      {a.message && <Copy>{a.message}</Copy>}
    </Screen>
  );
}
