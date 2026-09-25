<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import PageTracker from '$lib/components/PageTracker.svelte';
	import VercelAnalytics from '$lib/components/VercelAnalytics.svelte';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	const appUrl = $derived($page.data.appUrl);
</script>

<svelte:head>
	<title>ResumeForge — Free AI Resume & CV Generator | ATS-Friendly</title>
	<meta
		name="description"
		content="Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes. No experience needed."
	/>
	<meta
		name="keywords"
		content="generate cv using ai free, generate resume using ai free, generate resume cv ats friendly using ai free, ai resume generator free, ai cv generator free, ats friendly resume generator, ats resume builder free, resume builder ai, cv builder ai free, free resume maker ai, buat cv pakai ai gratis, generator cv ats gratis"
	/>
	<meta name="robots" content="index, follow" />
	<meta property="og:type" content="website" />
	<meta property="og:locale" content="en_US" />
	<meta property="og:site_name" content="ResumeForge" />
	<meta property="og:title" content="ResumeForge — Free AI Resume & CV Generator | ATS-Friendly" />
	<meta
		property="og:description"
		content="Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes."
	/>
	<meta property="og:url" content={appUrl} />
	<meta property="og:image" content={`${appUrl}/og-image.png`} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="ResumeForge — Free AI Resume & CV Generator" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="ResumeForge — Free AI Resume & CV Generator | ATS-Friendly" />
	<meta
		name="twitter:description"
		content="Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes."
	/>
	<meta name="twitter:image" content={`${appUrl}/og-image.png`} />
	<meta name="twitter:creator" content="@resumeforge" />
	<link rel="canonical" href={appUrl} />
</svelte:head>

<div class="gradient-mesh"></div>
<PageTracker />
{@render children()}
<VercelAnalytics />