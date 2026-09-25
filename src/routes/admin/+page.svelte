<script lang="ts">
	import type { PageData } from './$types';
	import {
		Users,
		FileText,
		Crown,
		Star,
		TrendingUp,
		Activity,
		BarChart3,
		Zap,
		MousePointerClick,
		Eye
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const stats = $derived(data.stats);

	const maxPv = $derived(Math.max(...stats.series.map((d) => d.pageViews), 1));
	const maxCl = $derived(Math.max(...stats.series.map((d) => d.clicks), 1));

	const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
		free: { label: 'Free', color: 'text-muted-foreground', bg: 'bg-secondary/60' },
		starter: { label: 'Starter', color: 'text-teal-600', bg: 'bg-teal-500/10' },
		premium: { label: 'Premium', color: 'text-primary', bg: 'bg-primary/10' },
		annual: { label: 'Annual', color: 'text-amber-600', bg: 'bg-amber-500/10' }
	};

	const CLICK_LABELS: Record<string, string> = {
		generate_resume: 'Generate Resume',
		download_pdf: 'Download PDF',
		regenerate_resume: 'Regenerate',
		cta_generate_hero: 'Hero CTA',
		subscribe_premium: 'Subscribe Premium',
		subscribe_annual: 'Subscribe Annual',
		tab_generate: 'Tab: Generate',
		tab_dashboard: 'Tab: Dashboard'
	};

	const statCards = $derived([
		{
			label: 'Total Users',
			value: stats.totalUsers,
			icon: Users,
			color: 'text-primary',
			bg: 'bg-primary/10',
			sub: `${stats.freeUsers} free`
		},
		{
			label: 'Subscribers',
			value: stats.activeSubscribers,
			icon: Crown,
			color: 'text-amber-600',
			bg: 'bg-amber-500/10',
			sub: `${stats.starterUsers} starter · ${stats.premiumUsers} premium · ${stats.annualUsers} annual`
		},
		{
			label: 'Resumes Made',
			value: stats.totalResumes,
			icon: FileText,
			color: 'text-emerald-600',
			bg: 'bg-emerald-500/10',
			sub: `${stats.totalUsers > 0 ? (stats.totalResumes / stats.totalUsers).toFixed(1) : 0} avg/user`
		},
		{
			label: 'Conversion',
			value:
				stats.totalUsers > 0
					? `${((stats.activeSubscribers / stats.totalUsers) * 100).toFixed(1)}%`
					: '0%',
			icon: TrendingUp,
			color: 'text-violet-600',
			bg: 'bg-violet-500/10',
			sub: `${stats.activeSubscribers} paid of ${stats.totalUsers}`
		}
	]);

	const trafficCards = $derived([
		{
			label: 'Total Page Views',
			value: stats.totalPageViews,
			icon: Eye,
			color: 'text-sky-600',
			bg: 'bg-sky-500/10',
			sub: 'All time'
		},
		{
			label: 'Total Clicks',
			value: stats.totalClicks,
			icon: MousePointerClick,
			color: 'text-pink-600',
			bg: 'bg-pink-500/10',
			sub: 'Tracked actions'
		}
	]);

	const planRows = $derived([
		{
			plan: 'free',
			count: stats.freeUsers,
			icon: Activity,
			bar: 'bg-muted-foreground/40'
		},
		{ plan: 'starter', count: stats.starterUsers, icon: Zap, bar: 'bg-teal-500' },
		{ plan: 'premium', count: stats.premiumUsers, icon: Crown, bar: 'bg-primary' },
		{ plan: 'annual', count: stats.annualUsers, icon: Star, bar: 'bg-amber-500' }
	]);

	function activeUntil(u: { plan: string; planExpiresAt: Date | string | null }): boolean {
		const exp = u.planExpiresAt ? new Date(u.planExpiresAt).getTime() : 0;
		return u.plan !== 'free' && exp > Date.now();
	}
</script>

