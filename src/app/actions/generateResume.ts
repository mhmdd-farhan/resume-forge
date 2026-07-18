"use server";

import { GenerateInputSchema, type GenerateResult } from "@/lib/types";
import {
  parseGitHubProfile,
  parseGitHubRepos,
  parseLinkedInProfile,
} from "@/lib/parser";
import { generateResumeWithAI } from "@/lib/ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

const STARTER_DAILY_LIMIT = 4;
const FREE_TOTAL_LIMIT = 3;

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function generateResume(
  formData: FormData,
): Promise<
  { success: true; data: GenerateResult } | { success: false; error: string }
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(session.user as any).id) {
      return { success: false, error: "Please sign in with Google to generate a resume." };
    }

    const userId = (session.user as any).id;

    // Always read fresh from DB — never trust JWT for billing-critical checks
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        plan: true,
        resumesGenerated: true,
        dailyResumesGenerated: true,
        lastGenerationDate: true,
        polarSubscriptionId: true,
      },
    });

    if (!dbUser) {
      return { success: false, error: "User session not found in database." };
    }

    const hasValidSubscription = !!dbUser.polarSubscriptionId;
    const isStarter = dbUser.plan === "starter" && hasValidSubscription;
    const isPaid = (dbUser.plan === "premium" || dbUser.plan === "annual") && hasValidSubscription;
    const effectivePlan: string = isPaid ? dbUser.plan : isStarter ? "starter" : "free";

    if (effectivePlan === "free" && dbUser.resumesGenerated >= FREE_TOTAL_LIMIT) {
      return {
        success: false,
        error: `You have reached the limit of ${FREE_TOTAL_LIMIT} free resume generations. Upgrade to Starter or Premium for more access.`,
      };
    }

    if (effectivePlan === "starter") {
      const today = todayUtc();
      const isNewDay = dbUser.lastGenerationDate !== today;
      const dailyUsed = isNewDay ? 0 : dbUser.dailyResumesGenerated;

      if (dailyUsed >= STARTER_DAILY_LIMIT) {
        return {
          success: false,
          error: `You've used all ${STARTER_DAILY_LIMIT} daily CV generations. Your limit resets at midnight UTC. Upgrade to Premium for unlimited access.`,
        };
      }
    }

    const raw = {
      jobDescription: formData.get("jobDescription") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      githubUrl: formData.get("githubUrl") as string,
      githubRepoUrls: formData.get("githubRepoUrls") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      linkedinText: formData.get("linkedinText") as string,
      educationText: formData.get("educationText") as string,
      portfolioUrl: formData.get("portfolioUrl") as string,
    };

    const parsed = GenerateInputSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const {
      jobDescription,
      phone,
      address,
      githubUrl,
      githubRepoUrls,
      linkedinUrl,
      linkedinText,
      educationText,
      portfolioUrl,
    } = parsed.data;

    const repoUrls = (githubRepoUrls ?? "")
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    const [githubProfile, githubRepos, linkedinProfile] = await Promise.all([
      githubUrl ? parseGitHubProfile(githubUrl) : null,
      repoUrls.length > 0 ? parseGitHubRepos(repoUrls) : Promise.resolve([]),
      Promise.resolve(
        linkedinUrl || linkedinText
          ? parseLinkedInProfile(
              linkedinUrl ?? undefined,
              linkedinText ?? undefined,
            )
          : null,
      ),
    ]);

    const result = await generateResumeWithAI({
      jobDescription,
      githubProfile,
      githubRepos,
      linkedinProfile,
      portfolioUrl: portfolioUrl ?? undefined,
      educationText: educationText ?? undefined,
    });

    const contactInfo = {
      phone: phone ?? undefined,
      address: address ?? undefined,
      githubUrl: githubUrl ?? undefined,
      linkedinUrl: linkedinUrl ?? undefined,
      portfolioUrl: portfolioUrl ?? undefined,
    };

    const today = todayUtc();
    const isNewDay = dbUser.lastGenerationDate !== today;

    await prisma.user.update({
      where: { id: userId },
      data: {
        resumesGenerated: { increment: 1 },
        dailyResumesGenerated: isNewDay ? 1 : { increment: 1 },
        lastGenerationDate: today,
      },
    });

    return { success: true, data: { ...result, contactInfo } };
  } catch (err) {
    console.error("Resume generation error:", err);
    return {
      success: false,
      error: "Failed to generate resume. Please try again.",
    };
  }
}
