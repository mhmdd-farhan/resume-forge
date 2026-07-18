"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Anvil } from "lucide-react";
import { JobInput } from "@/components/JobInput";
import { ProfileInput } from "@/components/ProfileInput";
import { ProgressPipeline } from "@/components/ProgressPipeline";
import { ResumePreview } from "@/components/ResumePreview";
import { generateResume } from "@/app/actions/generateResume";
import { generateResumePDF } from "@/lib/pdf";
import type { Resume, ResumeScore, ContactInfo } from "@/lib/types";
import { useRouter } from "next/navigation";

type Step = "job" | "profile" | "generating" | "result";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("job");

  // Form state
  const [jobDescription, setJobDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubRepoUrls, setGithubRepoUrls] = useState<string[]>(["", "", ""]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [educationText, setEducationText] = useState("");

  // Result state
  const [resume, setResume] = useState<Resume | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    router.push("/dashboard")
  }, [])

  const handleGenerate = useCallback(async () => {
    setStep("generating");
    setError(null);

    const formData = new FormData();
    formData.set("jobDescription", jobDescription);
    formData.set("githubUrl", githubUrl);
    formData.set("githubRepoUrls", githubRepoUrls.filter((u) => u.trim()).join(","));
    formData.set("linkedinUrl", linkedinUrl);
    formData.set("linkedinText", linkedinText);
    formData.set("portfolioUrl", portfolioUrl);
    formData.set("phone", phone);
    formData.set("address", address);
    formData.set("educationText", educationText);

    try {
      const result = await generateResume(formData);
      if (result.success) {
        setResume(result.data.resume);
        setScore(result.data.score);
        setContactInfo(result.data.contactInfo);
      } else {
        setError(result.error);
        setStep("profile");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("profile");
    }
  }, [jobDescription, githubUrl, githubRepoUrls, linkedinUrl, linkedinText, portfolioUrl, phone, address, educationText]);

  const handlePipelineCompleteWrapper = useCallback(() => {
    if (resume && score) {
      setTimeout(() => setStep("result"), 500);
    }
  }, [resume, score]);

  const handleDownload = useCallback(async () => {
    if (!resume) return;
    setIsDownloading(true);
    try {
      const pdfBytes = await generateResumePDF(resume, contactInfo ?? undefined);
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [resume, contactInfo]);

  const handleRegenerate = useCallback(() => {
    setResume(null);
    setScore(null);
    setContactInfo(null);
    handleGenerate();
  }, [handleGenerate]);

  const stepIndicators = [
    { id: "job", label: "Job" },
    { id: "profile", label: "Profile" },
    { id: "generating", label: "Generate" },
    { id: "result", label: "Result" },
  ] as const;

  const currentStepIndex = stepIndicators.findIndex((s) => s.id === step);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/50 backdrop-blur-sm bg-background/60 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Anvil className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              ResumeForge
            </span>
          </div>

          {/* Step Indicators */}
          <div className="hidden sm:flex items-center gap-1">
            {stepIndicators.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`
                    flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-300
                    ${i === currentStepIndex
                      ? "bg-primary/10 text-primary"
                      : i < currentStepIndex
                        ? "text-muted-foreground"
                        : "text-muted-foreground/40"
                    }
                  `}
                >
                  <span
                    className={`
                      w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold
                      ${i === currentStepIndex
                        ? "bg-primary text-primary-foreground"
                        : i < currentStepIndex
                          ? "bg-muted-foreground/20 text-muted-foreground"
                          : "bg-muted text-muted-foreground/40"
                      }
                    `}
                  >
                    {i + 1}
                  </span>
                  {s.label}
                </div>
                {i < stepIndicators.length - 1 && (
                  <div
                    className={`w-4 h-px mx-0.5 transition-colors duration-300 ${i < currentStepIndex
                      ? "bg-muted-foreground/30"
                      : "bg-muted"
                      }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence>
          {error && (
            <motion.div
              key="error-banner"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-sm max-w-md"
            >
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 text-destructive/60 hover:text-destructive"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === "job" && (
            <JobInput
              key="job"
              value={jobDescription}
              onChange={setJobDescription}
              onNext={() => setStep("profile")}
            />
          )}

          {step === "profile" && (
            <ProfileInput
              key="profile"
              githubUrl={githubUrl}
              githubRepoUrls={githubRepoUrls}
              linkedinUrl={linkedinUrl}
              linkedinText={linkedinText}
              portfolioUrl={portfolioUrl}
              phone={phone}
              address={address}
              educationText={educationText}
              onGithubChange={setGithubUrl}
              onGithubRepoUrlsChange={setGithubRepoUrls}
              onLinkedinChange={setLinkedinUrl}
              onLinkedinTextChange={setLinkedinText}
              onPortfolioChange={setPortfolioUrl}
              onPhoneChange={setPhone}
              onAddressChange={setAddress}
              onEducationTextChange={setEducationText}
              onNext={handleGenerate}
              onBack={() => setStep("job")}
            />
          )}

          {step === "generating" && (
            <ProgressPipeline
              key="generating"
              isActive={step === "generating"}
              onComplete={handlePipelineCompleteWrapper}
            />
          )}

          {step === "result" && resume && score && (
            <ResumePreview
              key="result"
              resume={resume}
              score={score}
              contactInfo={contactInfo ?? undefined}
              onDownload={handleDownload}
              onRegenerate={handleRegenerate}
              onResumeChange={setResume}
              isDownloading={isDownloading}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-border/30 py-4">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-center">
          <p className="text-xs text-muted-foreground/60">
            Built with AI. Your data is not stored.
          </p>
        </div>
      </footer>
    </main>
  );
}
