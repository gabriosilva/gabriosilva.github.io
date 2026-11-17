import createMDX from '@next/mdx';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Every page is pre-rendered to static HTML and served by GitHub Pages.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  pageExtensions: ['ts', 'tsx', 'mdx'],
};

const withMDX = createMDX({});

export default withMDX(nextConfig);
