import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'みんなでしりとり！ ワードバスケット',
        short_name: 'ワードバスケット',
        description: 'みんなで遊べるしりとりカードゲーム。1台の端末を囲んで2〜6人で遊べます。',
        lang: 'ja',
        display: 'standalone',
        orientation: 'any',
        start_url: '.',
        scope: '.',
        theme_color: '#ffca28',
        background_color: '#fff9c4',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // ⚠️ woff2 を必ず入れること。自己ホストにしたので、ここから漏れると
        //    「オフラインでは端末フォントに落ちる」が、画面は出るので気づけない。
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        // プライバシーポリシー・利用規約は独立した静的 HTML なので
        // Service Worker のナビゲーションフォールバック (index.html) に
        // 横取りさせず、そのページ自体を表示させる
        navigateFallbackDenylist: [/\/privacy\.html$/, /\/terms\.html$/],
        // 実行時に取りにいく外部は無い。書体は public/fonts/ から配り、
        // 上の globPatterns で先読みしている。ここに Google Fonts の
        // runtimeCaching を戻さないこと（戻すと外部通信が復活する）。
      }
    })
  ],
  base: './',
})
