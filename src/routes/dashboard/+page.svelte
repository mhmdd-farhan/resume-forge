<script lang="ts">
	import { page } from '$app/stores';
	import { Anvil, Sparkles, LayoutDashboard, AlertCircle, X } from 'lucide-svelte';
	import { GeneratorTab } from './GeneratorTab.svelte';
	import { DashboardTab } from './DashboardTab.svelte';
	import { CancelModal } from './CancelModal.svelte';
	import { trackClick } from '$lib/track';

	type Tab = 'generate' | 'dashboard';

	let activeTab = $state<Tab>('generate');
	let showCancelModal = $state(false);
	let cancelError = $state<string | null>(null);

	const user = $derived($page.data.user);

	async function handleUpgrade(plan: 'starter' | 'premium' | 'annual') {
		if (!user) return;
		trackClick(`subscribe_${plan}`);
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ planType: plan })
			});
			const data = await res.json();
			if (data.url) {
				window.location.href = data.url;
			} else {
				alert(data.error || 'Failed to create checkout session');
			}
		} catch {
			alert('Error starting checkout. Please try again.');
		}
	}

	function openCancel() {
		cancelError = null;
		showCancelModal = true;
	}

	const tabs = [
		{ id: 'generate' as Tab, label: 'Generate', icon: Sparkles },
		{ id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard }
	];
</script>

<svelte:head>
	<title>Dashboard | ResumeForge</title>
</svelte:head>

{#if showCancelModal}
	<CancelModal onClose={() => (showCancelModal = false)} onError={(m) => (cancelError = m)} />
{/if}

<main class="min-h-screen flex flex-col">
	<!-- Header -->
	<header class="w-full border-b border-border/40 backdrop-blur-md bg-background/70 sticky top-0 z-50">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5 group">
				<div
					class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-200"
				>
					<Anvil class="w-4 h-4 text-primary-foreground" />
				</div>
				<span class="font-semibold text-sm tracking-tight">ResumeForge</span>
			</a>

			<!-- Tab Pills -->
			<div class="flex items-center bg-secondary/50 rounded-xl p-1 gap-0.5 border border-border/30">
				{#each tabs as tab}
					{@const Icon = tab.icon}
					<button
						type="button"
						id={`tab-${tab.id}`}
						onclick={() => {
							activeTab = tab.id;
							trackClick(`tab_${tab.id}`);
						}}
						class={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
							activeTab === tab.id
								? 'bg-background text-foreground shadow-sm border border-border/30'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						<Icon class="w-4 h-4" />
						{tab.label}
					</button>
				{/each}
			</div>

			<!-- User info -->
			<div class="flex items-center gap-3">
				<span
					class="hidden sm:inline-flex items-center gap-1 text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
				>
					{user?.plan || 'free'}
				</span>
				{#if user?.image}
					<img
						src={user.image}
						alt={user.name || 'User'}
						class="w-7 h-7 rounded-full border border-border shadow-sm"
					/>
				{/if}
			</div>
		</div>
	</header>

	<!-- Toasts -->
	{#if cancelError}
		<div
			class="fixed top-16 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg"
		>
			<AlertCircle class="w-4 h-4" />
			{cancelError}
			<button type="button" onclick={() => (cancelError = null)} class="ml-2 opacity-60 hover:opacity-100">
				<X class="w-3.5 h-3.5" />
			</button>
		</div>
	{/if}

	<!-- Main content -->
	<div class="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{#if activeTab === 'generate'}
			<GeneratorTab />
		{:else}
			<DashboardTab onUpgrade={handleUpgrade} onCancelRequest={openCancel} />
		{/if}
	</div>

	<!-- Footer -->
	<footer class="w-full border-t border-border/30 py-4">
		<div class="max-w-5xl mx-auto px-6 flex items-center justify-center">
			<p class="text-xs text-muted-foreground/60">Built with AI. Your resume data is never stored.</p>
		</div>
	</footer>
</main>