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
      select: { plan: true, resumesGenerated: true, polarSubscriptionId: true },
    });

    if (!dbUser) {
      return { success: false, error: "User session not found in database." };
    }

    // Determine effective plan:
    // If plan is premium/annual but there's no linked subscription ID,
    // the subscription was likely revoked — treat as free
    const isPaidPlan = dbUser.plan === "premium" || dbUser.plan === "annual";
    const hasValidSubscription = isPaidPlan && !!dbUser.polarSubscriptionId;
    const effectivePlan: string = hasValidSubscription ? dbUser.plan : "free";

    // Free tier limit: 3 generations maximum
    if (effectivePlan === "free" && dbUser.resumesGenerated >= 3) {
      return {
        success: false,
        error:
          "You have reached the limit of 3 free resume generations. Please upgrade to a Premium plan for unlimited access.",
      };
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

    // Parse repo URLs from comma-separated string
    // Use ?? to safely handle undefined (preprocess converts "" to undefined)
    const repoUrls = (githubRepoUrls ?? "")
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    // Parse profiles and repos in parallel
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

    // Generate resume with AI
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

    // Increment user resume generation count on success
    await prisma.user.update({
      where: { id: userId },
      data: {
        resumesGenerated: {
          increment: 1,
        },
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

