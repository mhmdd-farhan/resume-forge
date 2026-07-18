"use client";

import { motion } from "framer-motion";
import { trackClick } from "@/lib/track";
import {
  Download,
  RefreshCw,
  Target,
  Briefcase,
  Zap,
  FileText,
  Github,
  Linkedin,
  Phone,
  MapPin,
  Pencil,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Resume, ResumeScore, ContactInfo, Experience, Project, Education } from "@/lib/types";
import { useState, useRef, useEffect } from "react";

interface ResumePreviewProps {
  resume: Resume;
  score: ResumeScore;
  contactInfo?: ContactInfo;
  onDownload: () => void;
  onRegenerate: () => void;
  onResumeChange?: (resume: Resume) => void;
  isDownloading: boolean;
}


function DeleteButton({ onClick, title }: { onClick: () => void; title?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={title ?? "Delete"}
      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
    >
      <X className="w-2.5 h-2.5" />
    </button>
  );
}

function EditableText({
  value,
  onChange,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      if (textareaRef.current) {
        textareaRef.current.focus();
        const len = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(len, len);
      }
    }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    onChange(trimmed || value);
    setEditing(false);
  };

  if (editing) {
    const baseClass =
      "bg-transparent outline outline-1 outline-primary/60 rounded px-0.5 w-full font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit]";

    if (multiline) {
      return (
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
          }}
          className={`${baseClass} resize-none`}
          rows={Math.max(2, draft.split("\n").length + 1)}
        />
      );
    }

    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className={baseClass}
      />
    );
  }

  return (
    <span
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="cursor-text hover:bg-primary/5 hover:outline hover:outline-1 hover:outline-primary/25 hover:rounded px-0.5 -mx-0.5 transition-colors"
      title="Click to edit"
    >
      {value}
    </span>
  );
}

function ScoreRing({
  value,
  label,
  icon: Icon,
  delay,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  delay: number;
}) {
  const circumference = 2 * Math.PI * 28;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/40"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            className="text-primary"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold">{value}%</div>
        <div className="text-[10px] text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
}

