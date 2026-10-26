import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit()
	],
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
				secure: false,
			}
		}
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Vite's own helpers stay in the shared vendor chunk; left alone, Rollup can place
					// them in vendor-pdf and every page would load jsPDF to reach them.
					if (id.includes('vite/preload-helper') || id.includes('commonjsHelpers')) return 'vendor';
					if (id.includes('node_modules')) {
						if (id.includes('lucide-svelte')) return 'vendor-lucide';
						// jsPDF and html2canvas (and the libraries only they use) load with the
						// packet/PDF pages that import them, not with every page (X227).
						if (/node_modules\/(jspdf|html2canvas|canvg|fflate|dompurify|core-js|raf|rgbcolor|stackblur-canvas|svg-pathdata|performance-now)\//.test(id)) return 'vendor-pdf';
						return 'vendor';
					}
				}
			}
		}
	}
});
