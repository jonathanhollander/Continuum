import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	onwarn: (warning, handler) => {
		const suppressedCodes = [
			'a11y_',
			'svelte_component_deprecated',
			'non_reactive_update',
			'event_directive_deprecated',
			'attribute_deprecated',
			'legacy_code',
			'state_referenced_locally',
			'element_invalid_self_closing_tag'
		];
		if (warning.code && suppressedCodes.some(code => warning.code.startsWith(code))) return;
		handler(warning);
	},

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			pages: 'dist',
			assets: 'dist',
			fallback: 'index.html',
			precompress: false,
			strict: false
		})
	}
};

export default config;