export function ResumePreview({
  resume,
  score,
  contactInfo,
  onDownload,
  onRegenerate,
  onResumeChange,
  isDownloading,
}: ResumePreviewProps) {
  const [localResume, setLocalResume] = useState<Resume>(resume);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setLocalResume(resume);
  }, [resume]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onResumeChange?.(localResume);
  }, [localResume]);

  function updateField<K extends keyof Resume>(field: K, value: Resume[K]) {
    setLocalResume((prev) => ({ ...prev, [field]: value }));
  }

  function updateSkill(i: number, value: string) {
    const skills = localResume.skills.map((s, idx) => (idx === i ? value : s));
    updateField("skills", skills);
  }

  function updateExpField(idx: number, field: keyof Experience, value: string) {
    const experience = localResume.experience.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e
    );
    updateField("experience", experience);
  }

  function updateExpHighlight(expIdx: number, hlIdx: number, value: string) {
    const experience = localResume.experience.map((e, i) => {
      if (i !== expIdx) return e;
      const highlights = e.highlights.map((h, j) => (j === hlIdx ? value : h));
      return { ...e, highlights };
    });
    updateField("experience", experience);
  }

  function updateProjField(idx: number, field: keyof Project, value: string | string[]) {
    const projects = localResume.projects.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    );
    updateField("projects", projects);
  }

  function updateProjHighlight(projIdx: number, hlIdx: number, value: string) {
    const projects = localResume.projects.map((p, i) => {
      if (i !== projIdx) return p;
      const highlights = (p.highlights ?? []).map((h, j) => (j === hlIdx ? value : h));
      return { ...p, highlights };
    });
    updateField("projects", projects);
  }

  function updateProjTech(projIdx: number, techIdx: number, value: string) {
    const projects = localResume.projects.map((p, i) => {
      if (i !== projIdx) return p;
      const tech = p.tech.map((t, j) => (j === techIdx ? value : t));
      return { ...p, tech };
    });
    updateField("projects", projects);
  }

  function updateEduField(idx: number, field: keyof Education, value: string) {
    const education = localResume.education.map((e, i) =>
      i === idx ? { ...e, [field]: value } : e
    );
    updateField("education", education);
  }

  function deleteSkill(i: number) {
    updateField("skills", localResume.skills.filter((_, idx) => idx !== i));
  }

  function deleteExpHighlight(expIdx: number, hlIdx: number) {
    const experience = localResume.experience.map((e, i) => {
      if (i !== expIdx) return e;
      return { ...e, highlights: e.highlights.filter((_, j) => j !== hlIdx) };
    });
    updateField("experience", experience);
  }

  function deleteExp(idx: number) {
    updateField("experience", localResume.experience.filter((_, i) => i !== idx));
  }

  function deleteProjHighlight(projIdx: number, hlIdx: number) {
    const projects = localResume.projects.map((p, i) => {
      if (i !== projIdx) return p;
      return { ...p, highlights: (p.highlights ?? []).filter((_, j) => j !== hlIdx) };
    });
    updateField("projects", projects);
  }

  function deleteProjTech(projIdx: number, techIdx: number) {
    const projects = localResume.projects.map((p, i) => {
      if (i !== projIdx) return p;
      return { ...p, tech: p.tech.filter((_, j) => j !== techIdx) };
    });
    updateField("projects", projects);
  }

  function deleteProj(idx: number) {
    updateField("projects", localResume.projects.filter((_, i) => i !== idx));
  }

  function deleteEdu(idx: number) {
    updateField("education", localResume.education.filter((_, i) => i !== idx));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1 space-y-6"
        >
          {/* Overall Score */}
          <div className="glass rounded-2xl p-4 sm:p-6 space-y-4">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Match Score
            </div>
            <div className="flex items-center gap-3">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 12,
                  delay: 0.3,
                }}
                className="text-5xl font-bold text-primary"
              >
                {score.overall}
              </motion.span>
              <span className="text-2xl text-muted-foreground font-light">
                %
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2">
              <ScoreRing
                value={score.skillsMatch}
                label="Skills"
                icon={Zap}
                delay={0.4}
              />
              <ScoreRing
                value={score.experienceMatch}
                label="Experience"
                icon={Briefcase}
                delay={0.5}
              />
              <ScoreRing
                value={score.keywordMatch}
                label="Keywords"
                icon={Target}
                delay={0.6}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => { trackClick("download_pdf"); onDownload(); }}
              disabled={isDownloading}
              className="w-full gap-2 rounded-xl h-11 font-medium"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Generating PDF..." : "Download PDF"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { trackClick("regenerate_resume"); onRegenerate(); }}
              className="w-full gap-2 rounded-xl h-11 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </Button>
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground">
              <Pencil className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Click any text to edit. Hover blocks to delete.</span>
            </div>
          </div>
        </motion.div>

        {/* Resume Preview */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <div className="glass rounded-2xl p-4 sm:p-8 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold tracking-tight">
                  <EditableText
                    value={localResume.name}
                    onChange={(v) => updateField("name", v)}
                  />
                </h1>
                <p className="text-sm text-primary font-medium mt-0.5">
                  <EditableText
                    value={localResume.title}
                    onChange={(v) => updateField("title", v)}
                  />
                </p>
                {contactInfo && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    {contactInfo.githubUrl && (
                      <a
                        href={contactInfo.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Github className="w-3 h-3" />
                        {contactInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    )}
                    {contactInfo.linkedinUrl && (
                      <a
                        href={contactInfo.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Linkedin className="w-3 h-3" />
                        {contactInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                      </a>
                    )}
                    {contactInfo.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {contactInfo.phone}
                      </span>
                    )}
                    {contactInfo.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {contactInfo.address}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 ml-4">
                <FileText className="w-4 h-4" />
                <span className="text-xs">1 page</span>
              </div>
            </div>

            {/* Summary */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
                Summary
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                <EditableText
                  value={localResume.summary}
                  onChange={(v) => updateField("summary", v)}
                  multiline
                />
              </p>
            </div>

            {/* Skills */}
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {localResume.skills.map((skill, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + i * 0.03 }}
                    className="group"
                  >
                    <Badge
                      variant="secondary"
                      className="text-xs font-normal rounded-md px-2.5 py-0.5 flex items-center gap-1"
                    >
                      <EditableText
                        value={skill}
                        onChange={(v) => updateSkill(i, v)}
                      />
                      <DeleteButton onClick={() => deleteSkill(i)} title="Remove skill" />
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Experience */}
            {localResume.experience.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Experience
                </h3>
                <div className="space-y-4">
                  {localResume.experience.map((exp, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="space-y-1 group relative pr-5"
                    >
                      <button
                        onClick={() => deleteExp(i)}
                        title="Delete experience"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold">
                          <EditableText
                            value={exp.role}
                            onChange={(v) => updateExpField(i, "role", v)}
                          />
                        </h4>
                        <span className="text-xs text-muted-foreground shrink-0">
                          <EditableText
                            value={exp.duration}
                            onChange={(v) => updateExpField(i, "duration", v)}
                          />
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <EditableText
                          value={exp.company}
                          onChange={(v) => updateExpField(i, "company", v)}
                        />
                      </p>
                      <ul className="space-y-0.5 mt-1">
                        {exp.highlights.map((h, j) => (
                          <li
                            key={j}
                            className="group/hl text-xs text-foreground/75 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground flex items-start gap-1"
                          >
                            <EditableText
                              value={h}
                              onChange={(v) => updateExpHighlight(i, j, v)}
                              multiline
                            />
                            <DeleteButton onClick={() => deleteExpHighlight(i, j)} title="Remove bullet" />
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {localResume.projects.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                  Projects
                </h3>
                <div className="space-y-3">
                  {localResume.projects.map((proj, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 + i * 0.08 }}
                      className="space-y-1 group relative pr-5"
                    >
                      <button
                        onClick={() => deleteProj(i)}
                        title="Delete project"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <h4 className="text-sm font-semibold">
                        <EditableText
                          value={proj.name}
                          onChange={(v) => updateProjField(i, "name", v)}
                        />
                      </h4>
                      <p className="text-xs text-foreground/75">
                        <EditableText
                          value={proj.description}
                          onChange={(v) => updateProjField(i, "description", v)}
                          multiline
                        />
                      </p>
                      {proj.highlights && proj.highlights.length > 0 && (
                        <ul className="space-y-0.5 mt-1">
                          {proj.highlights.map((h, j) => (
                            <li
                              key={j}
                              className="group/hl text-xs text-foreground/75 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground flex items-start gap-1"
                            >
                              <EditableText
                                value={h}
                                onChange={(v) => updateProjHighlight(i, j, v)}
                                multiline
                              />
                              <DeleteButton onClick={() => deleteProjHighlight(i, j)} title="Remove bullet" />
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {proj.tech.map((t, j) => (
                          <span
                            key={j}
                            className="group/tech text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-0.5"
                          >
                            <EditableText
                              value={t}
                              onChange={(v) => updateProjTech(i, j, v)}
                            />
                            <DeleteButton onClick={() => deleteProjTech(i, j)} title="Remove tech" />
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {localResume.education.length > 0 && (
              <div>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  Education
                </h3>
                <div className="space-y-2">
                  {localResume.education.map((edu, i) => (
                    <div key={i} className="group relative flex items-baseline justify-between gap-2 pr-5">
                      <button
                        onClick={() => deleteEdu(i)}
                        title="Delete education"
                        className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                      <div>
                        <span className="text-sm font-medium">
                          <EditableText
                            value={edu.degree}
                            onChange={(v) => updateEduField(i, "degree", v)}
                          />
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          <EditableText
                            value={edu.institution}
                            onChange={(v) => updateEduField(i, "institution", v)}
                          />
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        <EditableText
                          value={edu.year}
                          onChange={(v) => updateEduField(i, "year", v)}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
