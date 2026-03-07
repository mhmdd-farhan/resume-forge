"use client";

import { motion } from "framer-motion";
import { FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobInputProps {
  value: string;
  onChange: (value: string) => void;
  onNext: () => void;
}

export function JobInput({ value, onChange, onNext }: JobInputProps) {
  const isValid = value.trim().length >= 50;

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
              <FileText className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium tracking-wide uppercase">
              Step 1
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Paste the job description
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll analyze requirements and tailor your resume to match.
          </p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm" />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste the full job description here — including role title, requirements, responsibilities, and preferred qualifications..."
            className="relative w-full h-56 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {value.length > 0 && (
              <span
                className={
                  isValid ? "text-emerald-600" : "text-muted-foreground"
                }
              >
                {value.length} characters
                {!isValid && " (minimum 50)"}
              </span>
            )}
          </span>
          <Button
            onClick={onNext}
            disabled={!isValid}
            className="gap-2 px-6 rounded-xl h-10 font-medium transition-all duration-200"
          >
            Continue
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
