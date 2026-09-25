<script lang="ts">
	import { tick } from 'svelte';

	let {
		value,
		onChange,
		multiline = false
	}: { value: string; onChange: (v: string) => void; multiline?: boolean } = $props();

	let editing = $state(false);
	let draft = $state(value);
	let inputEl: HTMLInputElement | undefined = $state();
	let textareaEl: HTMLTextAreaElement | undefined = $state();

	$effect(() => {
		if (!editing) return;
		void tick().then(() => {
			const el = multiline ? textareaEl : inputEl;
			if (!el) return;
			el.focus();
			if (multiline) el.setSelectionRange(el.value.length, el.value.length);
		});
	});

	function startEditing() {
		draft = value;
		editing = true;
	}

	function commit() {
		const trimmed = draft.trim();
		onChange(trimmed || value);
		editing = false;
	}

	function cancel() {
		draft = value;
		editing = false;
	}

	const baseClass =
		'bg-transparent outline outline-1 outline-primary/60 rounded px-0.5 w-full font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit]';
</script>

{#if editing}
	{#if multiline}
		<textarea
			bind:this={textareaEl}
			bind:value={draft}
			onblur={commit}
			onkeydown={(e) => {
				if (e.key === 'Escape') cancel();
			}}
			class={`${baseClass} resize-none`}
			rows={Math.max(2, draft.split('\n').length + 1)}
		></textarea>
	{:else}
		<input
			bind:this={inputEl}
			bind:value={draft}
			onblur={commit}
			onkeydown={(e) => {
				if (e.key === 'Enter') commit();
				if (e.key === 'Escape') cancel();
			}}
			class={baseClass}
		/>
	{/if}
{:else}
	<span
		role="button"
		tabindex="0"
		onclick={startEditing}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				startEditing();
			}
		}}
		class="cursor-text hover:bg-primary/5 hover:outline hover:outline-1 hover:outline-primary/25 hover:rounded px-0.5 -mx-0.5 transition-colors"
		title="Click to edit"
	>
		{value}
	</span>
{/if}