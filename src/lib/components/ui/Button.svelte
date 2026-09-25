<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Variant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
	type Size = 'default' | 'sm' | 'lg' | 'icon';

	let {
		class: className,
		children,
		href,
		variant = 'default',
		size = 'default',
		...rest
	}: {
		class?: string;
		children?: Snippet;
		/** When set, renders an <a> instead of a <button> */
		href?: string;
		variant?: Variant;
		size?: Size;
		[key: string]: unknown;
	} = $props();

	const base =
		'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

	const variantClasses: Record<Variant, string> = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		link: 'text-primary underline-offset-4 hover:underline'
	};

	const sizeClasses: Record<Size, string> = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		lg: 'h-11 rounded-md px-8',
		icon: 'h-10 w-10'
	};

	const classNames = $derived(cn(base, variantClasses[variant], sizeClasses[size], className));
</script>

{#if href}
	<a {href} {...rest} class={classNames}>
		{@render children?.()}
	</a>
{:else}
	<button type="button" {...rest} class={classNames}>
		{@render children?.()}
	</button>
{/if}