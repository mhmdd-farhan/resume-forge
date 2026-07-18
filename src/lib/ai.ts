import type { GitHubProfile, GitHubRepoDetail, LinkedInProfile } from "./parser";
import type { Resume, ResumeScore } from "./types";

const N8N_WEBHOOK_URL = "https://n8n.gloapp.my.id/webhook/resume-generator";
const N8N_BASIC_AUTH = Buffer.from(process.env.N8N_BASIC_AUTH ?? "").toString("base64");

function formatCandidateContext(params: {
  githubProfile: GitHubProfile | null;
  githubRepos: GitHubRepoDetail[];
  linkedinProfile: LinkedInProfile | null;
  portfolioUrl?: string;
  educationText?: string;
}): string {
  const { githubProfile, githubRepos, linkedinProfile, portfolioUrl, educationText } = params;
  const sections: string[] = [];

  // LinkedIn / work experience — highest priority, use verbatim
  if (linkedinProfile?.pastedText) {
    sections.push(
      `## WORK EXPERIENCE (PRIMARY SOURCE — use this EXACTLY as-is for all jobs, companies, roles, dates, and achievements. Do NOT invent or alter any detail here)\n` +
      `---\n${linkedinProfile.pastedText.trim()}\n---`
    );
  }

  // Education — use verbatim if provided
  if (educationText) {
    sections.push(
      `## EDUCATION (PRIMARY SOURCE — use this EXACTLY for institution names, degrees, and years)\n` +
      `---\n${educationText.trim()}\n---`
    );
  }

  // GitHub profile summary
  if (githubProfile) {
    const profileLines: string[] = [`## GITHUB PROFILE`];
    if (githubProfile.name) profileLines.push(`Name: ${githubProfile.name}`);
    if (githubProfile.bio) profileLines.push(`Bio: ${githubProfile.bio}`);
    if (githubProfile.languages.length > 0) {
      profileLines.push(`Top Languages: ${githubProfile.languages.slice(0, 8).join(", ")}`);
    }
    if (githubProfile.topProjects.length > 0) {
      profileLines.push(`\nTop Repositories:`);
      githubProfile.topProjects.forEach((p) => {
        profileLines.push(`- ${p.name}${p.language ? ` (${p.language})` : ""}${p.stars > 0 ? ` ⭐${p.stars}` : ""}: ${p.description ?? "No description"}`);
      });
    }
    sections.push(profileLines.join("\n"));
  }

  // Specific repo READMEs — highest fidelity project data
  if (githubRepos.length > 0) {
    const repoLines: string[] = [`## GITHUB REPOSITORIES (PRIMARY SOURCE for project descriptions — extract real tech stacks, features, and highlights from each README)`];
    githubRepos.forEach((repo) => {
      repoLines.push(`\n### ${repo.name}${repo.language ? ` (${repo.language})` : ""}`);
      if (repo.description) repoLines.push(`Description: ${repo.description}`);
      if (repo.topics.length > 0) repoLines.push(`Topics: ${repo.topics.join(", ")}`);
      if (repo.stars > 0) repoLines.push(`Stars: ${repo.stars}`);
      if (repo.readme) {
        repoLines.push(`README:\n${repo.readme.trim()}`);
      }
    });
    sections.push(repoLines.join("\n"));
  }

  // Portfolio URL
  if (portfolioUrl) {
    sections.push(`## PORTFOLIO\n${portfolioUrl}`);
  }

  if (sections.length === 0) {
    return "No candidate profile data provided. Generate a strong sample resume based on the job requirements using clearly placeholder data. Use 'Your Name' as the candidate name.";
  }

  return sections.join("\n\n");
}

export async function generateResumeWithAI(params: {
  jobDescription: string;
  githubProfile: GitHubProfile | null;
  githubRepos: GitHubRepoDetail[];
  linkedinProfile: LinkedInProfile | null;
  portfolioUrl?: string;
  educationText?: string;
}): Promise<{ resume: Resume; score: ResumeScore }> {
  const candidateContext = formatCandidateContext(params);

  const response = await fetch(N8N_WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${N8N_BASIC_AUTH}`,
    },
    body: JSON.stringify({
      jobDescription: params.jobDescription,
      candidateContext,
    }),
  });

  if (!response.ok) {
    throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
