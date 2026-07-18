"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import {
  Anvil,
  LayoutDashboard,
  Sparkles,
  Crown,
  FileText,
  TrendingUp,
  Zap,
  ChevronRight,
  LogOut,
  Star,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { trackClick } from "@/lib/track";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { JobInput } from "@/components/JobInput";
import { ProfileInput } from "@/components/ProfileInput";
import { ProgressPipeline } from "@/components/ProgressPipeline";
import { ResumePreview } from "@/components/ResumePreview";
import { generateResume } from "@/app/actions/generateResume";
import { generateResumePDF } from "@/lib/pdf";
import type { Resume, ResumeScore, ContactInfo } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = "generate" | "dashboard";
type Step = "job" | "profile" | "generating" | "result";

interface DashboardData {
  name: string;
  email: string;
  image: string;
  plan: string;
  resumesGenerated: number;
  dailyUsed: number;
  remaining: number | null;
  limitPeriod: "total" | "daily" | null;
  isPremium: boolean;
  isStarter: boolean;
  hasSubscription: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const FREE_LIMIT = 3;
const STARTER_DAILY_LIMIT = 4;

// ─── Cancel Confirmation Modal ────────────────────────────────────────────────
function CancelModal({
  open,
  onClose,
  onConfirm,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={loading}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Cancel Subscription?</h3>
            <p className="text-xs text-muted-foreground mt-0.5">This action cannot be undone</p>
          </div>
        </div>

        {/* Warning list */}
        <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
          {[
            "Your plan will revert to Free immediately",
            "You'll be limited to 3 total resume generations",
            "Access to unlimited generation will be revoked",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 text-sm text-destructive/80">
              <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Your subscription will be cancelled immediately. If you change your mind, you can resubscribe at any time.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onClose}
            disabled={loading}
          >
            Keep Subscription
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cancelling…
              </span>
            ) : (
              "Yes, Cancel"
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    free: {
      label: "Free",
      className: "bg-secondary/70 text-secondary-foreground border-border/40",
      icon: null,
    },
    starter: {
      label: "Starter",
      className: "bg-teal-500/10 text-teal-600 border-teal-500/30",
      icon: <Zap className="w-3 h-3" />,
    },
    premium: {
      label: "Premium",
      className: "bg-primary/10 text-primary border-primary/30",
      icon: <Crown className="w-3 h-3" />,
    },
    annual: {
      label: "Annual",
      className: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      icon: <Star className="w-3 h-3 fill-amber-500" />,
    },
  };
  const c = config[plan] ?? config.free;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border uppercase ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

function UsageMeter({
  used,
  limit,
  period = "total",
}: {
  used: number;
  limit: number | null;
  period?: "total" | "daily";
}) {
  if (limit === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
        <CheckCircle2 className="w-4 h-4" />
        Unlimited generations
      </div>
    );
  }
  const pct = Math.min((used / limit) * 100, 100);
  const isWarning = pct >= 66;
  const isDanger = pct >= 100;
  const barColor = period === "daily"
    ? isDanger ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-teal-500"
    : isDanger ? "bg-destructive" : isWarning ? "bg-amber-500" : "bg-primary";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          {period === "daily" ? "Today's CV Generations" : "CV Generations used"}
        </span>
        <span
          className={`font-bold tabular-nums ${
            isDanger ? "text-destructive" : isWarning ? "text-amber-600" : "text-foreground"
          }`}
        >
          {used} / {limit}
        </span>
      </div>
      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      {isDanger && period === "daily" && (
        <p className="text-xs text-destructive font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Daily limit reached. Resets at midnight UTC.
        </p>
      )}
      {isDanger && period === "total" && (
        <p className="text-xs text-destructive font-medium flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Limit reached. Upgrade to keep generating.
        </p>
      )}
      {!isDanger && period === "daily" && (
        <p className="text-xs text-muted-foreground">
          {limit - used} generation{limit - used !== 1 ? "s" : ""} remaining today · resets midnight UTC
        </p>
      )}
      {!isDanger && period === "total" && (
        <p className="text-xs text-muted-foreground">
          {limit - used} generation{limit - used !== 1 ? "s" : ""} remaining on free plan
        </p>
      )}
    </div>
  );
}

function DashboardTab({
  data,
  loading,
  onUpgrade,
  onCancelRequest,
}: {
  data: DashboardData | null;
  loading: boolean;
  onUpgrade: (plan: "starter" | "premium" | "annual") => void;
  onCancelRequest: () => void;
}) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </div>
    );
  }

  const isPremium = data.isPremium;
  const isStarter = data.isStarter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Welcome Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {data.image && (
          <img
            src={data.image}
            alt={data.name}
            className="w-14 h-14 rounded-2xl border-2 border-border shadow-sm object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h2 className="text-xl font-bold text-foreground truncate">
              Welcome back, {data.name?.split(" ")[0] ?? "there"} 👋
            </h2>
            <PlanBadge plan={data.plan} />
          </div>
          <p className="text-sm text-muted-foreground truncate">{data.email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* CVs Generated */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                CVs Generated
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-4xl font-extrabold text-foreground tabular-nums">
              {data.resumesGenerated}
            </div>
            <p className="text-xs text-muted-foreground">Total resumes generated</p>
          </CardContent>
        </Card>

        {/* Plan */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Plan
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-foreground capitalize">{data.plan}</div>
            <PlanBadge plan={data.plan} />
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Subscription
              </span>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div
              className={`text-2xl font-extrabold ${
                data.hasSubscription ? "text-emerald-600" : "text-foreground"
              }`}
            >
              {data.hasSubscription ? "Active" : "–"}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.hasSubscription ? "Subscription is active" : "No active subscription"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage Meter */}
      <Card className="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Generation Usage
          </CardTitle>
          <CardDescription className="text-xs">
            {isStarter ? "Daily AI CV generations (resets midnight UTC)" : "Track how many AI CV generations you've used"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <UsageMeter
            used={isStarter ? data.dailyUsed : data.resumesGenerated}
            limit={isPremium ? null : isStarter ? STARTER_DAILY_LIMIT : FREE_LIMIT}
            period={isStarter ? "daily" : "total"}
          />
        </CardContent>
      </Card>

      {/* ─── Starter Active + Manage Subscription ───────────────────────── */}
      {isStarter && (
        <Card className="border border-teal-500/30 bg-teal-500/5 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Starter Plan Active</p>
                  <p className="text-xs text-muted-foreground">
                    {STARTER_DAILY_LIMIT} CV generations per day — resets at midnight UTC
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => onUpgrade("premium")}
                  size="sm"
                  className="rounded-xl text-xs gap-1.5"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade to Premium
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelRequest}
                  className="rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Premium Active + Manage Subscription ───────────────────────── */}
      {isPremium && (
        <Card className="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {data.plan === "annual" ? "Annual" : "Premium"} Plan Active
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unlimited resume generations — enjoy!
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelRequest}
                  className="rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive hover:border-destructive/50 transition-all"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1.5" />
                  Cancel Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Upgrade CTA — free users only ──────────────────────────────── */}
      {!isPremium && !isStarter && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-foreground">Unlock more generations</h3>
                <p className="text-sm text-muted-foreground">
                  You're on the free plan ({data.resumesGenerated}/{FREE_LIMIT} used). Upgrade for
                  more daily CV generations or go unlimited with Premium.
                </p>
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                <Button
                  onClick={() => onUpgrade("starter")}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 rounded-xl border-teal-500/50 text-teal-600 hover:bg-teal-500/5 transition-all text-xs"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Starter — $1/mo · 4/day
                </Button>
                <Button
                  onClick={() => onUpgrade("premium")}
                  className="w-full sm:w-auto gap-2 rounded-xl shadow-md shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Premium — $5/mo · Unlimited
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onUpgrade("annual")}
                  className="w-full sm:w-auto gap-2 rounded-xl hover:bg-secondary/40 transition-all text-xs"
                >
                  Annual — $25/yr
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                    SAVE 60%
                  </span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Generate Resume</p>
                <p className="text-xs text-muted-foreground">Create a new AI-tailored CV</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>

          <Link
            href="/#pricing"
            className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">View Plans</p>
                <p className="text-xs text-muted-foreground">Explore upgrade options</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Generator Tab (embedded) ─────────────────────────────────────────────────
function GeneratorTab() {
  const [step, setStep] = useState<Step>("job");
  const [jobDescription, setJobDescription] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [githubRepoUrls, setGithubRepoUrls] = useState<string[]>(["", "", ""]);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [educationText, setEducationText] = useState("");
  const [resume, setResume] = useState<Resume | null>(null);
  const [score, setScore] = useState<ResumeScore | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
  }, [
    jobDescription, githubUrl, githubRepoUrls, linkedinUrl,
    linkedinText, portfolioUrl, phone, address, educationText,
  ]);

  const handlePipelineComplete = useCallback(() => {
    if (resume && score) setTimeout(() => setStep("result"), 500);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <AnimatePresence>
        {error && (
          <motion.div
            key="error-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-sm flex items-center justify-between"
          >
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 text-destructive/60 hover:text-destructive">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center py-8 min-h-[60vh]">
        <AnimatePresence mode="wait">
          {step === "job" && (
            <JobInput key="job" value={jobDescription} onChange={setJobDescription} onNext={() => setStep("profile")} />
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
            <ProgressPipeline key="generating" isActive={step === "generating"} onComplete={handlePipelineComplete} />
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
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("generate");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  // Cancel modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Redirect unauthenticated users to Google login
  useEffect(() => {
    if (status === "unauthenticated") signIn("google", { callbackUrl: "/dashboard" });
  }, [status]);

  // Fetch dashboard data when tab is opened
  useEffect(() => {
    if (activeTab === "dashboard" && !dashboardData && status === "authenticated") {
      setDashboardLoading(true);
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then(setDashboardData)
        .catch(console.error)
        .finally(() => setDashboardLoading(false));
    }
  }, [activeTab, dashboardData, status]);

  const handleUpgrade = async (planType: "starter" | "premium" | "annual") => {
    if (!session) return;
    setCheckoutLoading(planType);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert(data.error || "Failed to create checkout session");
    } catch {
      alert("Error starting checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelConfirm = async () => {
    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setCancelSuccess(true);
        setShowCancelModal(false);
        // Reset dashboard data so it refetches with updated plan
        setDashboardData(null);
        setTimeout(() => setCancelSuccess(false), 5000);
      } else {
        setCancelError(data.error || "Failed to cancel subscription");
      }
    } catch {
      setCancelError("Network error. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Loading state while checking auth
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "generate", label: "Generate", icon: <Sparkles className="w-4 h-4" /> },
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Cancel Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <CancelModal
            open={showCancelModal}
            onClose={() => {
              setShowCancelModal(false);
              setCancelError(null);
            }}
            onConfirm={handleCancelConfirm}
            loading={cancelLoading}
          />
        )}
      </AnimatePresence>

      <main className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
                <Anvil className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">ResumeForge</span>
            </Link>

            {/* Tab Pills */}
            <div className="flex items-center bg-secondary/50 rounded-xl p-1 gap-0.5 border border-border/30">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => { setActiveTab(tab.id); trackClick(`tab_${tab.id}`); }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-background text-foreground shadow-sm border border-border/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* User info */}
            <div className="flex items-center gap-3">
              {session?.user && (
                <>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {(session.user as any).plan || "free"}
                  </span>
                  {session.user.image && (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "User"}
                      className="w-7 h-7 rounded-full border border-border shadow-sm"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </header>

        {/* Toast messages */}
        <AnimatePresence>
          {cancelSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
            >
              <CheckCircle2 className="w-4 h-4" />
              Subscription cancelled. You're now on the Free plan.
            </motion.div>
          )}
          {cancelError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
            >
              <AlertCircle className="w-4 h-4" />
              {cancelError}
              <button onClick={() => setCancelError(null)} className="ml-2 opacity-60 hover:opacity-100">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main content */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <AnimatePresence mode="wait">
            {activeTab === "generate" && (
              <motion.div
                key="generate-tab"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
              >
                <GeneratorTab />
              </motion.div>
            )}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <DashboardTab
                  data={dashboardData}
                  loading={dashboardLoading}
                  onUpgrade={handleUpgrade}
                  onCancelRequest={() => setShowCancelModal(true)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer className="w-full border-t border-border/30 py-4">
          <div className="max-w-5xl mx-auto px-6 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/60">
              Built with AI. Your resume data is never stored.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
