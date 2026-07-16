import { prisma } from "@/lib/prisma";
import { Users, FileText, Crown, Star, TrendingUp, Activity, BarChart3, Zap, MousePointerClick, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

function startOfDayUtc(daysAgo: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function getStats() {
  const sevenDaysAgo = startOfDayUtc(6);
  const today = startOfDayUtc(0);

  const [
    totalUsers,
    premiumUsers,
    annualUsers,
    resumeAgg,
    topGenerators,
    recentUsers,
    totalPageViews,
    totalClicks,
    topPages,
    topClicks,
    dailyPageViews,
    dailyClicks,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "premium" } }),
    prisma.user.count({ where: { plan: "annual" } }),
    prisma.user.aggregate({ _sum: { resumesGenerated: true } }),
    prisma.user.findMany({
      where: { resumesGenerated: { gt: 0 } },
      orderBy: { resumesGenerated: "desc" },
      take: 5,
      select: { name: true, email: true, plan: true, resumesGenerated: true },
    }),
    prisma.user.findMany({
      orderBy: { id: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, plan: true, resumesGenerated: true, polarSubscriptionId: true },
    }),
    prisma.pageView.count(),
    prisma.clickEvent.count(),
    prisma.pageView.groupBy({
      by: ["path"],
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 6,
    }),
    prisma.clickEvent.groupBy({
      by: ["event"],
      _count: { event: true },
      orderBy: { _count: { event: "desc" } },
      take: 8,
    }),
    // Daily page views last 7 days
    prisma.pageView.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
    prisma.clickEvent.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true },
    }),
  ]);

  const freeUsers = totalUsers - premiumUsers - annualUsers;
  const activeSubscribers = premiumUsers + annualUsers;
  const totalResumes = resumeAgg._sum.resumesGenerated ?? 0;

  // Build 7-day series
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() + i - 6);
    return d.toISOString().slice(0, 10);
  });

  const pvByDay: Record<string, number> = {};
  const clickByDay: Record<string, number> = {};
  days.forEach((d) => { pvByDay[d] = 0; clickByDay[d] = 0; });

  dailyPageViews.forEach((pv) => {
    const key = new Date(pv.createdAt).toISOString().slice(0, 10);
    if (pvByDay[key] !== undefined) pvByDay[key]++;
  });
  dailyClicks.forEach((c) => {
    const key = new Date(c.createdAt).toISOString().slice(0, 10);
    if (clickByDay[key] !== undefined) clickByDay[key]++;
  });

  const series = days.map((d) => ({
    date: d,
    label: new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
    pageViews: pvByDay[d],
    clicks: clickByDay[d],
  }));

  return {
    totalUsers, freeUsers, premiumUsers, annualUsers, activeSubscribers,
    totalResumes, topGenerators, recentUsers,
    totalPageViews, totalClicks,
    topPages, topClicks, series,
  };
}

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: "Free", color: "text-muted-foreground", bg: "bg-secondary/60" },
  premium: { label: "Premium", color: "text-primary", bg: "bg-primary/10" },
  annual: { label: "Annual", color: "text-amber-600", bg: "bg-amber-500/10" },
};

const CLICK_LABELS: Record<string, string> = {
  generate_resume: "Generate Resume",
  download_pdf: "Download PDF",
  regenerate_resume: "Regenerate",
  cta_generate_hero: "Hero CTA",
  subscribe_premium: "Subscribe Premium",
  subscribe_annual: "Subscribe Annual",
  tab_generate: "Tab: Generate",
  tab_dashboard: "Tab: Dashboard",
};

