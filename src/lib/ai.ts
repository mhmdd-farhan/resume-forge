import type { GitHubProfile, GitHubRepoDetail, LinkedInProfile } from "./parser";
import type { Resume, ResumeScore } from "./types";

const N8N_WEBHOOK_URL = "https://n8n.gloapp.my.id/webhook/resume-generator";
const N8N_BASIC_AUTH = Buffer.from(process.env.N8N_BASIC_AUTH ?? "").toString("base64");

export async function generateResumeWithAI(params: {
  jobDescription: string;
  githubProfile: GitHubProfile | null;
  githubRepos: GitHubRepoDetail[];
  linkedinProfile: LinkedInProfile | null;
  portfolioUrl?: string;
  educationText?: string;
}): Promise<{ resume: Resume; score: ResumeScore }> {
  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${N8N_BASIC_AUTH}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
