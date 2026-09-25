<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Fallback for the rare case navigation reaches this page without the
	// server load redirect (e.g. a stale client-side link).
	onMount(() => {
		goto('/dashboard', { replaceState: true });
	});
</script>

<div class="min-h-screen flex items-center justify-center">
	<p class="text-sm text-muted-foreground animate-pulse">Redirecting to dashboard…</p>
</div>