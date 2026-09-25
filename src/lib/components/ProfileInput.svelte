<script lang="ts">
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
		GraduationCap
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { trackClick } from '$lib/track';
	import type { ProfileForm } from '$lib/types';

	let {
		form,
		onNext,
		onBack
	}: { form: ProfileForm; onNext: () => void; onBack: () => void } = $props();

	// Initial visibility for the collapsible sections — intentionally computed
	// once on mount. The parent remounts this step for each generation, so the
	// section starts collapsed/expanded based on the fresh form data.
	function hasGithubRepos(): boolean {
		return form.githubRepoUrls.some((u) => u.trim());
	}
	function hasLinkedinPaste(): boolean {
		return !!form.linkedinText;
	}
	function hasEducation(): boolean {
		return !!form.educationText;
	}
	let showGithubRepos = $state(hasGithubRepos());
	let showLinkedinPaste = $state(hasLinkedinPaste());
	let showEducation = $state(hasEducation());

	function updateRepoUrl(index: number, value: string) {
		form.githubRepoUrls[index] = value;
	}
</script>

<div class="motion-fade-up w-full max-w-2xl mx-auto">
	<div class="space-y-6">
		<div class="space-y-2">
			<div class="flex items-center gap-2.5 text-muted-foreground mb-1">
				<div class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
					<Globe class="w-3.5 h-3.5 text-primary" />
				</div>
				<span class="text-xs font-medium tracking-wide uppercase">Step 2</span>
			</div>
			<h2 class="text-2xl font-semibold tracking-tight">Add your profile sources</h2>
			<p class="text-sm text-muted-foreground">
				We'll use your experience and projects to build your resume.
			</p>
		</div>

		<div class="space-y-4">
			<!-- GitHub profile -->
			<div class="group motion-fade-in" style="animation-delay: 0.1s">
				<label class="flex items-center gap-2 text-sm font-medium mb-2">
					<Github class="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
					GitHub Profile
				</label>
				<div class="relative">
					<input
						type="url"
						bind:value={form.githubUrl}
						placeholder="https://github.com/username"
						class="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
					/>
				</div>
			</div>

			<!-- GitHub repos toggle -->
			<div class="motion-fade-in" style="animation-delay: 0.15s">
				<button
					type="button"
					onclick={() => (showGithubRepos = !showGithubRepos)}
					class="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
				>
					<FolderGit2 class="w-3.5 h-3.5" />
					Add specific project repositories
					<ChevronDown
						class={`w-3 h-3 transition-transform duration-200 ${showGithubRepos ? 'rotate-180' : ''}`}
					/>
				</button>

				{#if showGithubRepos}
					<div class="mt-2 space-y-2 animate-fade-in">
						<p class="text-xs text-muted-foreground mb-2">
							Add links to public repos you want highlighted. We'll read the README and extract
							project details automatically.
						</p>
						{#each form.githubRepoUrls as url, i (i)}
							<div class="flex items-center gap-2 motion-fade-in" style={`animation-delay: ${i * 0.05}s`}>
								<span class="text-xs text-muted-foreground/60 w-4 text-right shrink-0">{i + 1}.</span>
								<input
									type="url"
									value={url}
									oninput={(e) => updateRepoUrl(i, (e.currentTarget as HTMLInputElement).value)}
									placeholder={`https://github.com/username/project-${i + 1}`}
									class="flex-1 h-10 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
								/>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- LinkedIn profile -->
			<div class="group motion-fade-in" style="animation-delay: 0.2s">
				<label class="flex items-center gap-2 text-sm font-medium mb-2">
					<Linkedin class="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
					LinkedIn Profile
					<span class="text-xs text-muted-foreground font-normal">(optional)</span>
				</label>
				<div class="relative">
					<input
						type="url"
						bind:value={form.linkedinUrl}
						placeholder="https://linkedin.com/in/username"
						class="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
					/>
				</div>
			</div>

			<!-- LinkedIn paste toggle -->
			<div class="motion-fade-in" style="animation-delay: 0.25s">
				<button
					type="button"
					onclick={() => (showLinkedinPaste = !showLinkedinPaste)}
					class="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
				>
					<FileText class="w-3.5 h-3.5" />
					Paste your LinkedIn experience directly
					<ChevronDown
						class={`w-3 h-3 transition-transform duration-200 ${showLinkedinPaste ? 'rotate-180' : ''}`}
					/>
				</button>

				{#if showLinkedinPaste}
					<div class="mt-2 animate-fade-in">
						<p class="text-xs text-muted-foreground mb-2">
							Copy your experience from LinkedIn and paste it here. Include job titles, companies,
							dates, and descriptions for best results.
						</p>
						<textarea
							bind:value={form.linkedinText}
							placeholder={`Example:\nSenior Software Engineer at Google\nJan 2022 - Present\n- Led migration of core services to microservices architecture\n- Reduced API latency by 40% through caching optimization\n\nSoftware Engineer at Meta\nJun 2019 - Dec 2021\n- Built real-time notification system serving 2B+ users...`}
							class="w-full h-40 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
						></textarea>
					</div>
				{/if}
			</div>

			<!-- Education toggle -->
			<div class="motion-fade-in" style="animation-delay: 0.3s">
				<button
					type="button"
					onclick={() => (showEducation = !showEducation)}
					class="flex items-center gap-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
				>
					<GraduationCap class="w-3.5 h-3.5" />
					Add your education
					<ChevronDown
						class={`w-3 h-3 transition-transform duration-200 ${showEducation ? 'rotate-180' : ''}`}
					/>
				</button>

				{#if showEducation}
					<div class="mt-2 animate-fade-in">
						<p class="text-xs text-muted-foreground mb-2">
							List your degrees, institutions, and graduation years. This will be used as the
							PRIMARY source for the Education section.
						</p>
						<textarea
							bind:value={form.educationText}
							placeholder={`Example:\nB.S. Computer Science, Stanford University, 2020\nM.S. Machine Learning, MIT, 2022`}
							class="w-full h-28 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 text-sm leading-relaxed placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
						></textarea>
					</div>
				{/if}
			</div>

			<!-- Portfolio -->
			<div class="group motion-fade-in" style="animation-delay: 0.35s">
				<label class="flex items-center gap-2 text-sm font-medium mb-2">
					<Globe class="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
					Portfolio
					<span class="text-xs text-muted-foreground font-normal">(optional)</span>
				</label>
				<div class="relative">
					<input
						type="url"
						bind:value={form.portfolioUrl}
						placeholder="https://yoursite.com"
						class="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
					/>
				</div>
			</div>

			<!-- Phone -->
			<div class="group motion-fade-in" style="animation-delay: 0.4s">
				<label class="flex items-center gap-2 text-sm font-medium mb-2">
					<Phone class="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
					Phone Number
					<span class="text-xs text-muted-foreground font-normal">(optional)</span>
				</label>
				<div class="relative">
					<input
						type="tel"
						bind:value={form.phone}
						placeholder="+1 (555) 123-4567"
						class="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
					/>
				</div>
			</div>

			<!-- Address -->
			<div class="group motion-fade-in" style="animation-delay: 0.45s">
				<label class="flex items-center gap-2 text-sm font-medium mb-2">
					<MapPin class="w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
					Address
					<span class="text-xs text-muted-foreground font-normal">(optional)</span>
				</label>
				<div class="relative">
					<input
						type="text"
						bind:value={form.address}
						placeholder="San Francisco, CA"
						class="w-full h-11 rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
					/>
				</div>
			</div>
		</div>

		<div class="flex items-center justify-between pt-2">
			<Button
				variant="ghost"
				onclick={onBack}
				class="gap-2 rounded-xl h-10 text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft class="w-3.5 h-3.5" />
				Back
			</Button>
			<Button
				onclick={() => {
					trackClick('generate_resume');
					onNext();
				}}
				class="gap-2 px-6 rounded-xl h-10 font-medium transition-all duration-200"
			>
				Generate Resume
				<ArrowRight class="w-3.5 h-3.5" />
			</Button>
		</div>
	</div>
</div>