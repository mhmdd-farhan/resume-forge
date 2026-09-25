<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		class: className,
		value = 0,
		...rest
	}: { class?: string; value?: number; [key: string]: unknown } = $props();
</script>

<div {...rest} class={cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className)}>
	<div
		class="h-full w-full flex-1 bg-primary transition-all"
		style={`transform: translateX(-${100 - Math.min(Math.max(value, 0), 100)}%)`}
	></div>
</div>