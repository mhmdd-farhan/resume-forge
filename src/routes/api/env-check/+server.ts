import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

// Diagnostic endpoint: reports whether each important env var is present and
// non-empty at RUNTIME — without revealing any values.
// Useful for debugging deploy-time vs runtime env mismatches (e.g. Vercel
// scope, empty-string vars, stale deployment). Remove after setup if not
// needed. NEXTAUTH_* are kept in the list so the old check stays meaningful
// for operators that copy it as-is; they are no longer required.

type VarStatus = 'ok' | 'empty' | 'missing';

function status(name: string): VarStatus {
	const v = env[name];
	if (v === undefined) return 'missing';
	if (v === '') return 'empty';
	return 'ok';
}

const VARS = [
	'GOOGLE_CLIENT_ID',
	'GOOGLE_CLIENT_SECRET',
	'NEXTAUTH_URL',
	'NEXTAUTH_SECRET',
	'DATABASE_URL',
	'NEXT_APP_URL',
	'NEXT_PUBLIC_APP_URL',
	'MIDTRANS_ENV',
	'MIDTRANS_SERVER_KEY',
	'MIDTRANS_CLIENT_KEY',
	'N8N_WEBHOOK_URL',
	'N8N_BASIC_AUTH'
] as const;

export const GET: RequestHandler = () => {
	const vars: Record<string, VarStatus> = {};
	for (const name of VARS) {
		vars[name] = status(name);
	}
	const allOk = Object.values(vars).every((s) => s === 'ok');
	return json({ ok: allOk, vars });
};