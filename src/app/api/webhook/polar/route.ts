import { Webhooks } from "@polar-sh/nextjs";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES = new Set(["active", "trialing"]);
const REVOKED_STATUSES = new Set(["canceled", "revoked", "past_due", "unpaid", "incomplete_expired"]);

function resolvePlan(productId: string): "starter" | "annual" | "premium" {
  if (productId === process.env.NEXT_PUBLIC_POLAR_ANNUAL_PRODUCT_ID) return "annual";
  if (productId === process.env.NEXT_PUBLIC_POLAR_STARTER_PRODUCT_ID) return "starter";
  return "premium";
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const { type, data } = payload;
    console.log("[Polar Webhook] event:", type);

    if (!type.startsWith("subscription.")) return;

    const subscription = data as any;
    const metadata = subscription.metadata || {};
    const userId = metadata.userId as string | undefined;
    const customerEmail =
      subscription.customerEmail || subscription.customer?.email;

    const paidPlan = resolvePlan(subscription.productId);

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!user && customerEmail) {
      user = await prisma.user.findFirst({ where: { email: customerEmail } });
    }

    if (!user) {
      console.warn(
        `[Polar Webhook] User not found. userId=${userId}, email=${customerEmail}`
      );
      return;
    }

    const status: string = subscription.status ?? "";

    if (
      type === "subscription.created" ||
      type === "subscription.active" ||
      type === "subscription.updated"
    ) {
      if (ACTIVE_STATUSES.has(status)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: paidPlan,
            polarCustomerId: subscription.customerId || null,
            polarSubscriptionId: subscription.id || null,
          },
        });
        console.log(
          `[Polar Webhook] User ${user.id} upgraded to ${paidPlan} (status: ${status})`
        );
      } else if (REVOKED_STATUSES.has(status)) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            plan: "free",
            polarSubscriptionId: null,
          },
        });
        console.log(
          `[Polar Webhook] User ${user.id} demoted to free (status: ${status})`
        );
      }
    } else if (
      type === "subscription.canceled" ||
      type === "subscription.revoked"
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "free",
          polarSubscriptionId: null,
        },
      });
      console.log(
        `[Polar Webhook] User ${user.id} demoted to free (event: ${type})`
      );
    }
  },
});
