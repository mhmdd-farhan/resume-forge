"use server";

import { GenerateInputSchema, type GenerateResult } from "@/lib/types";
import { parseGitHubProfile, parseGitHubRepos, parseLinkedInProfile } from "@/lib/parser";
import { generateResumeWithAI } from "@/lib/ai";

export async function generateResume(
  formData: FormData
): Promise<{ success: true; data: GenerateResult } | { success: false; error: string }> {
  try {
    const raw = {
      jobDescription: formData.get("jobDescription") as string,
      githubUrl: formData.get("githubUrl") as string,
      githubRepoUrls: formData.get("githubRepoUrls") as string,
      linkedinUrl: formData.get("linkedinUrl") as string,
      linkedinText: formData.get("linkedinText") as string,
      portfolioUrl: formData.get("portfolioUrl") as string,
    };

    const parsed = GenerateInputSchema.safeParse(raw);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((e) => e.message).join(", "),
      };
    }

    const { jobDescription, githubUrl, githubRepoUrls, linkedinUrl, linkedinText, portfolioUrl } = parsed.data;

    // Parse repo URLs from comma-separated string
    const repoUrls = (githubRepoUrls || "")
      .split(",")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    // Parse profiles and repos in parallel
    const [githubProfile, githubRepos, linkedinProfile] = await Promise.all([
      githubUrl ? parseGitHubProfile(githubUrl) : null,
      repoUrls.length > 0 ? parseGitHubRepos(repoUrls) : Promise.resolve([]),
      Promise.resolve(
        (linkedinUrl || linkedinText)
          ? parseLinkedInProfile(linkedinUrl || undefined, linkedinText || undefined)
          : null
      ),
    ]);

    // Generate resume with AI
    const result = await generateResumeWithAI({
      jobDescription,
      githubProfile,
      githubRepos,
      linkedinProfile,
      portfolioUrl: portfolioUrl || undefined,
    });

    return { success: true, data: result };
  } catch (err) {
    console.error("Resume generation error:", err);
    return {
      success: false,
      error: "Failed to generate resume. Please try again.",
    };
  }
}
