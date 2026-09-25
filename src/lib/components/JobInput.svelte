<script lang="ts">
	import { FileText, ArrowRight } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/Button.svelte';

	let {
		value,
		onChange,
		onNext
	}: { value: string; onChange: (v: string) => void; onNext: () => void } = $props();

	const isValid = $derived(value.trim().length >= 50);
</script>

<div class="motion-fade-up w-full max-w-2xl mx-auto">
	<div class="space-y-6">
		<div class="space-y-2">
			<div class="flex items-center gap-2.5 text-muted-foreground mb-1">
				<div class="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
					<FileText class="w-3.5 h-3.5 text-primary" />
				</div>
				<span class="text-xs font-medium tracking-wide uppercase">Step 1</span>
			</div>
			<h2 class="text-2xl font-semibold tracking-tight">Paste the job description</h2>
			<p class="text-sm text-muted-foreground">
				We'll analyze requirements and tailor your resume to match.
			</p>
		</div>

		<div class="relative group">
			<div
				class="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-sm"
			></div>
			<textarea
				bind:value
				placeholder="Paste the full job description here — including role title, requirements, responsibilities, and preferred qualifications..."
				class="relative w-full h-40 sm:h-56 resize-none rounded-xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all duration-200"
			></textarea>
		</div>

		<div class="flex items-center justify-between">
			<span class="text-xs text-muted-foreground">
				{#if value.length > 0}
					<span class={isValid ? 'text-emerald-600' : 'text-muted-foreground'}>
						{value.length} characters{!isValid ? ' (minimum 50)' : ''}
					</span>
				{/if}
			</span>
			<Button
				onclick={onNext}
				disabled={!isValid}
				class="gap-2 px-6 rounded-xl h-10 font-medium transition-all duration-200"
			>
				Continue
				<ArrowRight class="w-3.5 h-3.5" />
			</Button>
		</div>
	</div>
</div>