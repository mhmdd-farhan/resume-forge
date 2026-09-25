<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { trackPageView } from '$lib/track';

	afterNavigate((nav) => {
		trackPageView(nav.to?.url.pathname ?? '/');
	});
</script>