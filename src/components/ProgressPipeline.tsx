"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Cpu,
  GitCompare,
  PenTool,
  FileOutput,
  Check,
  Loader2,
} from "lucide-react";
import type { PipelineStep } from "@/lib/types";

const STEPS: {
  id: PipelineStep;
  label: string;
  icon: React.ElementType;
  duration: number;
}[] = [
  { id: "analyzing", label: "Analyzing Job", icon: Search, duration: 2000 },
  { id: "extracting", label: "Extracting Skills", icon: Cpu, duration: 2500 },
  {
    id: "matching",
    label: "Matching Experience",
    icon: GitCompare,
    duration: 2000,
  },
  { id: "writing", label: "Writing Resume", icon: PenTool, duration: 3000 },
  {
    id: "formatting",
    label: "Formatting PDF",
    icon: FileOutput,
    duration: 1500,
  },
];

interface ProgressPipelineProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function ProgressPipeline({
  isActive,
  onComplete,
}: ProgressPipelineProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isActive) {
      setCurrentStepIndex(-1);
      setCompletedSteps(new Set());
      return;
    }

    let stepIndex = 0;
    setCurrentStepIndex(0);

    const advanceStep = () => {
      setCompletedSteps((prev) => {
        const next = new Set(Array.from(prev));
        next.add(stepIndex);
        return next;
      });
      stepIndex++;

      if (stepIndex < STEPS.length) {
        setCurrentStepIndex(stepIndex);
        setTimeout(advanceStep, STEPS[stepIndex].duration);
      } else {
        onComplete?.();
      }
    };

    const timer = setTimeout(advanceStep, STEPS[0].duration);
    return () => clearTimeout(timer);
  }, [isActive, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="space-y-8">
        <div className="text-center space-y-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center"
          >
            <Cpu className="w-5 h-5 text-primary" />
          </motion.div>
          <h2 className="text-xl font-semibold tracking-tight">
            Forging your resume
          </h2>
          <p className="text-sm text-muted-foreground">
            This usually takes about 15 seconds
          </p>
        </div>

        <div className="space-y-1">
          {STEPS.map((step, index) => {
            const isCompleted = completedSteps.has(index);
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className={`
                  flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-500
                  ${isCurrent ? "bg-primary/5" : ""}
                  ${isPending ? "opacity-40" : ""}
                `}
              >
                <div
                  className={`
                    flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500
                    ${isCompleted ? "bg-emerald-500/10" : ""}
                    ${isCurrent ? "bg-primary/10" : ""}
                    ${isPending ? "bg-muted" : ""}
                  `}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }}
                      >
                        <Check className="w-4 h-4 text-emerald-600" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        key="loading"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Loader2 className="w-4 h-4 text-primary" />
                      </motion.div>
                    ) : (
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </AnimatePresence>
                </div>

                <span
                  className={`
                    text-sm font-medium transition-colors duration-300
                    ${isCompleted ? "text-emerald-700 dark:text-emerald-400" : ""}
                    ${isCurrent ? "text-foreground" : ""}
                    ${isPending ? "text-muted-foreground" : ""}
                  `}
                >
                  {step.label}
                </span>

                {isCurrent && (
                  <div className="flex-1 flex justify-end">
                    <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: step.duration / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
