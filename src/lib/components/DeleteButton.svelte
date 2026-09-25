<script lang="ts">
	import { X } from 'lucide-svelte';

	let {
		onClick,
		title = 'Delete'
	}: { onClick: () => void; title?: string } = $props();
</script>

<button
	type="button"
	onclick={(e) => {
		e.stopPropagation();
		onClick();
	}}
	{title}
	class="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive"
>
	<X class="w-2.5 h-2.5" />
</button>