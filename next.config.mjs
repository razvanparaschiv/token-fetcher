import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
export default bundleAnalyzer({
    eslint: {
        dirs: ['.'],
    },
    poweredByHeader: false,
    reactStrictMode: true,
    webpack: (config) => {
        // Remove external dependencies
        config.externals = config.externals.filter(
            (external) => !['bufferutil', 'utf-8-validate'].includes(external),
        );
        return config;
    },
});
