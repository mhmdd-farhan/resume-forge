// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

/** The session user serialized for the client (root layout load). */
export interface AuthUser {
	id: string;
	name: string | null;
	email: string | null;
	image: string | null;
	plan: string;
	planExpiresAt: string | null;
}

/** Extended dashboard data (dashboard page load). */
export interface DashboardData {
	name: string;
	email: string;
	image: string;
	plan: string;
	planExpiresAt: string | null;
	resumesGenerated: number;
	dailyUsed: number;
	remaining: number | null;
	limitPeriod: 'total' | 'daily' | null;
	isPremium: boolean;
	isStarter: boolean;
	hasSubscription: boolean;
}

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			// admin basic-auth is enforced in hooks.server.ts
		}
		interface PageData {
			appUrl: string;
			user: AuthUser | null;
			dashboardData?: DashboardData | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};