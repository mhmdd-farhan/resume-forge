<script lang="ts">
	import { tick } from 'svelte';
	import type { Component } from 'svelte';

	let {
		value,
		label,
		icon: Icon,
		delay = 0
	}: { value: number; label: string; icon: Component; delay?: number } = $props();

	const R = 28;
	const circumference = 2 * Math.PI * R;
	const target = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference;
	let offset = $state(circumference);

	$effect(() => {
		const timeout = setTimeout(() => {
			void tick().then(() => {
				offset = target;
			});
		}, delay * 1000 + 200);
		return () => clearTimeout(timeout);
	});
</script>

<div class="motion-fade-up flex flex-col items-center gap-2" style={`animation-delay: ${delay}s`}>
	<div class="relative w-16 h-16">
		<svg class="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
			<circle
				cx="32"
				cy="32"
				r={R}
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				class="text-muted/40"
			/>
			<circle
				cx="32"
				cy="32"
				r={R}
				fill="none"
				stroke="currentColor"
				stroke-width="3"
				stroke-linecap="round"
				class="text-primary"
				stroke-dasharray={circumference}
				stroke-dashoffset={offset}
				style="transition: stroke-dashoffset 1s ease-out"
			/>
		</svg>
		<div class="absolute inset-0 flex items-center justify-center">
			<Icon class="w-4 h-4 text-primary" />
		</div>
	</div>
	<div class="text-center">
		<div class="text-sm font-semibold">{value}%</div>
		<div class="text-[10px] text-muted-foreground">{label}</div>
	</div>
</div>