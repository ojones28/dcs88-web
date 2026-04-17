import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		proxy: {
			'/api': 'http://api.dcs88.xyz:8889'
		},
		allowedHosts: ['dcs88.xyz']
	}
})
