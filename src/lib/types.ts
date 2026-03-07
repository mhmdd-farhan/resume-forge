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

export interface ContactInfo {
  phone?: string;
  address?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

// Helper: converts empty string / null / undefined to undefined before URL validation
const optionalUrl = (message: string) =>
  z.preprocess(
    (val) => (val === "" || val == null ? undefined : val),
    z.string().url(message).optional(),
  );

// Helper: converts empty string / null / undefined to undefined for plain strings
const optionalString = z.preprocess(
  (val) => (val === "" || val == null ? undefined : val),
  z.string().optional(),
);

export const GenerateInputSchema = z.object({
  jobDescription: z
    .string()
    .min(50, "Job description must be at least 50 characters"),
  phone: optionalString,
  address: optionalString,
  githubUrl: optionalUrl("Enter a valid GitHub URL"),
  githubRepoUrls: optionalString,
  linkedinUrl: optionalUrl("Enter a valid LinkedIn URL"),
  linkedinText: optionalString,
  educationText: optionalString,
  portfolioUrl: optionalUrl("Enter a valid portfolio URL"),
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
  contactInfo: ContactInfo;
}
