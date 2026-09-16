import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'IMAGE FORGE MOBILE',
    short_name: 'ImageForge',
    description: 'Mobile-first image generation front-end',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#020617',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }]
  };
}
