<script lang="ts">
	import { Zap, Crown, Star } from 'lucide-svelte';
	import type { Component } from 'svelte';

	let { plan }: { plan: string } = $props();

	const config: Record<string, { label: string; className: string; icon: Component | null }> = {
		free: { label: 'Free', className: 'bg-secondary/70 text-secondary-foreground border-border/40', icon: null },
		starter: {
			label: 'Starter',
			className: 'bg-teal-500/10 text-teal-600 border-teal-500/30',
			icon: Zap
		},
		premium: {
			label: 'Premium',
			className: 'bg-primary/10 text-primary border-primary/30',
			icon: Crown
		},
		annual: {
			label: 'Annual',
			className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
			icon: Star
		}
	};

	const c = config[plan] ?? config.free;
</script>

<span
	class={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border uppercase ${c.className}`}
>
	{#if c.icon}
		<svelte:component this={c.icon} class="w-3 h-3" />
	{/if}
	{c.label}
</span>