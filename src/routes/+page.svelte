<script lang="ts">
	import { page } from '$app/stores';
	import {
		Anvil,
		ArrowRight,
		Check,
		Sparkles,
		Github,
		Linkedin,
		FileText,
		Target,
		GraduationCap,
		Zap,
		Menu,
		X
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import { signIn, signOut } from '$lib/auth';
	import { trackClick } from '$lib/track';
	import { formatPrice, priceForPlan } from '$lib/pricing';

	type PlanType = 'starter' | 'premium' | 'annual';

	const user = $derived($page.data.user);
	const appUrl = $derived($page.data.appUrl);

	let loadingCheckout = $state<PlanType | null>(null);
	let mobileMenuOpen = $state(false);

	async function handleSubscribe(planType: PlanType) {
		trackClick(`subscribe_${planType}`);
		if (!user) {
			signIn();
			return;
		}

		loadingCheckout = planType;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planType })
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				alert(data.error || 'Failed to create checkout session');
			}
		} catch (err) {
			console.error(err);
			alert('Error starting checkout session. Please try again.');
		} finally {
			loadingCheckout = null;
		}
	}

	const universities = [
		'Universitas Indonesia',
		'Institut Teknologi Bandung',
		'Universitas Gadjah Mada',
		'BINUS University',
		'Universitas Airlangga',
		'Universitas Diponegoro',
		'Universitas Brawijaya',
		'Telkom University',
		'Universitas Padjadjaran',
		'Politeknik Negeri Jakarta',
		'SMKN 1 Jakarta',
		'SMKN 26 Jakarta',
		'SMKN 2 Bandung',
		'SMKN 5 Surabaya',
		'SMKN 7 Semarang'
	];

	const jsonLd = $derived(JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebApplication',
				'@id': `${appUrl}/#webapp`,
				name: 'ResumeForge',
				url: appUrl,
				description:
					'Generate an ATS-friendly resume or CV using AI for free. Paste any job description and get a tailored, recruiter-ready resume in minutes.',
				applicationCategory: 'BusinessApplication',
				operatingSystem: 'Web',
				offers: {
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'IDR',
					description: 'Free plan — 3 resumes included'
				},
				featureList: [
					'Generate ATS-friendly resume using AI',
					'Generate CV using AI for free',
					'Tailored resume from job description',
					'PDF export',
					'ATS score optimization'
				]
			},
			{
				'@type': 'FAQPage',
				mainEntity: [
					{
						'@type': 'Question',
						name: 'Can I generate a CV using AI for free?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'Yes. ResumeForge lets you generate up to 3 ATS-friendly resumes or CVs for free using AI. No credit card required.'
						}
					},
					{
						'@type': 'Question',
						name: 'How do I generate an ATS-friendly resume using AI?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: 'Simply paste the job description and your profile details into ResumeForge. Our AI will generate a tailored, ATS-optimized resume in seconds.'
						}
					},
					{
						'@type': 'Question',
						name: 'Is ResumeForge really free?',
						acceptedAnswer: {
							'@type': 'Answer',
							text: `Yes, the free plan includes 3 resume generations with PDF export. Paid starter access starts at ${formatPrice(
								priceForPlan('starter')
							)} for 30 days.`
						}
					}
				]
			}
		]
	})
		.replace(/</g, '\\u003c')
		.replace(/>/g, '\\u003e'));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<div class="min-h-screen flex flex-col selection:bg-primary/20 selection:text-primary">
	<!-- 1. Navigation -->
	<header class="motion-fade-up w-full border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
		<div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5 group">
				<div
					class="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200"
				>
					<Anvil class="w-4 h-4 text-primary-foreground" />
				</div>
				<span class="font-semibold text-base tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
					ResumeForge
				</span>
			</a>

			<!-- Desktop Nav -->
			<div class="hidden sm:flex items-center gap-6">
				<a
					href="#pricing"
					class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
				>
					Pricing
				</a>

				{#if user}
					<div class="flex items-center gap-3">
						<span
							class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
						>
							{user.plan || 'free'} plan
						</span>
						{#if user.image}
							<img
								src={user.image}
								alt={user.name || 'User'}
								class="w-7 h-7 rounded-full border border-border shadow-sm"
							/>
						{/if}
						<Button
							onclick={() => signOut()}
							variant="ghost"
							class="rounded-xl px-3 h-9 text-xs font-semibold hover:bg-secondary/40"
						>
							Sign Out
						</Button>
						<Button
							href="/dashboard"
							class="rounded-xl px-4 h-9 text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
						>
							Dashboard
						</Button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => signIn()}
						class="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
					>
						Sign In
					</button>
					<Button
						href="/dashboard"
						class="rounded-xl px-5 h-10 text-xs font-semibold shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
					>
						Get Started
					</Button>
				{/if}
			</div>

			<!-- Mobile: avatar (if logged in) + burger -->
			<div class="flex sm:hidden items-center gap-2">
				{#if user?.image}
					<img
						src={user.image}
						alt={user.name || 'User'}
						class="w-7 h-7 rounded-full border border-border shadow-sm"
					/>
				{/if}
				<button
					type="button"
					onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
					class="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-secondary/50 transition-colors"
					aria-label="Toggle menu"
				>
					{#if mobileMenuOpen}<X class="w-5 h-5" />{:else}<Menu class="w-5 h-5" />{/if}
				</button>
			</div>
		</div>

		<!-- Mobile Dropdown Menu -->
		{#if mobileMenuOpen}
			<div class="sm:hidden overflow-hidden border-t border-border/30 bg-background/95 backdrop-blur-md animate-fade-in">
				<div class="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-1">
					<a
						href="#pricing"
						onclick={() => (mobileMenuOpen = false)}
						class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
					>
						Pricing
					</a>

					{#if !user}
						<button
							type="button"
							onclick={() => {
								signIn();
								mobileMenuOpen = false;
							}}
							class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all text-left"
						>
							Sign In
						</button>
						<a
							href="/dashboard"
							onclick={() => (mobileMenuOpen = false)}
							class="flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
						>
							Get Started
						</a>
					{:else}
						<div class="px-3 py-2 flex items-center gap-2">
							<span
								class="text-[10px] uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
							>
								{user.plan || 'free'} plan
							</span>
							<span class="text-sm text-muted-foreground truncate">{user.name}</span>
						</div>
						<a
							href="/dashboard"
							onclick={() => (mobileMenuOpen = false)}
							class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all"
						>
							Dashboard
						</a>
						<button
							type="button"
							onclick={() => {
								signOut();
								mobileMenuOpen = false;
							}}
							class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-all text-left"
						>
							Sign Out
						</button>
					{/if}
				</div>
			</div>
		{/if}
	</header>

	<!-- 2. Hero Section -->
	<section class="relative w-full py-16 md:py-24 overflow-hidden flex flex-col items-center justify-center px-6">
		<div class="max-w-4xl mx-auto text-center space-y-6 z-10">
			<h1
				class="motion-fade-up text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1] max-w-3xl mx-auto"
			>
				Build a resume recruiters <br class="hidden sm:inline" />
				actually want to read.
			</h1>

			<p
				class="motion-fade-up text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto font-normal"
				style="animation-delay: 0.1s"
			>
				Generate ATS-friendly resumes powered by AI. Designed to help students, fresh graduates,
				and professionals create professional resumes in minutes.
			</p>

			<div
				class="motion-fade-up flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
				style="animation-delay: 0.2s"
			>
				<Button
					href="/dashboard"
					onclick={() => trackClick('cta_generate_hero')}
					size="lg"
					class="w-full py-2 sm:w-auto gap-2 rounded-xl h-12 font-medium shadow-md shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
				>
					Generate My Resume
					<ArrowRight class="w-4 h-4" />
				</Button>
				<Button
					href="#pricing"
					variant="outline"
					size="lg"
					class="w-full py-2 sm:w-auto rounded-xl h-12 font-medium hover:bg-secondary/40 transition-all duration-200"
				>
					View Pricing
				</Button>
			</div>
		</div>

		<!-- Realistic App Preview Mockup -->
		<div
			class="motion-fade-up w-full max-w-5xl mx-auto mt-16 md:mt-20 z-10"
			style="animation-delay: 0.4s"
		>
			<div class="relative rounded-2xl border border-border/60 bg-card/65 backdrop-blur-md shadow-2xl overflow-hidden aspect-[3/4] sm:aspect-[16/9.5] md:aspect-[16/9]">
				<!-- Browser Header Bar -->
				<div class="h-11 border-b border-border/40 bg-muted/40 px-4 flex items-center justify-between select-none">
					<div class="flex items-center gap-2">
						<span class="w-3 h-3 rounded-full bg-destructive/30"></span>
						<span class="w-3 h-3 rounded-full bg-yellow-500/30"></span>
						<span class="w-3 h-3 rounded-full bg-emerald-500/30"></span>
					</div>
					<div
						class="w-64 sm:w-80 h-6 bg-background/80 rounded-md border border-border/30 text-[10px] text-muted-foreground flex items-center justify-center gap-1 font-mono"
					>
						resumeforge.com/generate
					</div>
					<div class="w-12"></div>
				</div>

				<!-- Application Mockup Layout -->
				<div
					class="grid grid-cols-1 md:grid-cols-5 h-[calc(100%-2.75rem)] md:divide-x divide-border/40 bg-background/30 text-card-foreground"
				>
					<!-- Form Input Mockup -->
					<div class="hidden md:flex md:col-span-2 p-6 space-y-4 overflow-hidden flex-col justify-start">
						<div class="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
							<div class="w-1.5 h-1.5 rounded-full bg-primary"></div>
							<span>Profile Wizard</span>
						</div>
						<div class="space-y-1.5">
							<h3 class="text-sm font-semibold">Job Description</h3>
							<div
								class="w-full h-24 rounded-lg border border-border/50 bg-card/80 p-3 text-[11px] leading-relaxed text-muted-foreground font-mono overflow-hidden"
							>
								<span class="text-primary font-bold">Role:</span> Frontend Engineer<br />
								<span class="text-primary font-bold">Requirements:</span> React, TypeScript,
								Tailwind CSS, high-performance UI components, optimization.
							</div>
						</div>
						<div class="space-y-3 pt-2">
							<div class="space-y-1">
								<span class="text-[11px] font-medium text-muted-foreground">Full Name</span>
								<div class="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs">Alex Morgan</div>
							</div>
							<div class="space-y-1">
								<span class="text-[11px] font-medium text-muted-foreground">GitHub URL</span>
								<div
									class="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs text-primary font-mono truncate"
								>
									github.com/alexmorgan
								</div>
							</div>
							<div class="space-y-1">
								<span class="text-[11px] font-medium text-muted-foreground">Key Technical Project</span>
								<div class="h-8 rounded-lg border border-border/50 bg-card/60 px-3 flex items-center text-xs truncate">
									ResumeForge — AI resume builder
								</div>
							</div>
						</div>
					</div>

					<!-- Resume Output Mockup -->
					<div
						class="col-span-1 md:col-span-3 p-4 sm:p-6 bg-card/25 backdrop-blur-sm overflow-hidden flex flex-col relative justify-start"
					>
						<!-- ATS Score Indicator -->
						<div
							class="absolute top-4 right-4 sm:top-6 sm:right-6 bg-background/80 border border-border/50 shadow-sm rounded-xl px-3 py-1.5 flex items-center gap-2"
						>
							<div
								class="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary flex items-center justify-center font-bold text-xs text-primary"
							>
								94
							</div>
							<div class="text-[9px] leading-tight">
								<div class="font-semibold text-foreground">ATS Score</div>
								<div class="text-muted-foreground font-medium">Highly Optimized</div>
							</div>
						</div>

						<div
							class="max-w-md w-full border border-border/40 rounded-xl bg-card shadow-sm p-4 sm:p-5 relative overflow-hidden text-[10px] space-y-3.5"
						>
							<div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/10 via-primary/30 to-primary/10"></div>

							<!-- Name and title -->
							<div class="space-y-0.5">
								<div class="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
									Alex Morgan
									<span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Editable"></span>
								</div>
								<div class="text-primary font-medium text-[11px]">Frontend Engineer</div>
								<div class="flex flex-wrap items-center gap-x-2 text-[9px] text-muted-foreground/80 mt-1">
									<span class="flex items-center gap-0.5"><Github class="w-2.5 h-2.5" />github.com/alexmorgan</span>
									<span>•</span>
									<span class="flex items-center gap-0.5"><Linkedin class="w-2.5 h-2.5" />linkedin.com/in/alexmorgan</span>
								</div>
							</div>

							<!-- Summary -->
							<div class="space-y-1">
								<div class="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Summary</div>
								<p class="text-muted-foreground leading-relaxed text-[9px]">
									Results-driven Frontend Engineer with expertise in building responsive,
									high-performance web applications using
									<strong class="text-foreground font-semibold">React</strong> and
									<strong class="text-foreground font-semibold">TypeScript</strong>. Proven track
									record of improving web performance and maximizing accessibility.
								</p>
							</div>

							<!-- Experience -->
							<div class="space-y-2">
								<div class="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Experience</div>
								<div class="space-y-1">
									<div class="flex justify-between font-semibold">
										<span>Frontend Engineer @ TechForge</span>
										<span class="text-muted-foreground font-normal">2024 - Present</span>
									</div>
									<ul class="list-disc list-inside text-muted-foreground text-[9px] space-y-0.5 pl-0.5">
										<li>Developed responsive interfaces, increasing mobile conversion rates by 18%.</li>
										<li>Implemented robust TypeScript typing structures, reducing runtime errors by 24%.</li>
									</ul>
								</div>
							</div>

							<!-- Skills -->
							<div class="space-y-1.5">
								<div class="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Skills</div>
								<div class="flex flex-wrap gap-1">
									{#each ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Lighthouse', 'REST APIs'] as s}
										<span
											class="bg-secondary/60 text-secondary-foreground text-[8px] font-medium px-2 py-0.5 rounded-md border border-border/30"
										>
											{s}
										</span>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 3. Trusted by Students & Fresh Graduates -->
	<section class="w-full py-12 sm:py-20 bg-muted/20 border-y border-border/30 px-6">
		<div class="max-w-6xl mx-auto space-y-12">
			<div class="text-center space-y-3">
				<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
					Trusted by students and fresh graduates.
				</h2>
				<p class="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
					Helping candidates build professional resumes that stand out during recruiter screening.
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
				<Card class="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<CardHeader class="space-y-3 flex-1 pb-4">
						<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
							<GraduationCap class="w-5 h-5" />
						</div>
						<CardTitle class="text-2xl font-bold tracking-tight">12+ Universities</CardTitle>
						<CardDescription class="text-sm leading-relaxed text-muted-foreground font-normal">
							Students from leading universities have already built resumes using Resume Forge.
						</CardDescription>
					</CardHeader>
				</Card>

				<Card class="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<CardHeader class="space-y-3 flex-1 pb-2">
						<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
							<Target class="w-5 h-5" />
						</div>
						<CardTitle class="text-4xl font-extrabold tracking-tight text-primary">87%</CardTitle>
						<CardDescription class="text-sm leading-relaxed text-muted-foreground font-normal">
							Reached recruiter screening.
						</CardDescription>
					</CardHeader>
					<div class="px-6 pb-6 text-xs text-muted-foreground/70 font-medium italic border-t border-border/20 pt-3 mt-auto">
						Based on user feedback after submitting resumes generated with Resume Forge.
					</div>
				</Card>

				<Card class="border border-border/40 bg-card/50 backdrop-blur-sm rounded-2xl h-full flex flex-col transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<CardHeader class="space-y-3 flex-1 pb-4">
						<div class="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
							<FileText class="w-5 h-5" />
						</div>
						<CardTitle class="text-2xl font-bold tracking-tight">ATS Optimized</CardTitle>
						<CardDescription class="text-sm leading-relaxed text-muted-foreground font-normal">
							Built using recruiter-friendly resume structures to maximize Applicant Tracking System
							compatibility.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>

			<!-- Infinitely scrolling marquee -->
			<div class="relative w-full overflow-hidden py-4 mt-8 border-t border-border/10">
				<div
					class="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"
				></div>
				<div
					class="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"
				></div>

				<div class="animate-marquee flex gap-12 whitespace-nowrap text-sm font-semibold text-muted-foreground/60 select-none">
					{#each [...universities, ...universities] as uni, index (index)}
						<span class="flex items-center gap-2.5">
							<span class="w-1.5 h-1.5 rounded-full bg-primary/30"></span>
							{uni}
						</span>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Pricing -->
	<section id="pricing" class="w-full py-20 sm:py-24 px-6 relative scroll-mt-16">
		<div class="max-w-6xl mx-auto space-y-12">
			<div class="text-center space-y-3">
				<h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Simple pricing.</h2>
				<p class="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
					Start free. Upgrade whenever you're ready.
				</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
				<!-- FREE Tier -->
				<Card class="border border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<CardHeader class="space-y-1.5 p-6 pb-4">
						<div class="text-xs font-bold tracking-widest text-muted-foreground uppercase">FREE</div>
						<div class="flex items-baseline gap-1 mt-1">
							<span class="text-4xl font-extrabold text-foreground">$0</span>
							<span class="text-xs text-muted-foreground font-medium">forever</span>
						</div>
					</CardHeader>
					<CardContent class="p-6 pt-0 flex-1 flex flex-col justify-between">
						<ul class="space-y-3 text-xs text-muted-foreground font-medium mb-8">
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>3 resumes total</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>ATS-friendly resume</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>PDF Export</span></li>
						</ul>
						<Button href="/dashboard" variant="outline" class="w-full rounded-xl hover:scale-[1.01] transition-transform">
							Get Started
						</Button>
					</CardContent>
				</Card>

				<!-- STARTER Tier -->
				<Card class="border border-teal-500/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<CardHeader class="space-y-1.5 p-6 pb-4">
						<div class="text-xs font-bold tracking-widest text-teal-600 uppercase">STARTER</div>
						<div class="flex items-baseline gap-1 mt-1">
							<span class="text-4xl font-extrabold text-foreground">{formatPrice(priceForPlan('starter'))}</span>
							<span class="text-xs text-muted-foreground font-medium">/30 hari</span>
						</div>
					</CardHeader>
					<CardContent class="p-6 pt-0 flex-1 flex flex-col justify-between">
						<ul class="space-y-3 text-xs text-muted-foreground font-medium mb-8">
							<li class="flex items-center gap-2 text-foreground/90 font-semibold">
								<Check class="w-4 h-4 text-teal-500 shrink-0" /><span>4 resumes per day</span>
							</li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-teal-500 shrink-0" /><span>ATS-friendly resume</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-teal-500 shrink-0" /><span>PDF Export</span></li>
						</ul>
						<Button
							onclick={() => handleSubscribe('starter')}
							disabled={loadingCheckout !== null}
							variant="outline"
							class="w-full rounded-xl border-teal-500/50 text-teal-600 hover:bg-teal-500/5 hover:scale-[1.01] active:scale-[0.99] transition-all"
						>
							{loadingCheckout === 'starter'
								? 'Loading...'
								: user?.plan === 'starter'
									? 'Active Plan'
									: 'Get Starter'}
						</Button>
					</CardContent>
				</Card>

				<!-- PREMIUM Tier -->
				<Card class="border-2 border-primary bg-card/85 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative shadow-lg shadow-primary/5 w-full transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<div class="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-xl flex items-center gap-1">
						<Zap class="w-2.5 h-2.5 fill-current" />
						MOST POPULAR
					</div>
					<CardHeader class="space-y-1.5 p-6 pb-4">
						<div class="text-xs font-bold tracking-widest text-primary uppercase">PREMIUM</div>
						<div class="flex items-baseline gap-1 mt-1">
							<span class="text-4xl font-extrabold text-foreground">{formatPrice(priceForPlan('premium'))}</span>
							<span class="text-xs text-muted-foreground font-medium">/30 hari</span>
						</div>
					</CardHeader>
					<CardContent class="p-6 pt-0 flex-1 flex flex-col justify-between">
						<ul class="space-y-3 text-xs text-muted-foreground font-medium mb-8">
							<li class="flex items-center gap-2 text-foreground/90 font-semibold">
								<Check class="w-4 h-4 text-primary shrink-0" /><span>Unlimited generations</span>
							</li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Unlimited PDF export</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Resume history</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Priority support</span></li>
						</ul>
						<Button
							onclick={() => handleSubscribe('premium')}
							disabled={loadingCheckout !== null}
							class="w-full rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all"
						>
							{loadingCheckout === 'premium'
								? 'Loading...'
								: user?.plan === 'premium'
									? 'Active Plan'
									: 'Upgrade Now'}
						</Button>
					</CardContent>
				</Card>

				<!-- ANNUAL Tier -->
				<Card class="border border-border/40 bg-card/60 backdrop-blur-sm rounded-2xl h-full flex flex-col justify-between overflow-hidden relative w-full transition-all hover:-translate-y-1.5 hover:scale-[1.01] duration-200">
					<div
						class="absolute top-0 right-0 bg-secondary text-secondary-foreground border-l border-b border-border/40 text-[9px] font-bold tracking-wider uppercase px-3 py-1 rounded-bl-xl"
					>
						SAVE 32%
					</div>
					<CardHeader class="space-y-1.5 p-6 pb-3">
						<div class="text-xs font-bold tracking-widest text-muted-foreground uppercase">ANNUAL</div>
						<div class="flex items-baseline gap-1 mt-1">
							<span class="text-4xl font-extrabold text-foreground">{formatPrice(priceForPlan('annual'))}</span>
							<span class="text-xs text-muted-foreground font-medium">/365 hari</span>
						</div>
						<div class="flex flex-col text-[10px] text-primary/80 font-semibold pt-1">
							<span>Limited-time offer</span>
							<span class="text-muted-foreground/60 font-medium">Ends July 30, 2026</span>
						</div>
					</CardHeader>
					<CardContent class="p-6 pt-0 flex-1 flex flex-col justify-between">
						<ul class="space-y-3 text-xs text-muted-foreground font-medium mb-8">
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Everything in Premium</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Best value</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Pay once yearly</span></li>
							<li class="flex items-center gap-2"><Check class="w-4 h-4 text-primary shrink-0" /><span>Save 32%</span></li>
						</ul>
						<Button
							onclick={() => handleSubscribe('annual')}
							disabled={loadingCheckout !== null}
							variant="outline"
							class="w-full rounded-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
						>
							{loadingCheckout === 'annual'
								? 'Loading...'
								: user?.plan === 'annual'
									? 'Active Plan'
									: 'Choose Annual'}
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>

	<!-- 5. Footer -->
	<footer class="w-full border-t border-border/30 bg-muted/10 px-6 py-12 mt-auto">
		<div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
			<div class="md:col-span-2 space-y-4">
				<a href="/" class="flex items-center gap-2.5">
					<div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
						<Anvil class="w-4 h-4 text-primary-foreground" />
					</div>
					<span class="font-semibold text-sm tracking-tight">ResumeForge</span>
				</a>
				<p class="text-xs text-muted-foreground leading-relaxed max-w-sm">
					Build professional resumes powered by AI. Helping students and professionals create resumes
					that recruiters actually want to read.
				</p>
			</div>

			<div class="space-y-3">
				<span class="text-xs font-bold text-foreground uppercase tracking-widest">Product</span>
				<ul class="space-y-2 text-xs text-muted-foreground">
					<li><a href="#pricing" class="hover:text-primary transition-colors">Pricing</a></li>
					<li><a href="/dashboard" class="hover:text-primary transition-colors">Templates</a></li>
					<li><a href="/dashboard" class="hover:text-primary transition-colors">FAQ</a></li>
				</ul>
			</div>

			<div class="space-y-3">
				<span class="text-xs font-bold text-foreground uppercase tracking-widest">Company</span>
				<ul class="space-y-2 text-xs text-muted-foreground">
					<li><span class="hover:text-primary transition-colors cursor-not-allowed">Privacy Policy</span></li>
					<li><span class="hover:text-primary transition-colors cursor-not-allowed">Terms of Service</span></li>
					<li><span class="hover:text-primary transition-colors cursor-not-allowed">Contact</span></li>
				</ul>
			</div>
		</div>

		<div class="max-w-6xl mx-auto mt-12 pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
			<p class="text-xs text-muted-foreground/60">© 2026 Resume Forge. All rights reserved.</p>
		</div>
	</footer>
</div>