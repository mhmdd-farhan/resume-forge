"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Anvil,
  ArrowRight,
  Check,
  Sparkles,
  Github,
  Linkedin,
  FileText,
  Target,
  GraduationCap,
  Zap,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession, signIn, signOut } from "next-auth/react";
import { trackClick } from "@/lib/track";

// Framer motion animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const hoverCardEffect = {
  hover: { y: -6, scale: 1.01, transition: { duration: 0.2, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubscribe = async (planType: "starter" | "premium" | "annual") => {
    trackClick(`subscribe_${planType}`);
    if (!session) {
      signIn("google");
      return;
    }

    setLoadingCheckout(planType);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session");
      }
    } catch (err) {
      console.error(err);
      alert("Error starting checkout session. Please try again.");
    } finally {
      setLoadingCheckout(null);
    }
  };

  const universities = [
    "Universitas Indonesia",
    "Institut Teknologi Bandung",
    "Universitas Gadjah Mada",
    "BINUS University",
    "Universitas Airlangga",
    "Universitas Diponegoro",
    "Universitas Brawijaya",
    "Telkom University",
    "Universitas Padjadjaran",
    "Politeknik Negeri Jakarta",
    "SMKN 1 Jakarta",
    "SMKN 26 Jakarta",
    "SMKN 2 Bandung",
    "SMKN 5 Surabaya",
    "SMKN 7 Semarang",
  ];

  return (
    <div className="min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* 1. Navigation */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50 transition-all"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              <Anvil className="w-45 h-4.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              ResumeForge
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="#pricing"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              Pricing
            </Link>

            {status === "loading" ? (
              <span className="text-xs text-muted-foreground">Loading...</span>
            ) : session ? (
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  {(session.user as any).plan || "free"} plan
                </span>
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full border border-border shadow-sm"
                  />
                )}
                <Button
                  onClick={() => signOut()}
                  variant="ghost"
                  className="rounded-xl px-3 h-8.5 text-xs font-semibold hover:bg-secondary/40"
                >
                  Sign Out
                </Button>
                <Button asChild className="rounded-xl px-4 h-8.5 text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => signIn("google")}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  Sign In
                </button>
                <Button asChild className="rounded-xl px-5 h-9.5 text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all">
                  <Link href="/dashboard">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: avatar (if logged in) + burger */}
          <div className="flex sm:hidden items-center gap-2">
            {session?.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-7 h-7 rounded-full border border-border shadow-sm"
              />
            )}
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="sm:hidden overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-md"
            >
              <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                >
                  Pricing
                </Link>

                {status !== "loading" && !session && (
                  <>
                    <button
                      onClick={() => { signIn("google"); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all text-left"
                    >
                      Sign In
                    </button>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
                    >
                      Get Started
                    </Link>
                  </>
                )}

                {status !== "loading" && session && (
                  <>
                    <div className="px-3 py-2 flex items-center gap-2">
                      <span className="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {(session.user as any).plan || "free"} plan
                      </span>
                      <span className="text-sm text-muted-foreground truncate">{session.user?.name}</span>
                    </div>
                    <Link
                      href="/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all text-left"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* 2. Hero Section */}
      <section className="relative w-full py-16 md:py-24 overflow-hidden flex flex-col items-center justify-center px-6">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="max-w-4xl mx-auto text-center space-y-6 z-10"
        >

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto"
          >
            Build a resume recruiters <br className="hidden sm:inline" />
            actually want to read.
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal"
          >
            Generate ATS-friendly resumes powered by AI. Designed to help students,
            fresh graduates, and professionals create professional resumes in minutes.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Button
              asChild
              size="lg"
              className="w-full py-2 sm:w-auto gap-2 rounded-xl h-11.5 font-medium shadow-md shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Link href="/dashboard" onClick={() => trackClick("cta_generate_hero")}>
                Generate My Resume
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full py-2 sm:w-auto rounded-xl h-11.5 font-medium hover:bg-secondary/40 transition-all duration-200"
            >
              <Link href="#pricing">View Pricing</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Realistic App Preview Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-5xl mx-auto mt-16 md:mt-20 z-10"
        >
          <div className="relative rounded-2xl border border-border/60 bg-card/65 backdrop-blur-md shadow-2xl overflow-hidden aspect-[3/4] sm:aspect-[16/9.5] md:aspect-[16/9]">
            {/* Browser Header Bar */}
            <div className="h-11 border-b border-border/40 bg-muted/40 px-4 flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-destructive/30" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/30" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/30" />
              </div>
              <div className="w-64 sm:w-80 h-6 bg-background/80 rounded-md border border-border/30 text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-mono">
                resumeforge.com/generate
              </div>
              <div className="w-12" />
            </div>

            {/* Application Mockup Layout */}
            <div className="grid grid-cols-1 md:grid-cols-5 h-[calc(100%-2.75rem)] md:divide-x divide-border/40 bg-background/30 text-card-foreground">
              {/* Form Input Mockup — hidden on mobile, shown on md+ */}
              <div className="hidden md:flex md:col-span-2 p-6 space-y-4 overflow-hidden flex-col justify-start">
                <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>Profile Wizard</span>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold">Job Description</h3>
                  <div className="w-full h-24 rounded-lg border border-border/50 bg-card/80 p-3 text-[11px] leading-relaxed text-muted-foreground font-mono overflow-hidden">
                    <span className="text-primary font-bold">Role:</span> Frontend Engineer<br />
                    <span className="text-primary font-bold">Requirements:</span> React, TypeScript, Tailwind CSS, high-performance UI components, optimization.
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Full Name</span>
                    <div className="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs">Alex Morgan</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">GitHub URL</span>
                    <div className="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs text-primary font-mono truncate">github.com/alexmorgan</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] font-medium text-muted-foreground">Key Technical Project</span>
                    <div className="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs truncate">ResumeForge — AI resume builder</div>
                  </div>
                </div>
              </div>

              {/* Resume Output Mockup — full width on mobile, 3 cols on md+ */}
              <div className="col-span-1 md:col-span-3 p-4 sm:p-6 bg-card/25 backdrop-blur-sm overflow-hidden flex flex-col relative justify-start">
                {/* ATS Score Indicator */}
                <div className="absolute top-4 right-4 sm:top-6 sm:right-6 bg-background/80 border border-border/50 shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center font-bold text-xs text-primary">
                    94
                  </div>
                  <div className="text-[9px] leading-tight">
                    <div className="font-semibold text-foreground">ATS Score</div>
                    <div className="text-muted-foreground font-medium">Highly Optimized</div>
                  </div>
                </div>

                <div className="max-w-md w-full border border-border/40 rounded-xl bg-card shadow-sm p-4 sm:p-5 relative overflow-hidden text-[10px] space-y-3.5">
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10" />

                  {/* Name and title */}
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
                      Alex Morgan
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Editable" />
                    </div>
                    <div className="text-primary font-medium text-[11px]">Frontend Engineer</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-[9px] text-muted-foreground/80 mt-1">
                      <span className="flex items-center gap-0.5"><Github className="w-2.5 h-2.5" />github.com/alexmorgan</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5"><Linkedin className="w-2.5 h-2.5" />linkedin.com/in/alexmorgan</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="space-y-1">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Summary</div>
                    <p className="text-muted-foreground leading-relaxed text-[9px]">
                      Results-driven Frontend Engineer with expertise in building responsive, high-performance web applications using <strong className="text-foreground font-semibold">React</strong> and <strong className="text-foreground font-semibold">TypeScript</strong>. Proven track record of improving web performance and maximizing accessibility.
                    </p>
                  </div>

                  {/* Experience */}
                  <div className="space-y-2">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Experience</div>
                    <div className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span>Frontend Engineer @ TechForge</span>
                        <span className="text-muted-foreground font-normal">2024 - Present</span>
                      </div>
                      <ul className="list-disc list-inside text-muted-foreground text-[9px] space-y-0.5 pl-0.5">
                        <li>Developed responsive interfaces, increasing mobile conversion rates by 18%.</li>
                        <li>Implemented robust TypeScript typing structures, reducing runtime errors by 24%.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-1.5">
                    <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {["React", "TypeScript", "Next.js", "Tailwind CSS", "Lighthouse", "REST APIs"].map((s) => (
                        <span key={s} className="bg-secondary/60 text-secondary-foreground text-[8px] font-medium px-2 py-0.5 rounded-md border border-border/30">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3. Trusted by Students & Fresh Graduates */}
      <section className="w-full py-12 sm:py-20 bg-muted/20 border-y border-border/30 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Trusted by students and fresh graduates.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Helping candidates build professional resumes that stand out during recruiter screening.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1 */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full">
              <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all">
                <CardHeader className="space-y-3 flex-1 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight">12+ Universities</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground font-normal">
                    Students from leading universities have already built resumes using Resume Forge.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>

            {/* Card 2 */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full">
              <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all">
                <CardHeader className="space-y-3 flex-1 pb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Target className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">87%</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground font-normal">
                    Reached recruiter screening.
                  </CardDescription>
                </CardHeader>
                <div className="px-6 pb-6 text-xs text-muted-foreground/70 font-medium italic border-t border-border/20 pt-3 mt-auto">
                  Based on user feedback after submitting resumes generated with Resume Forge.
                </div>
              </Card>
            </motion.div>

            {/* Card 3 */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full">
              <Card className="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all">
                <CardHeader className="space-y-3 flex-1 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-2xl font-bold tracking-tight">ATS Optimized</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground font-normal">
                    Built using recruiter-friendly resume structures to maximize Applicant Tracking System compatibility.
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          </div>

          {/* Infinitely scrolling marquee */}
          <div className="relative w-full overflow-hidden py-4 mt-8 border-t border-border/10">
            {/* Gradients on left and right edges for fading fade out effect */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

            <div className="animate-marquee flex gap-12 whitespace-nowrap text-sm font-semibold text-muted-foreground/60 select-none">
              {/* Render Twice for seamless linear infinite scroll loop */}
              {[...universities, ...universities].map((uni, index) => (
                <span key={index} className="flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                  {uni}
                </span>
              ))}
            </div>

            {/* Inline CSS for marquee keyframe animation */}
            <style jsx global>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee {
                animation: marquee 35s linear infinite;
              }
              .animate-marquee:hover {
                animation-play-state: paused;
              }
            `}</style>
          </div>
        </div>
      </section>

      {/* 4. Pricing */}
      <section id="pricing" className="w-full py-20 sm:py-24 px-6 relative scroll-mt-16">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Simple pricing.
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Start free. Upgrade whenever you&apos;re ready.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
            {/* FREE Tier */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full flex">
              <Card className="border border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full">
                <CardHeader className="space-y-1.5 p-6 pb-4">
                  <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">FREE</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-foreground">$0</span>
                    <span className="text-xs text-muted-foreground font-medium">forever</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>3 resumes total</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>ATS-friendly resume</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>PDF Export</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full rounded-xl hover:scale-[1.01] transition-transform">
                    <Link href="/dashboard">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* STARTER Tier */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full flex">
              <Card className="border border-teal-500/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full">
                <CardHeader className="space-y-1.5 p-6 pb-4">
                  <div className="text-xs font-bold tracking-widest text-teal-600 uppercase">STARTER</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-foreground">$1</span>
                    <span className="text-xs text-muted-foreground font-medium">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium mb-8">
                    <li className="flex items-center gap-2 text-foreground/90 font-semibold">
                      <Check className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>4 resumes per day</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>ATS-friendly resume</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-teal-500 shrink-0" />
                      <span>PDF Export</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleSubscribe("starter")}
                    disabled={loadingCheckout !== null}
                    variant="outline"
                    className="w-full rounded-xl border-teal-500/50 text-teal-600 hover:bg-teal-500/5 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {loadingCheckout === "starter" ? "Loading..." : (session && (session.user as any).plan === "starter" ? "Active Plan" : "Get Starter")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* PREMIUM Tier */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full flex">
              <Card className="border-2 border-primary bg-card/85 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative shadow-lg shadow-primary/5 w-full">
                {/* Popular Badge */}
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  MOST POPULAR
                </div>

                <CardHeader className="space-y-1.5 p-6 pb-4">
                  <div className="text-xs font-bold tracking-widest text-primary uppercase">PREMIUM</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-foreground">$5</span>
                    <span className="text-xs text-muted-foreground font-medium">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium mb-8">
                    <li className="flex items-center gap-2 text-foreground/90 font-semibold">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Unlimited generations</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Unlimited PDF export</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Resume history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Priority support</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleSubscribe("premium")}
                    disabled={loadingCheckout !== null}
                    className="w-full rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {loadingCheckout === "premium" ? "Loading..." : (session && (session.user as any).plan === "premium" ? "Active Plan" : "Upgrade Now")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* ANNUAL Tier */}
            <motion.div variants={hoverCardEffect} whileHover="hover" className="h-full flex">
              <Card className="border border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full">
                {/* Discount Badge */}
                <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground border-l border-b border-border/40 text-[9px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-xl">
                  SAVE 60%
                </div>

                <CardHeader className="space-y-1.5 p-6 pb-3">
                  <div className="text-xs font-bold tracking-widest text-muted-foreground uppercase">ANNUAL</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-4xl font-extrabold text-foreground">$25</span>
                    <span className="text-xs text-muted-foreground font-medium">/year</span>
                  </div>
                  <div className="flex flex-col text-[10px] text-primary/80 font-semibold pt-1">
                    <span>Limited-time offer</span>
                    <span className="text-muted-foreground/60 font-medium">Ends July 30, 2026</span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
                  <ul className="space-y-3 text-xs text-muted-foreground font-medium mb-8">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Everything in Premium</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Best value</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Pay once yearly</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span>Save 60%</span>
                    </li>
                  </ul>
                  <Button
                    onClick={() => handleSubscribe("annual")}
                    disabled={loadingCheckout !== null}
                    variant="outline"
                    className="w-full rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {loadingCheckout === "annual" ? "Loading..." : (session && (session.user as any).plan === "annual" ? "Active Plan" : "Choose Annual")}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="w-full border-t border-border/30 bg-muted/10 px-6 py-12 mt-auto">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Anvil className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm tracking-tight">
                ResumeForge
              </span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
              Build professional resumes powered by AI. Helping students and professionals
              create resumes that recruiters actually want to read.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">Product</span>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#pricing" className="hover:text-primary transition-colors">Pricing</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">Templates</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">FAQ</Link>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-foreground uppercase tracking-widest">Company</span>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">Contact</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-xs text-muted-foreground/60">
            © 2026 Resume Forge. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
