import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deploy alvo: GitHub Pages em https://rpschumacher.github.io/pendencias/
// Por isso o `base` e o `start_url` apontam para o subcaminho.
export default defineConfig({
  base: '/pendencias/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Painel de Controle Pessoal',
        short_name: 'Painel Pessoal',
        description: 'Controle pessoal de tarefas e acompanhamentos',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/pendencias/',
        start_url: '/pendencias/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Não interceptar nenhuma chamada ao Supabase: o SW só serve o shell do
        // app offline (HTML/JS/CSS). Auth e dados sempre vão direto à rede,
        // evitando "Load failed" quando o handler em cache responde mal.
        navigateFallbackDenylist: [/^\/api/, /\.supabase\.co/],
        // Substitui o SW antigo imediatamente em vez de esperar o usuário
        // fechar todas as abas. Crítico para fazer a correção chegar rápido.
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
})
