import OpenAI from "openai";
import type { GitHubProfile, GitHubRepoDetail, LinkedInProfile } from "./parser";
import type { Resume, ResumeScore } from "./types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateResumeWithAI(params: {
  jobDescription: string;
  githubProfile: GitHubProfile | null;
  githubRepos: GitHubRepoDetail[];
  linkedinProfile: LinkedInProfile | null;
  portfolioUrl?: string;
  educationText?: string;
}): Promise<{ resume: Resume; score: ResumeScore }> {
  const { jobDescription, githubProfile, githubRepos, linkedinProfile, portfolioUrl, educationText } =
    params;

  const githubContext = githubProfile
    ? `
GitHub Profile:
- Name: ${githubProfile.name || "N/A"}
- Bio: ${githubProfile.bio || "N/A"}
- Languages: ${githubProfile.languages.join(", ")}
- Top Projects:
${githubProfile.topProjects
  .map(
    (p) =>
      `  - ${p.name}: ${p.description || "No description"} (${p.language}, ${p.stars} stars)`
  )
  .join("\n")}
`
    : "";

  const githubReposContext =
    githubRepos.length > 0
      ? `
Featured GitHub Repositories (scraped directly — use these for the Projects section):
${githubRepos
  .map(
    (r) =>
      `--- ${r.fullName} ---
Description: ${r.description || "N/A"}
Language: ${r.language || "N/A"} | Stars: ${r.stars}
Topics: ${r.topics.length > 0 ? r.topics.join(", ") : "N/A"}
${r.readme ? `README excerpt:\n${r.readme}` : ""}
`
  )
  .join("\n")}
`
      : "";

  const linkedinContext = linkedinProfile
    ? `
LinkedIn Profile:${linkedinProfile.url ? `\n- URL: ${linkedinProfile.url}` : ""}
${
  linkedinProfile.pastedText
    ? `- Experience & Background (pasted by candidate):\n${linkedinProfile.pastedText}`
    : ""
}`
    : "";

  const portfolioContext = portfolioUrl
    ? `\nPortfolio: ${portfolioUrl}`
    : "";

  const educationContext = educationText
    ? `
Education (provided by candidate — use as PRIMARY source for the education section):
${educationText}
`
    : "";

  const prompt = `You are an expert resume writer and career coach. Generate a professional, ATS-friendly resume tailored to the following job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE INFORMATION:
${githubContext}${githubReposContext}${linkedinContext}${educationContext}${portfolioContext}

${!githubContext && !githubReposContext && !linkedinContext ? "No profile data provided. Generate a strong sample resume based on the job requirements, using realistic but clearly placeholder data. Use the name 'Your Name' to indicate it should be customized." : ""}

INSTRUCTIONS:
1. Analyze the job description for key requirements, skills, and qualifications.
2. Create a resume that directly addresses the job requirements.
3. Use strong action verbs and quantifiable achievements.
4. Keep it concise — suitable for a 1-page resume.
5. Ensure ATS compatibility with standard section headers.
6. If GitHub data is available, incorporate relevant projects and technologies. If specific repo READMEs are provided, use them as the PRIMARY source for project descriptions, highlights, and tech stacks — extract real details from the README content.
7. Match the candidate's skills to job requirements as closely as possible.
8. If LinkedIn experience text is provided, use it as the PRIMARY source of truth for work history — extract real company names, roles, durations, and achievements from it.
9. For each project, include 2-3 key highlights showing impact, what was built, and metrics if possible.
10. If education text is provided, use it as the PRIMARY source for the education section — extract real degrees, institutions, and years from it.

Respond with a JSON object matching this exact schema:
{
  "resume": {
    "name": "string (candidate full name)",
    "title": "string (professional title matching the job)",
    "summary": "string (2-3 sentence professional summary)",
    "skills": ["string array of relevant skills, max 12"],
    "experience": [
      {
        "company": "string",
        "role": "string",
        "duration": "string (e.g. 'Jan 2022 - Present')",
        "highlights": ["string array of 2-3 achievement bullets with metrics"]
      }
    ],
    "projects": [
      {
        "name": "string",
        "description": "string (1 sentence overview)",
        "highlights": ["string array of 2-3 key points: what was built, impact, scale"],
        "tech": ["string array of technologies used"]
      }
    ],
    "education": [
      {
        "institution": "string",
        "degree": "string",
        "year": "string"
      }
    ]
  },
  "score": {
    "overall": number (0-100, how well the resume matches the job),
    "skillsMatch": number (0-100),
    "experienceMatch": number (0-100),
    "keywordMatch": number (0-100)
  }
}

Return ONLY valid JSON, no markdown fences or extra text.`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a professional resume writer. Always respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 3000,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content);
  return {
    resume: parsed.resume,
    score: parsed.score,
  };
}
