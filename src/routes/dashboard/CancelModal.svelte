<script lang="ts">
	import { AlertTriangle, X, XCircle, CheckCircle2 } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	let {
		onClose,
		onError
	}: {
		onClose: () => void;
		/** Called with a user-facing message when the cancellation fails server-side. */
		onError: (message: string) => void;
	} = $props();

	let submitting = $state(false);
	let success = $state(false);

	$effect(() => {
		if (!success) return;
		const t = setTimeout(() => {
			success = false;
		}, 5000);
		return () => clearTimeout(t);
	});

	/**
	 * Submit `?/cancelSubscription` from the modal. On success we invalidate the
	 * dashboard load so `$page.data.dashboardData` reflects the Free plan.
	 */
	const submitEnhance: SubmitFunction = ({ cancel, form, formData }) => {
		cancel();
		submitting = true;
		fetch(form.action, {
			method: 'POST',
			body: formData,
			headers: { accept: 'application/json' }
		})
			.then(async (res) => {
				const result = await res.json().catch(() => null);
				if (result?.type === 'success') {
					success = true;
					await invalidate('/dashboard');
					onClose();
				} else {
					onError(result?.data?.error ?? 'Failed to cancel subscription');
					onClose();
				}
			})
			.catch(() => {
				onError('Network error. Please try again.');
				onClose();
			})
			.finally(() => {
				submitting = false;
			});
	};
</script>

<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
	<!-- Backdrop -->
	<div
		class="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
		role="button"
		aria-label="Close modal"
		tabindex="-1"
		onclick={onClose}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') onClose();
		}}
	></div>
	<!-- Modal -->
	<div class="relative z-10 w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 motion-fade-up">
		<button
			type="button"
			onclick={onClose}
			class="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
			disabled={submitting}
		>
			<X class="w-4 h-4" />
		</button>

		<div class="flex items-center gap-3">
			<div class="w-11 h-11 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
				<AlertTriangle class="w-5 h-5 text-destructive" />
			</div>
			<div>
				<h3 class="font-bold text-foreground">Cancel Subscription?</h3>
				<p class="text-xs text-muted-foreground mt-0.5">This action cannot be undone</p>
			</div>
		</div>

		<div class="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
			{#each [
				'Your plan will revert to Free immediately',
				"You'll be limited to 3 total resume generations",
				'Access to unlimited generation will be revoked'
			] as item}
				<div class="flex items-start gap-2 text-sm text-destructive/80">
					<XCircle class="w-3.5 h-3.5 mt-0.5 shrink-0" />
					<span>{item}</span>
				</div>
			{/each}
		</div>

		<p class="text-xs text-muted-foreground">
			Your subscription will be cancelled immediately. If you change your mind, you can resubscribe
			at any time.
		</p>

		<form method="POST" action="?/cancelSubscription" use:enhance={submitEnhance} class="flex gap-3">
			<Button
				variant="outline"
				class="flex-1 rounded-xl"
				onclick={onClose}
				disabled={submitting}
				type="button"
			>
				Keep Subscription
			</Button>
			<Button variant="destructive" class="flex-1 rounded-xl" disabled={submitting} type="submit">
				{#if submitting}
					<span class="flex items-center gap-2">
						<span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						Cancelling…
					</span>
				{:else}
					Yes, Cancel
				{/if}
			</Button>
		</form>
	</div>
</div>

{#if success}
	<div class="fixed top-16 left-1/2 -translate-x-1/2 z-[110] pointer-events-none">
		<div
			class="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-fade-in"
		>
			<CheckCircle2 class="w-4 h-4" />
			Subscription cancelled. You're now on the Free plan.
		</div>
	</div>
{/if}