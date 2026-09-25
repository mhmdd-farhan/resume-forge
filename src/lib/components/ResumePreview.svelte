<script lang="ts">
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
		X
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EditableText from '$lib/components/EditableText.svelte';
	import DeleteButton from '$lib/components/DeleteButton.svelte';
	import ScoreRing from '$lib/components/ScoreRing.svelte';
	import { trackClick } from '$lib/track';
	import { clone } from '$lib/utils';
	import type {
		Resume,
		ResumeScore,
		ContactInfo,
		Experience,
		Project,
		Education
	} from '$lib/types';

	let {
		resume,
		score,
		contactInfo,
		onDownload,
		onRegenerate,
		onResumeChange,
		isDownloading
	}: {
		resume: Resume;
		score: ResumeScore;
		contactInfo?: ContactInfo;
		onDownload: () => void;
		onRegenerate: () => void;
		onResumeChange?: (resume: Resume) => void;
		isDownloading: boolean;
	} = $props();

	// Local editable copy. The parent passes a NEW resume whenever a fresh
	// generation completes (the component remounts between runs), so there is
	// no need to re-sync from the prop after mount.
	function createLocalCopy(resume: Resume): Resume {
		return clone(resume);
	}
	const local: Resume = $state(createLocalCopy(resume));

	function notify() {
		onResumeChange?.(clone(local));
	}

	function updateField<K extends keyof Resume>(field: K, value: Resume[K]) {
		local[field] = value;
		notify();
	}

	function updateSkill(i: number, value: string) {
		local.skills[i] = value;
		notify();
	}

	function updateExpField(idx: number, field: keyof Experience, value: string) {
		local.experience[idx][field] = value;
		notify();
	}

	function updateExpHighlight(expIdx: number, hlIdx: number, value: string) {
		local.experience[expIdx].highlights[hlIdx] = value;
		notify();
	}

	function updateProjField(idx: number, field: keyof Project, value: string | string[]) {
		(local.projects[idx] as Record<string, unknown>)[field] = value;
		notify();
	}

	function updateProjHighlight(projIdx: number, hlIdx: number, value: string) {
		local.projects[projIdx].highlights[hlIdx] = value;
		notify();
	}

	function updateProjTech(projIdx: number, techIdx: number, value: string) {
		local.projects[projIdx].tech[techIdx] = value;
		notify();
	}

	function updateEduField(idx: number, field: keyof Education, value: string) {
		local.education[idx][field] = value;
		notify();
	}

	function deleteSkill(i: number) {
		local.skills.splice(i, 1);
		notify();
	}

	function deleteExpHighlight(expIdx: number, hlIdx: number) {
		local.experience[expIdx].highlights.splice(hlIdx, 1);
		notify();
	}

	function deleteExp(idx: number) {
		local.experience.splice(idx, 1);
		notify();
	}

	function deleteProjHighlight(projIdx: number, hlIdx: number) {
		local.projects[projIdx].highlights.splice(hlIdx, 1);
		notify();
	}

	function deleteProjTech(projIdx: number, techIdx: number) {
		local.projects[projIdx].tech.splice(techIdx, 1);
		notify();
	}

	function deleteProj(idx: number) {
		local.projects.splice(idx, 1);
		notify();
	}

	function deleteEdu(idx: number) {
		local.education.splice(idx, 1);
		notify();
	}
</script>

