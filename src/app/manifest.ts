// src/app/manifest.ts
import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'খেজুর - প্রিমিয়াম ডেটস শপ',
    short_name: 'খেজুর',
    description: 'খাঁটি ও প্রিমিয়াম খেজুরের বিশ্বস্ত অনলাইন শপ। আজওয়া, মেদজুল, মরিয়ম ও অন্যান্য সেরা খেজুর।',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF7F2',
    theme_color: '#1A0101',
    orientation: 'portrait-primary',
    scope: '/',
    lang: 'bn',
    categories: ['shopping', 'food', 'lifestyle'],
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
    ],
    shortcuts: [
      {
        name: 'সকল খেজুর',
        short_name: 'খেজুর',
        description: 'সকল প্রিমিয়াম খেজুর দেখুন',
        url: '/products',
        icons: [{ src: '/logo.png', sizes: '96x96' }]
      },
      {
        name: 'অর্ডার ট্র্যাক করুন',
        short_name: 'ট্র্যাক',
        description: 'আপনার অর্ডার ট্র্যাক করুন',
        url: '/track-order',
        icons: [{ src: '/logo.png', sizes: '96x96' }]
      }
    ]
  }
}