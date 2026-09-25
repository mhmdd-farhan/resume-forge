import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto picks the right adapter per platform:
		//  - Vercel (VERCEL env present)  -> @sveltejs/adapter-vercel
		//  - Docker / bare Node (default) -> @sveltejs/adapter-node
		adapter: adapter()
	}
};

export default config;