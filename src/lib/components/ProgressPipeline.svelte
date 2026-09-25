<script lang="ts">
	import { Search, Cpu, GitCompare, PenTool, FileOutput, Check, Loader2 } from 'lucide-svelte';
	import type { Component } from 'svelte';
	import type { PipelineStep } from '$lib/types';

	const STEPS: { id: PipelineStep; label: string; icon: Component; duration: number }[] = [
		{ id: 'analyzing', label: 'Analyzing Job', icon: Search, duration: 2000 },
		{ id: 'extracting', label: 'Extracting Skills', icon: Cpu, duration: 2500 },
		{ id: 'matching', label: 'Matching Experience', icon: GitCompare, duration: 2000 },
		{ id: 'writing', label: 'Writing Resume', icon: PenTool, duration: 3000 },
		{ id: 'formatting', label: 'Formatting PDF', icon: FileOutput, duration: 1500 }
	];

	let {
		isActive,
		onComplete
	}: { isActive: boolean; onComplete?: () => void } = $props();

	let currentStepIndex = $state(-1);
	let completedSteps = $state<number[]>([]);

	$effect(() => {
		if (!isActive) {
			currentStepIndex = -1;
			completedSteps = [];
			return;
		}

		const timers: number[] = [];
		let stepIndex = 0;

		const advance = (i: number) => {
			if (i >= STEPS.length) {
				onComplete?.();
				return;
			}
			currentStepIndex = i;
			timers.push(
				window.setTimeout(() => {
					completedSteps = [...completedSteps, i];
					advance(i + 1);
				}, STEPS[i].duration)
			);
		};

		currentStepIndex = 0;
		advance(0);

		return () => timers.forEach(clearTimeout);
	});
</script>

<div class="motion-fade-up w-full max-w-md mx-auto">
	<div class="space-y-8">
		<div class="text-center space-y-2">
			<div class="spin-slow w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
				<Cpu class="w-5 h-5 text-primary" />
			</div>
			<h2 class="text-xl font-semibold tracking-tight">Forging your resume</h2>
			<p class="text-sm text-muted-foreground">This usually takes about 15 seconds</p>
		</div>

		<div class="space-y-1">
			{#each STEPS as step, index (step.id)}
				{@const isCompleted = completedSteps.includes(index)}
				{@const isCurrent = index === currentStepIndex}
				{@const isPending = index > currentStepIndex}
				{@const Icon = step.icon}
				<div
					class={`motion-fade-in flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-500 ${isCurrent ? 'bg-primary/5' : ''} ${isPending ? 'opacity-40' : ''}`}
					style={`animation-delay: ${index * 0.08}s`}
				>
					<div
						class={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${isCompleted ? 'bg-emerald-500/10' : ''} ${isCurrent ? 'bg-primary/10' : ''} ${isPending ? 'bg-muted' : ''}`}
					>
						{#if isCompleted}
							<span class="animate-fade-in">
								<Check class="w-4 h-4 text-emerald-600" />
							</span>
						{:else if isCurrent}
							<span class="spin-slow">
								<Loader2 class="w-4 h-4 text-primary" />
							</span>
						{:else}
							<Icon class="w-4 h-4 text-muted-foreground" />
						{/if}
					</div>

					<span
						class="text-sm font-medium transition-colors duration-300"
						class:text-emerald-700={isCompleted}
						class:text-foreground={isCurrent}
						class:text-muted-foreground={isPending}
					>
						{step.label}
					</span>

					{#if isCurrent}
						<div class="flex-1 flex justify-end">
							<div class="h-1 w-20 rounded-full bg-muted overflow-hidden">
								<div
									class="h-full bg-primary rounded-full animate-fill-bar"
									style={`animation-duration: ${step.duration}ms`}
								></div>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.spin-slow {
		animation: spin 2s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>