<svelte:head>
	<title>Admin | ResumeForge</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<!-- Header -->
	<header class="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-10">
		<div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
			<div class="flex items-center gap-2.5">
				<div class="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
					<Zap class="w-3.5 h-3.5 text-primary-foreground" />
				</div>
				<span class="font-semibold text-sm">ResumeForge Admin</span>
			</div>
			<span
				class="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-secondary/50 border border-border/30"
			>
				Owner Dashboard
			</span>
		</div>
	</header>

	<main class="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
		<div class="space-y-1">
			<h1 class="text-2xl font-bold tracking-tight">Overview</h1>
			<p class="text-sm text-muted-foreground">Live stats — refreshes on each page load.</p>
		</div>

		<!-- Top stat cards -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			{#each statCards as c}
				{@const Icon = c.icon}
				<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 sm:p-5 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>{c.label}</span
						>
						<div class={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
							<Icon class={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.color}`} />
						</div>
					</div>
					<div class={`text-2xl sm:text-3xl font-extrabold tabular-nums ${c.color}`}>{c.value}</div>
					<p class="text-[10px] sm:text-xs text-muted-foreground">{c.sub}</p>
				</div>
			{/each}
		</div>

		<!-- Traffic stat cards -->
		<div class="grid grid-cols-2 gap-4">
			{#each trafficCards as c}
				{@const Icon = c.icon}
				<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 sm:p-5 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground"
							>{c.label}</span
						>
						<div class={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
							<Icon class={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.color}`} />
						</div>
					</div>
					<div class={`text-2xl sm:text-3xl font-extrabold tabular-nums ${c.color}`}>{c.value}</div>
					<p class="text-[10px] sm:text-xs text-muted-foreground">{c.sub}</p>
				</div>
			{/each}
		</div>

		<!-- 7-day chart -->
		<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-5">
			<div class="flex items-center gap-2">
				<Activity class="w-4 h-4 text-primary" />
				<h2 class="text-sm font-semibold">Last 7 Days</h2>
				<div class="flex items-center gap-3 ml-auto text-[10px] text-muted-foreground">
					<span class="flex items-center gap-1"
						><span class="w-2 h-2 rounded-full bg-sky-500 inline-block" />Page Views</span
					>
					<span class="flex items-center gap-1"
						><span class="w-2 h-2 rounded-full bg-pink-500 inline-block" />Clicks</span
					>
				</div>
			</div>
			<div class="overflow-x-auto">
				<div class="flex items-end gap-2 min-w-[400px] h-28">
					{#each stats.series as day (day.date)}
						<div class="flex-1 flex flex-col items-center gap-1">
							<div class="w-full flex items-end gap-0.5 h-20">
								<div
									class="flex-1 bg-sky-500/70 rounded-t-sm transition-all"
									style:height={`${(day.pageViews / maxPv) * 100}%`}
									style:min-height={day.pageViews > 0 ? '4px' : '0'}
									title={`${day.pageViews} views`}
								/>
								<div
									class="flex-1 bg-pink-500/70 rounded-t-sm transition-all"
									style:height={`${(day.clicks / maxCl) * 100}%`}
									style:min-height={day.clicks > 0 ? '4px' : '0'}
									title={`${day.clicks} clicks`}
								/>
							</div>
							<span class="text-[8px] text-muted-foreground text-center leading-tight"
								>{day.label.split(',')[0]}</span
							>
							<span class="text-[8px] text-muted-foreground/60"
								>{day.label.split(',')[1]?.trim()}</span
							>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Top pages + Top clicks -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
				<div class="flex items-center gap-2">
					<Eye class="w-4 h-4 text-sky-600" />
					<h2 class="text-sm font-semibold">Top Pages</h2>
				</div>
				{#if stats.topPages.length === 0}
					<p class="text-xs text-muted-foreground py-4 text-center">No page views yet.</p>
				{:else}
					<div class="space-y-2">
						{#each stats.topPages as p, i (p.path)}
							{@const count = p._count.path}
							{@const max = stats.topPages[0]._count.path}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium text-foreground truncate max-w-[160px]">{p.path || '/'}</span>
									<span class="tabular-nums font-semibold text-sky-600">{count}</span>
								</div>
								<div class="w-full h-1 bg-secondary rounded-full overflow-hidden">
									<div
										class="h-full bg-sky-500/60 rounded-full"
										style:width={`${(count / max) * 100}%`}
									/>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
				<div class="flex items-center gap-2">
					<MousePointerClick class="w-4 h-4 text-pink-600" />
					<h2 class="text-sm font-semibold">Top Click Events</h2>
				</div>
				{#if stats.topClicks.length === 0}
					<p class="text-xs text-muted-foreground py-4 text-center">No click events yet.</p>
				{:else}
					<div class="space-y-2">
						{#each stats.topClicks as c, i (c.event)}
							{@const count = c._count.event}
							{@const max = stats.topClicks[0]._count.event}
							<div class="space-y-1">
								<div class="flex items-center justify-between text-xs">
									<span class="font-medium text-foreground truncate max-w-[160px]"
										>{CLICK_LABELS[c.event] ?? c.event}</span
									>
									<span class="tabular-nums font-semibold text-pink-600">{count}</span>
								</div>
								<div class="w-full h-1 bg-secondary rounded-full overflow-hidden">
									<div
										class="h-full bg-pink-500/60 rounded-full"
										style:width={`${(count / max) * 100}%`}
									/>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Plan breakdown + Top generators -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
				<div class="flex items-center gap-2">
					<BarChart3 class="w-4 h-4 text-primary" />
					<h2 class="text-sm font-semibold">Plan Distribution</h2>
				</div>
				<div class="space-y-3">
					{#each planRows as row}
						{@const cfg = PLAN_CONFIG[row.plan]}
						{@const Icon = row.icon}
						{@const pct = stats.totalUsers > 0 ? (row.count / stats.totalUsers) * 100 : 0}
						<div class="space-y-1.5">
							<div class="flex items-center justify-between text-xs">
								<span class={`flex items-center gap-1.5 font-medium ${cfg.color}`}>
									<Icon class="w-3.5 h-3.5" />{cfg.label}
								</span>
								<span class="tabular-nums font-semibold text-foreground">
									{row.count}
									<span class="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
								</span>
							</div>
							<div class="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
								<div class={`h-full rounded-full ${row.bar}`} style:width={`${pct}%`} />
							</div>
						</div>
					{/each}
				</div>
			</div>

			<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
				<div class="flex items-center gap-2">
					<FileText class="w-4 h-4 text-emerald-600" />
					<h2 class="text-sm font-semibold">Top Generators</h2>
				</div>
				{#if stats.topGenerators.length === 0}
					<p class="text-xs text-muted-foreground py-4 text-center">No resumes generated yet.</p>
				{:else}
					<div class="space-y-2">
						{#each stats.topGenerators as u, i (i)}
							{@const cfg = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free}
							<div class="flex items-center justify-between gap-3">
								<div class="flex items-center gap-2.5 min-w-0">
									<span class="text-xs text-muted-foreground/60 w-4 shrink-0 tabular-nums"
										>{i + 1}.</span
									>
									<div class="min-w-0">
										<p class="text-xs font-medium text-foreground truncate">{u.name ?? 'Anonymous'}</p>
										<p class="text-[10px] text-muted-foreground truncate">{u.email}</p>
									</div>
								</div>
								<div class="flex items-center gap-2 shrink-0">
									<span class={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}
										>{cfg.label}</span
									>
									<span class="text-xs font-bold text-emerald-600 tabular-nums"
										>{u.resumesGenerated}</span
									>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent users -->
		<div class="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Users class="w-4 h-4 text-primary" />
					<h2 class="text-sm font-semibold">Recent Users</h2>
				</div>
				<span class="text-xs text-muted-foreground">{stats.recentUsers.length} latest</span>
			</div>
			<div class="overflow-x-auto -mx-5 px-5">
				<table class="w-full text-xs min-w-[520px]">
					<thead>
						<tr class="border-b border-border/30">
							{#each ['User', 'Plan', 'Resumes', 'Subscription'] as h, i (h)}
								<th
									class={`pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] ${
										i > 0 ? 'text-right' : 'text-left'
									}`}
								>
									{h}
								</th>
							{/each}
						</tr>
					</thead>
					<tbody class="divide-y divide-border/20">
						{#each stats.recentUsers as u (u.id)}
							{@const cfg = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free}
							<tr>
								<td class="py-2.5 pr-4">
									<p class="font-medium text-foreground">{u.name ?? '—'}</p>
									<p class="text-[10px] text-muted-foreground">{u.email}</p>
								</td>
								<td class="py-2.5 pr-4 text-right">
									<span
										class={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}
										>{cfg.label}</span
									>
								</td>
								<td class="py-2.5 pr-4 text-right tabular-nums font-semibold text-foreground"
									>{u.resumesGenerated}</td
								>
								<td class="py-2.5 text-right">
									{#if activeUntil(u)}
										<span class="text-emerald-600 font-medium">Active</span>
									{:else}
										<span class="text-muted-foreground/50">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</main>
</div>