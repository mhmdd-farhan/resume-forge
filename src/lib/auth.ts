import { goto } from '$app/navigation';

// ─── Client-side auth helpers ───────────────────────────────────────────────
// The signed-in user itself comes from the root layout server load
// (`$page.data.user`) - no extra session-polling round trip needed.

const BASE_CALLBACK = '/dashboard';

/** Redirect to our custom Google OAuth start route. */
export function signIn(callbackUrl: string = BASE_CALLBACK) {
	// Only allow same-origin relative redirect targets.
	const cb = callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : BASE_CALLBACK;
	goto(`/api/auth/google?callbackUrl=${encodeURIComponent(cb)}`);
}

/** Destroys the DB session and returns to the landing page. */
export async function signOut() {
	try {
		await fetch('/api/auth/signout', { method: 'POST' });
	} catch {
		// Ignore - always redirect to the landing page.
	}
	goto('/');
}