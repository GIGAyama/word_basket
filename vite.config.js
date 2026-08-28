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
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        // 書体は先読みに入れない。入れると先読みが 1MB を超え、校内 Wi-Fi で
        // 40 台が同時に開いたときに初回表示が止まる。画面が出れば必ず取りにいくので、
        // その 1 回でここに入る。2 回目からはオフラインでも同じように出る。
        runtimeCaching: [
          {
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === 'font',
            handler: 'CacheFirst',
            options: {
              cacheName: 'self-hosted-fonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
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
