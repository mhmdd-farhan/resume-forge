<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<h3 {...rest} class={cn('text-2xl font-semibold leading-none tracking-tight', className)}>
	{@render children?.()}
</h3>