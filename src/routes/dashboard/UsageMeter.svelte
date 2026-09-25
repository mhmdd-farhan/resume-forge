<script lang="ts">
	import { CheckCircle2, AlertCircle } from 'lucide-svelte';

	let {
		used,
		limit,
		period = 'total'
	}: {
		used: number;
		limit: number | null;
		period?: 'total' | 'daily';
	} = $props();

	const pct = $derived(limit === null ? 0 : Math.min((used / limit) * 100, 100));
	const isWarning = $derived(limit !== null && pct >= 66);
	const isDanger = $derived(limit !== null && pct >= 100);

	const barColor = $derived(
		period === 'daily'
			? isDanger
				? 'bg-destructive'
				: isWarning
					? 'bg-amber-500'
					: 'bg-teal-500'
			: isDanger
				? 'bg-destructive'
				: isWarning
					? 'bg-amber-500'
					: 'bg-primary'
	);
</script>

{#if limit === null}
	<div class="flex items-center gap-2 text-sm text-emerald-600 font-medium">
		<CheckCircle2 class="w-4 h-4" />
		Unlimited generations
	</div>
{:else}
	<div class="space-y-2">
		<div class="flex items-center justify-between text-sm">
			<span class="text-muted-foreground font-medium">
				{period === 'daily' ? "Today's CV Generations" : 'CV Generations used'}
			</span>
			<span
				class={`font-bold tabular-nums ${
					isDanger ? 'text-destructive' : isWarning ? 'text-amber-600' : 'text-foreground'
				}`}
			>
				{used} / {limit}
			</span>
		</div>
		<div class="w-full h-2 bg-secondary rounded-full overflow-hidden">
			<div
				class={`h-full rounded-full motion-fade-in ${barColor}`}
				style={`width: ${pct}%`}
			></div>
		</div>
		{#if isDanger && period === 'daily'}
			<p class="text-xs text-destructive font-medium flex items-center gap-1">
				<AlertCircle class="w-3 h-3" /> Daily limit reached. Resets at midnight UTC.
			</p>
		{/if}
		{#if isDanger && period === 'total'}
			<p class="text-xs text-destructive font-medium flex items-center gap-1">
				<AlertCircle class="w-3 h-3" /> Limit reached. Upgrade to keep generating.
			</p>
		{/if}
		{#if !isDanger && period === 'daily'}
			<p class="text-xs text-muted-foreground">
				{limit - used} generation{limit - used !== 1 ? 's' : ''} remaining today · resets midnight UTC
			</p>
		{/if}
		{#if !isDanger && period === 'total'}
			<p class="text-xs text-muted-foreground">
				{limit - used} generation{limit - used !== 1 ? 's' : ''} remaining on free plan
			</p>
		{/if}
	</div>
{/if}