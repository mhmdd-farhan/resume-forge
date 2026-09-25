import type { GenerateResult } from '$lib/types';

export type GenerateOutcome =
	| { success: true; data: GenerateResult }
	| { success: false; error: string };

/**
 * Calls the dashboard `?/generate` form action from the client wizard.
 * SvelteKit wraps action returns in an `ActionResult` envelope when the request
 * carries `Accept: application/json`.
 */
export async function generateResume(formData: FormData): Promise<GenerateOutcome> {
	let res: Response;
	try {
		res = await fetch('/dashboard?/generate', {
			method: 'POST',
			body: formData,
			headers: { accept: 'application/json' }
		});
	} catch {
		return { success: false, error: 'Something went wrong. Please try again.' };
	}

	try {
		const result = (await res.json()) as {
			type?: string;
			data?: { success?: boolean; error?: string; data?: GenerateResult };
		};
		if (result?.type === 'success' && result.data?.success && result.data.data) {
			return { success: true, data: result.data.data };
		}
		return { success: false, error: result.data?.error ?? 'Something went wrong. Please try again.' };
	} catch {
		return { success: false, error: 'Something went wrong. Please try again.' };
	}
}