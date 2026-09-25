import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

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
		starterUsers,
		resumeAgg,
		topGenerators,
		recentUsers,
		totalPageViews,
		totalClicks,
		topPages,
		topClicks,
		dailyPageViews,
		dailyClicks
	] = await Promise.all([
		prisma.user.count(),
		prisma.user.count({ where: { plan: 'premium' } }),
		prisma.user.count({ where: { plan: 'annual' } }),
		prisma.user.count({ where: { plan: 'starter' } }),
		prisma.user.aggregate({ _sum: { resumesGenerated: true } }),
		prisma.user.findMany({
			where: { resumesGenerated: { gt: 0 } },
			orderBy: { resumesGenerated: 'desc' },
			take: 5,
			select: { name: true, email: true, plan: true, resumesGenerated: true }
		}),
		prisma.user.findMany({
			orderBy: { id: 'desc' },
			take: 10,
			select: {
				id: true,
				name: true,
				email: true,
				plan: true,
				planExpiresAt: true,
				resumesGenerated: true,
				midtransOrderId: true
			}
		}),
		prisma.pageView.count(),
		prisma.clickEvent.count(),
		prisma.pageView.groupBy({
			by: ['path'],
			_count: { path: true },
			orderBy: { _count: { path: 'desc' } },
			take: 6
		}),
		prisma.clickEvent.groupBy({
			by: ['event'],
			_count: { event: true },
			orderBy: { _count: { event: 'desc' } },
			take: 8
		}),
		// Daily page views last 7 days
		prisma.pageView.findMany({
			where: { createdAt: { gte: sevenDaysAgo } },
			select: { createdAt: true }
		}),
		prisma.clickEvent.findMany({
			where: { createdAt: { gte: sevenDaysAgo } },
			select: { createdAt: true }
		})
	]);

	const freeUsers = totalUsers - premiumUsers - annualUsers - starterUsers;
	const activeSubscribers = premiumUsers + annualUsers + starterUsers;
	const totalResumes = resumeAgg._sum.resumesGenerated ?? 0;

	// Build 7-day series
	const days = Array.from({ length: 7 }, (_, i) => {
		const d = new Date(today);
		d.setUTCDate(d.getUTCDate() + i - 6);
		return d.toISOString().slice(0, 10);
	});

	const pvByDay: Record<string, number> = {};
	const clickByDay: Record<string, number> = {};
	days.forEach((d) => {
		pvByDay[d] = 0;
		clickByDay[d] = 0;
	});

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
		label: new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			timeZone: 'UTC'
		}),
		pageViews: pvByDay[d],
		clicks: clickByDay[d]
	}));

	return {
		totalUsers,
		freeUsers,
		premiumUsers,
		annualUsers,
		starterUsers,
		activeSubscribers,
		totalResumes,
		topGenerators,
		recentUsers,
		totalPageViews,
		totalClicks,
		topPages,
		topClicks,
		series
	};
}

export const load: PageServerLoad = async () => {
	const stats = await getStats();
	return { stats };
};