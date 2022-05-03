const nextConfig = {
  distDir: '../../.next',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        process: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
