import { z } from "zod";

export const ExperienceSchema = z.object({
  company: z.string(),
  role: z.string(),
  duration: z.string(),
  highlights: z.array(z.string()),
});

export const ProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  highlights: z.array(z.string()),
  tech: z.array(z.string()),
});

export const EducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  year: z.string(),
});

export const ResumeSchema = z.object({
  name: z.string(),
  title: z.string(),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(ExperienceSchema),
  projects: z.array(ProjectSchema),
  education: z.array(EducationSchema),
});

export type Resume = z.infer<typeof ResumeSchema>;
export type Experience = z.infer<typeof ExperienceSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type Education = z.infer<typeof EducationSchema>;

export const ResumeScoreSchema = z.object({
  overall: z.number(),
  skillsMatch: z.number(),
  experienceMatch: z.number(),
  keywordMatch: z.number(),
});

export type ResumeScore = z.infer<typeof ResumeScoreSchema>;

export const GenerateInputSchema = z.object({
  jobDescription: z.string().min(50, "Job description must be at least 50 characters"),
  githubUrl: z.string().url("Enter a valid GitHub URL").optional().or(z.literal("")),
  githubRepoUrls: z.string().optional().or(z.literal("")),
  linkedinUrl: z.string().url("Enter a valid LinkedIn URL").optional().or(z.literal("")),
  linkedinText: z.string().optional().or(z.literal("")),
  portfolioUrl: z.string().url("Enter a valid portfolio URL").optional().or(z.literal("")),
});

export type GenerateInput = z.infer<typeof GenerateInputSchema>;

export type PipelineStep =
  | "analyzing"
  | "extracting"
  | "matching"
  | "writing"
  | "formatting";

export interface GenerateResult {
  resume: Resume;
  score: ResumeScore;
}
