<script lang="ts">
	import { page } from '$app/stores';
	import {
		LogOut,
		FileText,
		Shield,
		TrendingUp,
		Zap,
		Sparkles,
		Crown,
		CheckCircle2,
		XCircle,
		ChevronRight
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardDescription from '$lib/components/ui/CardDescription.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import { signOut } from '$lib/auth';
	import { trackClick } from '$lib/track';
	import PlanBadge from './PlanBadge.svelte';
	import UsageMeter from './UsageMeter.svelte';

	let {
		onUpgrade,
		onCancelRequest
	}: {
		onUpgrade: (plan: 'starter' | 'premium' | 'annual') => void;
		onCancelRequest: () => void;
	} = $props();

	const data = $derived($page.data.dashboardData ?? null);
	const isPremium = $derived(!!data?.isPremium);
	const isStarter = $derived(!!data?.isStarter);

	function dateLabel(value: string | null): string {
		if (!value) return 'Subscription is active';
		return `Active until ${new Date(value).toLocaleDateString('id-ID', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		})}`;
	}
</script>

{#if !data}
	<div class="flex flex-col items-center justify-center py-20 gap-3">
		<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
		<p class="text-sm text-muted-foreground">Loading your dashboard…</p>
	</div>
{:else}
	<div class="motion-fade-up space-y-6">
		<!-- Welcome Row -->
		<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
			{#if data.image}
				<img
					src={data.image}
					alt={data.name}
					class="w-14 h-14 rounded-2xl border-2 border-border shadow-sm object-cover"
				/>
			{/if}
			<div class="flex-1 min-w-0">
				<div class="flex flex-wrap items-center gap-2 mb-0.5">
					<h2 class="text-xl font-bold text-foreground truncate">
						Welcome back, {data.name?.split(' ')[0] ?? 'there'} 👋
					</h2>
					<PlanBadge plan={data.plan} />
				</div>
				<p class="text-sm text-muted-foreground truncate">{data.email}</p>
			</div>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => signOut()}
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
			>
				<LogOut class="w-3.5 h-3.5" />
				Sign Out
			</Button>
		</div>

		<!-- Stats Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
			<Card class="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
				<CardContent class="p-5 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							CVs Generated
						</span>
						<div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
							<FileText class="w-4 h-4 text-primary" />
						</div>
					</div>
					<div class="text-4xl font-extrabold text-foreground tabular-nums">{data.resumesGenerated}</div>
					<p class="text-xs text-muted-foreground">Total resumes generated</p>
				</CardContent>
			</Card>

			<Card class="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
				<CardContent class="p-5 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Current Plan
						</span>
						<div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
							<Shield class="w-4 h-4 text-primary" />
						</div>
					</div>
					<div class="text-2xl font-extrabold text-foreground capitalize">{data.plan}</div>
					<PlanBadge plan={data.plan} />
				</CardContent>
			</Card>

			<Card class="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
				<CardContent class="p-5 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Subscription
						</span>
						<div class="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
							<TrendingUp class="w-4 h-4 text-primary" />
						</div>
					</div>
					<div class={`text-2xl font-extrabold ${data.hasSubscription ? 'text-emerald-600' : 'text-foreground'}`}>
						{data.hasSubscription ? 'Active' : '–'}
					</div>
					<p class="text-xs text-muted-foreground">
						{data.hasSubscription ? dateLabel(data.planExpiresAt) : 'No active subscription'}
					</p>
				</CardContent>
			</Card>
		</div>

		<!-- Usage Meter -->
		<Card class="border border-border/50 bg-card/60 backdrop-blur-sm rounded-2xl">
			<CardHeader class="pb-3">
				<CardTitle class="text-sm font-semibold flex items-center gap-2">
					<Zap class="w-4 h-4 text-primary" />
					Generation Usage
				</CardTitle>
				<CardDescription class="text-xs">
					{isStarter
						? 'Daily AI CV generations (resets midnight UTC)'
						: "Track how many AI CV generations you've used"}
				</CardDescription>
			</CardHeader>
			<CardContent class="pt-0">
				<UsageMeter
					used={isStarter ? data.dailyUsed : data.resumesGenerated}
					limit={isPremium ? null : isStarter ? 4 : 3}
					period={isStarter ? 'daily' : 'total'}
				/>
			</CardContent>
		</Card>

		<!-- Starter active + manage subscription -->
		{#if isStarter}
			<Card class="border border-teal-500/30 bg-teal-500/5 rounded-2xl overflow-hidden">
				<CardContent class="p-5">
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div class="flex items-center gap-3 flex-1">
							<div class="w-10 h-10 rounded-xl bg-teal-500/15 flex items-center justify-center shrink-0">
								<CheckCircle2 class="w-5 h-5 text-teal-600" />
							</div>
							<div>
								<p class="font-semibold text-foreground text-sm">Starter Plan Active</p>
								<p class="text-xs text-muted-foreground">
									4 CV generations per day — resets at midnight UTC
								</p>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<Button
								onclick={() => onUpgrade('premium')}
								size="sm"
								class="rounded-xl text-xs gap-1.5"
							>
								<Crown class="w-3 h-3" />
								Upgrade to Premium
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={onCancelRequest}
								class="rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50 transition-all"
							>
								<XCircle class="w-3.5 h-3.5 mr-1.5" />
								Cancel
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Premium active + manage subscription -->
		{#if isPremium}
			<Card class="border border-emerald-500/30 bg-emerald-500/5 rounded-2xl overflow-hidden">
				<CardContent class="p-5">
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
						<div class="flex items-center gap-3 flex-1">
							<div class="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
								<CheckCircle2 class="w-5 h-5 text-emerald-600" />
							</div>
							<div>
								<p class="font-semibold text-foreground text-sm">
									{data.plan === 'annual' ? 'Annual' : 'Premium'} Plan Active
								</p>
								<p class="text-xs text-muted-foreground">Unlimited resume generations — enjoy!</p>
							</div>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<Button
								variant="outline"
								size="sm"
								onclick={onCancelRequest}
								class="rounded-xl text-xs border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/50 transition-all"
							>
								<XCircle class="w-3.5 h-3.5 mr-1.5" />
								Cancel Subscription
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Upgrade CTA — free users only -->
		{#if !isPremium && !isStarter}
			<Card class="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl overflow-hidden relative">
				<div class="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
				<CardContent class="p-6">
					<div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
						<div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
							<Crown class="w-6 h-6 text-primary" />
						</div>
						<div class="flex-1 space-y-1">
							<h3 class="font-bold text-foreground">Unlock more generations</h3>
							<p class="text-sm text-muted-foreground">
								You're on the free plan ({data.resumesGenerated}/3 used). Upgrade for more daily
								CV generations or go unlimited with Premium.
							</p>
						</div>
						<div class="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
							<Button
								onclick={() => onUpgrade('starter')}
								variant="outline"
								class="w-full sm:w-auto gap-2 rounded-xl border-teal-500/50 text-teal-600 hover:bg-teal-500/5 transition-all text-xs"
							>
								<Zap class="w-3.5 h-3.5" />
								Starter — $1/mo · 4/day
							</Button>
							<Button
								onclick={() => onUpgrade('premium')}
								class="w-full sm:w-auto gap-2 rounded-xl shadow-md shadow-primary/15 hover:scale-[1.02] active:scale-[0.98] transition-all"
							>
								<Sparkles class="w-3.5 h-3.5" />
								Premium — $5/mo · Unlimited
							</Button>
							<Button
								variant="outline"
								onclick={() => onUpgrade('annual')}
								class="w-full sm:w-auto gap-2 rounded-xl hover:bg-secondary/40 transition-all text-xs"
							>
								Annual — $25/yr
								<span class="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
									SAVE 60%
								</span>
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- Quick Actions -->
		<div>
			<h3 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
				Quick Actions
			</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
				<a
					href="/dashboard"
					onclick={() => trackClick('tab_generate')}
					class="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group text-left"
				>
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<Sparkles class="w-4 h-4 text-primary" />
						</div>
						<div>
							<p class="text-sm font-semibold text-foreground">Generate Resume</p>
							<p class="text-xs text-muted-foreground">Create a new AI-tailored CV</p>
						</div>
					</div>
					<ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</a>

				<a
					href="/#pricing"
					class="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/30 transition-all group text-left"
				>
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<Crown class="w-4 h-4 text-primary" />
						</div>
						<div>
							<p class="text-sm font-semibold text-foreground">View Plans</p>
							<p class="text-xs text-muted-foreground">Explore upgrade options</p>
						</div>
					</div>
					<ChevronRight class="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
				</a>
			</div>
		</div>
	</div>
{/if}