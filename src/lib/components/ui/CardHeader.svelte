<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<div {...rest} class={cn('flex flex-col space-y-1.5 p-6', className)}>
	{@render children?.()}
</div>