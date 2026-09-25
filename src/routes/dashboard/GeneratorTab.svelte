<script lang="ts">
	import { JobInput } from '$lib/components/JobInput.svelte';
	import { ProfileInput } from '$lib/components/ProfileInput.svelte';
	import { ProgressPipeline } from '$lib/components/ProgressPipeline.svelte';
	import { ResumePreview } from '$lib/components/ResumePreview.svelte';
	import { generateResume } from '$lib/generate';
	import { generateResumePDF } from '$lib/pdf';
	import { emptyProfileForm } from '$lib/types';
	import type { Resume, ResumeScore, ContactInfo, ProfileForm } from '$lib/types';

	type Step = 'job' | 'profile' | 'generating' | 'result';

	let step = $state<Step>('job');
	let form: ProfileForm = $state(emptyProfileForm());
	let resume = $state<Resume | null>(null);
	let score = $state<ResumeScore | null>(null);
	let contactInfo = $state<ContactInfo | null>(null);
	let error = $state<string | null>(null);
	let isDownloading = $state(false);

	async function handleGenerate() {
		step = 'generating';
		error = null;

		const formData = new FormData();
		formData.set('jobDescription', form.jobDescription);
		formData.set('githubUrl', form.githubUrl);
		formData.set('githubRepoUrls', form.githubRepoUrls.filter((u) => u.trim()).join(','));
		formData.set('linkedinUrl', form.linkedinUrl);
		formData.set('linkedinText', form.linkedinText);
		formData.set('portfolioUrl', form.portfolioUrl);
		formData.set('phone', form.phone);
		formData.set('address', form.address);
		formData.set('educationText', form.educationText);

		const result = await generateResume(formData);
		if (result.success) {
			resume = result.data.resume;
			score = result.data.score;
			contactInfo = result.data.contactInfo;
		} else {
			error = result.error;
			step = 'profile';
		}
	}

	function handlePipelineComplete() {
		if (resume && score) setTimeout(() => (step = 'result'), 500);
	}

	async function handleDownload() {
		if (!resume) return;
		isDownloading = true;
		try {
			const pdfBytes = await generateResumePDF(resume, contactInfo ?? undefined);
			const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${resume.name.replace(/\s+/g, '_')}_Resume.pdf`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch {
			error = 'Failed to generate PDF. Please try again.';
		} finally {
			isDownloading = false;
		}
	}

	function handleRegenerate() {
		resume = null;
		score = null;
		contactInfo = null;
		void handleGenerate();
	}
</script>

<div class="motion-fade-up">
	{#if error}
		<div
			class="mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-sm flex items-center justify-between"
		>
			<span>{error}</span>
			<button type="button" onclick={() => (error = null)} class="ml-3 text-destructive/60 hover:text-destructive">
				✕
			</button>
		</div>
	{/if}

	<div class="flex items-center justify-center py-8 min-h-[60vh]">
		{#if step === 'job'}
			<JobInput value={form.jobDescription} onChange={(v) => (form.jobDescription = v)} onNext={() => (step = 'profile')} />
		{:else if step === 'profile'}
			<ProfileInput {form} onNext={handleGenerate} onBack={() => (step = 'job')} />
		{:else if step === 'generating'}
			<ProgressPipeline isActive={step === 'generating'} onComplete={handlePipelineComplete} />
		{:else if step === 'result' && resume && score}
			<ResumePreview
				resume={resume}
				{score}
				{contactInfo}
				onDownload={handleDownload}
				onRegenerate={handleRegenerate}
				onResumeChange={(r) => (resume = r)}
				isDownloading={isDownloading}
			/>
		{/if}
	</div>
</div>