"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  Globe,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  FileText,
  FolderGit2,
  Phone,
  MapPin,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackClick } from "@/lib/track";

interface ProfileInputProps {
  githubUrl: string;
  githubRepoUrls: string[];
  linkedinUrl: string;
  linkedinText: string;
  portfolioUrl: string;
  phone: string;
  address: string;
  educationText: string;
  onGithubChange: (value: string) => void;
  onGithubRepoUrlsChange: (value: string[]) => void;
  onLinkedinChange: (value: string) => void;
  onLinkedinTextChange: (value: string) => void;
  onPortfolioChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onEducationTextChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

function InputField({
  icon: Icon,
  label,
  placeholder,
  value,
  onChange,
  optional,
  delay,
  type = "url",
}: {
  icon: React.ElementType;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  delay: number;
  type?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="group"
    >
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Icon className="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        {label}
        {optional && (
          <span className="text-xs text-muted-foreground font-normal">
            (optional)
          </span>
        )}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
        />
      </div>
    </motion.div>
  );
}

export function ProfileInput({
  githubUrl,
  githubRepoUrls,
  linkedinUrl,
  linkedinText,
  portfolioUrl,
  phone,
  address,
  educationText,
  onGithubChange,
  onGithubRepoUrlsChange,
  onLinkedinChange,
  onLinkedinTextChange,
  onPortfolioChange,
  onPhoneChange,
  onAddressChange,
  onEducationTextChange,
  onNext,
  onBack,
}: ProfileInputProps) {
  const [showGithubRepos, setShowGithubRepos] = useState(
    githubRepoUrls.some((u) => u.trim())
  );
  const [showLinkedinPaste, setShowLinkedinPaste] = useState(!!linkedinText);
  const [showEducation, setShowEducation] = useState(!!educationText);

  const updateRepoUrl = (index: number, value: string) => {
    const updated = [...githubRepoUrls];
    updated[index] = value;
    onGithubRepoUrlsChange(updated);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 text-muted-foreground mb-1">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <Globe className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium tracking-wide uppercase">
              Step 2
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Add your profile sources
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll use your experience and projects to build your resume.
          </p>
        </div>

        <div className="space-y-4">
          {/* GitHub profile */}
          <InputField
            icon={Github}
            label="GitHub Profile"
            placeholder="https://github.com/username"
            value={githubUrl}
            onChange={onGithubChange}
            delay={0.1}
          />

          {/* GitHub repos toggle */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <button
              type="button"
              onClick={() => setShowGithubRepos(!showGithubRepos)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Add specific project repositories
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  showGithubRepos ? "rotate-180" : ""
                }`}
              />
            </button>

            {showGithubRepos && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-2"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  Add links to public repos you want highlighted. We&apos;ll
                  read the README and extract project details automatically.
                </p>
                {githubRepoUrls.map((url, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60 w-4 text-right shrink-0">
                        {i + 1}.
                      </span>
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => updateRepoUrl(i, e.target.value)}
                        placeholder={`https://github.com/username/project-${i + 1}`}
                        className="flex-1 h-10 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                      />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.div>

          {/* LinkedIn profile */}
          <InputField
            icon={Linkedin}
            label="LinkedIn Profile"
            placeholder="https://linkedin.com/in/username"
            value={linkedinUrl}
            onChange={onLinkedinChange}
            optional
            delay={0.2}
          />

          {/* LinkedIn paste toggle */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            <button
              type="button"
              onClick={() => setShowLinkedinPaste(!showLinkedinPaste)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Paste your LinkedIn experience directly
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  showLinkedinPaste ? "rotate-180" : ""
                }`}
              />
            </button>

            {showLinkedinPaste && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  Copy your experience from LinkedIn and paste it here. Include
                  job titles, companies, dates, and descriptions for best
                  results.
                </p>
                <textarea
                  value={linkedinText}
                  onChange={(e) => onLinkedinTextChange(e.target.value)}
                  placeholder={`Example:\nSenior Software Engineer at Google\nJan 2022 - Present\n- Led migration of core services to microservices architecture\n- Reduced API latency by 40% through caching optimization\n\nSoftware Engineer at Meta\nJun 2019 - Dec 2021\n- Built real-time notification system serving 2B+ users...`}
                  className="w-full h-40 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Education toggle */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <button
              type="button"
              onClick={() => setShowEducation(!showEducation)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Add your education
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  showEducation ? "rotate-180" : ""
                }`}
              />
            </button>

            {showEducation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <p className="text-xs text-muted-foreground mb-2">
                  List your degrees, institutions, and graduation years. This
                  will be used as the PRIMARY source for the Education section.
                </p>
                <textarea
                  value={educationText}
                  onChange={(e) => onEducationTextChange(e.target.value)}
                  placeholder={`Example:\nB.S. Computer Science, Stanford University, 2020\nM.S. Machine Learning, MIT, 2022`}
                  className="w-full h-28 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
                />
              </motion.div>
            )}
          </motion.div>

          {/* Portfolio */}
          <InputField
            icon={Globe}
            label="Portfolio"
            placeholder="https://yoursite.com"
            value={portfolioUrl}
            onChange={onPortfolioChange}
            optional
            delay={0.35}
          />

          {/* Phone */}
          <InputField
            icon={Phone}
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            value={phone}
            onChange={onPhoneChange}
            optional
            delay={0.4}
            type="tel"
          />

          {/* Address */}
          <InputField
            icon={MapPin}
            label="Address"
            placeholder="San Francisco, CA"
            value={address}
            onChange={onAddressChange}
            optional
            delay={0.45}
            type="text"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="gap-2 rounded-xl h-10 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Button>
          <Button
            onClick={() => { trackClick("generate_resume"); onNext(); }}
            className="gap-2 px-6 rounded-xl h-10 font-medium transition-all duration-200"
          >
            Generate Resume
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
