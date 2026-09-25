<script lang="ts">
	import { onMount } from 'svelte';
	import { inject } from '@vercel/analytics';

	onMount(() => {
		inject();
	});
</script>