<div class="motion-fade-up w-full max-w-4xl mx-auto">
	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
		<!-- Score Panel -->
		<div class="lg:col-span-1 space-y-6 motion-fade-up" style="animation-delay: 0.2s">
			<!-- Overall Score -->
			<div class="glass rounded-2xl p-4 sm:p-6 space-y-4">
				<div class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
					Match Score
				</div>
				<div class="flex items-center gap-3">
					<span class="motion-fade-in text-5xl font-bold text-primary" style="animation-delay: 0.3s">
						{score.overall}
					</span>
					<span class="text-2xl text-muted-foreground font-light">%</span>
				</div>
				<div class="grid grid-cols-3 gap-2 pt-2">
					<ScoreRing value={score.skillsMatch} label="Skills" icon={Zap} delay={0.4} />
					<ScoreRing value={score.experienceMatch} label="Experience" icon={Briefcase} delay={0.5} />
					<ScoreRing value={score.keywordMatch} label="Keywords" icon={Target} delay={0.6} />
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-2">
				<Button
					onclick={() => {
						trackClick('download_pdf');
						onDownload();
					}}
					disabled={isDownloading}
					class="w-full gap-2 rounded-xl h-11 font-medium"
				>
					<Download class="w-4 h-4" />
					{isDownloading ? 'Generating PDF...' : 'Download PDF'}
				</Button>
				<Button
					variant="outline"
					onclick={() => {
						trackClick('regenerate_resume');
						onRegenerate();
					}}
					class="w-full gap-2 rounded-xl h-11 font-medium"
				>
					<RefreshCw class="w-4 h-4" />
					Regenerate
				</Button>
				<div class="flex items-start gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground">
					<Pencil class="w-3.5 h-3.5 shrink-0 mt-0.5" />
					<span>Click any text to edit. Hover blocks to delete.</span>
				</div>
			</div>
		</div>

		<!-- Resume Preview -->
		<div class="lg:col-span-2 motion-fade-up" style="animation-delay: 0.3s">
			<div class="glass rounded-2xl p-4 sm:p-8 space-y-5 relative overflow-hidden">
				<div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20"></div>

				<!-- Header -->
				<div class="flex items-start justify-between">
					<div class="flex-1 min-w-0">
						<h1 class="text-2xl font-bold tracking-tight">
							<EditableText value={local.name} onChange={(v) => updateField('name', v)} />
						</h1>
						<p class="text-sm text-primary font-medium mt-0.5">
							<EditableText value={local.title} onChange={(v) => updateField('title', v)} />
						</p>
						{#if contactInfo}
							<div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
								{#if contactInfo.githubUrl}
									<a
										href={contactInfo.githubUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
									>
										<Github class="w-3 h-3" />
										{contactInfo.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}
									</a>
								{/if}
								{#if contactInfo.linkedinUrl}
									<a
										href={contactInfo.linkedinUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
									>
										<Linkedin class="w-3 h-3" />
										{contactInfo.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
									</a>
								{/if}
								{#if contactInfo.phone}
									<span class="flex items-center gap-1 text-xs text-muted-foreground">
										<Phone class="w-3 h-3" />
										{contactInfo.phone}
									</span>
								{/if}
								{#if contactInfo.address}
									<span class="flex items-center gap-1 text-xs text-muted-foreground">
										<MapPin class="w-3 h-3" />
										{contactInfo.address}
									</span>
								{/if}
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-1.5 text-muted-foreground shrink-0 ml-4">
						<FileText class="w-4 h-4" />
						<span class="text-xs">1 page</span>
					</div>
				</div>

				<!-- Summary -->
				<div>
					<h3 class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">
						Summary
					</h3>
					<p class="text-sm leading-relaxed text-foreground/80">
						<EditableText value={local.summary} onChange={(v) => updateField('summary', v)} multiline />
					</p>
				</div>

				<!-- Skills -->
				<div>
					<h3 class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
						Skills
					</h3>
					<div class="flex flex-wrap gap-1.5">
						{#each local.skills as skill, i (i)}
							<div
								class="group motion-fade-in"
								style={`animation-delay: ${0.4 + i * 0.03}s`}
							>
								<Badge
									variant="secondary"
									class="text-xs font-normal rounded-md px-2.5 py-0.5 flex items-center gap-1"
								>
									<EditableText value={skill} onChange={(v) => updateSkill(i, v)} />
									<DeleteButton onclick={() => deleteSkill(i)} title="Remove skill" />
								</Badge>
							</div>
						{/each}
					</div>
				</div>

				<!-- Experience -->
				{#if local.experience.length > 0}
					<div>
						<h3 class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
							Experience
						</h3>
						<div class="space-y-4">
							{#each local.experience as exp, i (i)}
								<div
									class="space-y-1 group relative pr-5 motion-fade-up"
									style={`animation-delay: ${0.5 + i * 0.1}s`}
								>
									<button
										type="button"
										onclick={() => deleteExp(i)}
										title="Delete experience"
										class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
									>
										<X class="w-2.5 h-2.5" />
									</button>
									<div class="flex items-baseline justify-between gap-2">
										<h4 class="text-sm font-semibold">
											<EditableText
												value={exp.role}
												onChange={(v) => updateExpField(i, 'role', v)}
											/>
										</h4>
										<span class="text-xs text-muted-foreground shrink-0">
											<EditableText
												value={exp.duration}
												onChange={(v) => updateExpField(i, 'duration', v)}
											/>
										</span>
									</div>
									<p class="text-xs text-muted-foreground">
										<EditableText
											value={exp.company}
											onChange={(v) => updateExpField(i, 'company', v)}
										/>
									</p>
									<ul class="space-y-0.5 mt-1">
										{#each exp.highlights as h, j (j)}
											<li
												class="group/hl text-xs text-foreground/75 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground flex items-start gap-1"
											>
												<EditableText
													value={h}
													onChange={(v) => updateExpHighlight(i, j, v)}
													multiline
												/>
												<DeleteButton
													onclick={() => deleteExpHighlight(i, j)}
													title="Remove bullet"
												/>
											</li>
										{/each}
									</ul>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Projects -->
				{#if local.projects.length > 0}
					<div>
						<h3 class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3">
							Projects
						</h3>
						<div class="space-y-3">
							{#each local.projects as proj, i (i)}
								<div
									class="space-y-1 group relative pr-5 motion-fade-up"
									style={`animation-delay: ${0.6 + i * 0.08}s`}
								>
									<button
										type="button"
										onclick={() => deleteProj(i)}
										title="Delete project"
										class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
									>
										<X class="w-2.5 h-2.5" />
									</button>
									<h4 class="text-sm font-semibold">
										<EditableText
											value={proj.name}
											onChange={(v) => updateProjField(i, 'name', v)}
										/>
									</h4>
									<p class="text-xs text-foreground/75">
										<EditableText
											value={proj.description}
											onChange={(v) => updateProjField(i, 'description', v)}
											multiline
										/>
									</p>
									{#if proj.highlights && proj.highlights.length > 0}
										<ul class="space-y-0.5 mt-1">
											{#each proj.highlights as h, j (j)}
												<li
													class="group/hl text-xs text-foreground/75 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-muted-foreground flex items-start gap-1"
												>
													<EditableText
														value={h}
														onChange={(v) => updateProjHighlight(i, j, v)}
														multiline
													/>
													<DeleteButton
														onclick={() => deleteProjHighlight(i, j)}
														title="Remove bullet"
													/>
												</li>
											{/each}
										</ul>
									{/if}
									<div class="flex flex-wrap gap-1 pt-0.5">
										{#each proj.tech as t, j (j)}
											<span
												class="group/tech text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex items-center gap-0.5"
											>
												<EditableText
													value={t}
													onChange={(v) => updateProjTech(i, j, v)}
												/>
												<DeleteButton
													onclick={() => deleteProjTech(i, j)}
													title="Remove tech"
												/>
											</span>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Education -->
				{#if local.education.length > 0}
					<div>
						<h3 class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
							Education
						</h3>
						<div class="space-y-2">
							{#each local.education as edu, i (i)}
								<div class="group relative flex items-baseline justify-between gap-2 pr-5">
									<button
										type="button"
										onclick={() => deleteEdu(i)}
										title="Delete education"
										class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
									>
										<X class="w-2.5 h-2.5" />
									</button>
									<div>
										<span class="text-sm font-medium">
											<EditableText
												value={edu.degree}
												onChange={(v) => updateEduField(i, 'degree', v)}
											/>
										</span>
										<span class="text-xs text-muted-foreground ml-2">
											<EditableText
												value={edu.institution}
												onChange={(v) => updateEduField(i, 'institution', v)}
											/>
										</span>
									</div>
									<span class="text-xs text-muted-foreground shrink-0">
										<EditableText value={edu.year} onChange={(v) => updateEduField(i, 'year', v)} />
									</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>