export default async function AdminPage() {
  const s = await getStats();

  const maxPv = Math.max(...s.series.map((d) => d.pageViews), 1);
  const maxCl = Math.max(...s.series.map((d) => d.clicks), 1);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">ResumeForge Admin</span>
          </div>
          <span className="text-xs text-muted-foreground px-2.5 py-1 rounded-full bg-secondary/50 border border-border/30">
            Owner Dashboard
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Live stats — refreshes on each page load.</p>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: s.totalUsers, icon: Users, color: "text-primary", bg: "bg-primary/10", sub: `${s.freeUsers} free` },
            { label: "Subscribers", value: s.activeSubscribers, icon: Crown, color: "text-amber-600", bg: "bg-amber-500/10", sub: `${s.premiumUsers} premium · ${s.annualUsers} annual` },
            { label: "Resumes Made", value: s.totalResumes, icon: FileText, color: "text-emerald-600", bg: "bg-emerald-500/10", sub: `${s.totalUsers > 0 ? (s.totalResumes / s.totalUsers).toFixed(1) : 0} avg/user` },
            { label: "Conversion", value: s.totalUsers > 0 ? `${((s.activeSubscribers / s.totalUsers) * 100).toFixed(1)}%` : "0%", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-500/10", sub: `${s.activeSubscribers} paid of ${s.totalUsers}` },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.color}`} />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${c.color}`}>{c.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Traffic stat cards */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Total Page Views", value: s.totalPageViews, icon: Eye, color: "text-sky-600", bg: "bg-sky-500/10", sub: "All time" },
            { label: "Total Clicks", value: s.totalClicks, icon: MousePointerClick, color: "text-pink-600", bg: "bg-pink-500/10", sub: "Tracked actions" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                  <c.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${c.color}`} />
                </div>
              </div>
              <div className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${c.color}`}>{c.value}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* 7-day chart */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">Last 7 Days</h2>
            <div className="flex items-center gap-3 ml-auto text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />Page Views</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-pink-500 inline-block" />Clicks</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-2 min-w-[400px] h-28">
              {s.series.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex items-end gap-0.5 h-20">
                    <div
                      className="flex-1 bg-sky-500/70 rounded-t-sm transition-all"
                      style={{ height: `${(day.pageViews / maxPv) * 100}%`, minHeight: day.pageViews > 0 ? "4px" : "0" }}
                      title={`${day.pageViews} views`}
                    />
                    <div
                      className="flex-1 bg-pink-500/70 rounded-t-sm transition-all"
                      style={{ height: `${(day.clicks / maxCl) * 100}%`, minHeight: day.clicks > 0 ? "4px" : "0" }}
                      title={`${day.clicks} clicks`}
                    />
                  </div>
                  <span className="text-[8px] text-muted-foreground text-center leading-tight">{day.label.split(",")[0]}</span>
                  <span className="text-[8px] text-muted-foreground/60">{day.label.split(",")[1]?.trim()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top pages + Top clicks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-600" />
              <h2 className="text-sm font-semibold">Top Pages</h2>
            </div>
            {s.topPages.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No page views yet.</p>
            ) : (
              <div className="space-y-2">
                {s.topPages.map((p) => {
                  const count = p._count.path;
                  const max = s.topPages[0]._count.path;
                  return (
                    <div key={p.path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[160px]">{p.path || "/"}</span>
                        <span className="tabular-nums font-semibold text-sky-600">{count}</span>
                      </div>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500/60 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-pink-600" />
              <h2 className="text-sm font-semibold">Top Click Events</h2>
            </div>
            {s.topClicks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No click events yet.</p>
            ) : (
              <div className="space-y-2">
                {s.topClicks.map((c) => {
                  const count = c._count.event;
                  const max = s.topClicks[0]._count.event;
                  return (
                    <div key={c.event} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground truncate max-w-[160px]">
                          {CLICK_LABELS[c.event] ?? c.event}
                        </span>
                        <span className="tabular-nums font-semibold text-pink-600">{count}</span>
                      </div>
                      <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-pink-500/60 rounded-full" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Plan breakdown + Top generators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Plan Distribution</h2>
            </div>
            <div className="space-y-3">
              {[
                { plan: "free", count: s.freeUsers, icon: Activity },
                { plan: "premium", count: s.premiumUsers, icon: Crown },
                { plan: "annual", count: s.annualUsers, icon: Star },
              ].map(({ plan, count, icon: Icon }) => {
                const cfg = PLAN_CONFIG[plan];
                const pct = s.totalUsers > 0 ? (count / s.totalUsers) * 100 : 0;
                return (
                  <div key={plan} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1.5 font-medium ${cfg.color}`}>
                        <Icon className="w-3.5 h-3.5" />{cfg.label}
                      </span>
                      <span className="tabular-nums font-semibold text-foreground">
                        {count} <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${plan === "free" ? "bg-muted-foreground/40" : plan === "premium" ? "bg-primary" : "bg-amber-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-semibold">Top Generators</h2>
            </div>
            {s.topGenerators.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No resumes generated yet.</p>
            ) : (
              <div className="space-y-2">
                {s.topGenerators.map((u, i) => {
                  const cfg = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free;
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs text-muted-foreground/60 w-4 shrink-0 tabular-nums">{i + 1}.</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{u.name ?? "Anonymous"}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs font-bold text-emerald-600 tabular-nums">{u.resumesGenerated}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent users */}
        <div className="rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">Recent Users</h2>
            </div>
            <span className="text-xs text-muted-foreground">{s.recentUsers.length} latest</span>
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="border-b border-border/30">
                  {["User", "Plan", "Resumes", "Subscription"].map((h, i) => (
                    <th key={h} className={`pb-2.5 font-semibold text-muted-foreground uppercase tracking-wider text-[10px] ${i > 0 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {s.recentUsers.map((u) => {
                  const cfg = PLAN_CONFIG[u.plan] ?? PLAN_CONFIG.free;
                  return (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-foreground">{u.name ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-2.5 pr-4 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-right tabular-nums font-semibold text-foreground">{u.resumesGenerated}</td>
                      <td className="py-2.5 text-right">
                        {u.polarSubscriptionId ? <span className="text-emerald-600 font-medium">Active</span> : <span className="text-muted-foreground/50">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
