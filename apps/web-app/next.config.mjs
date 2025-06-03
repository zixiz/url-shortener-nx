import withNx from '@nx/next/plugins/with-nx.js';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    svgr: false,
  },
  // other Next.js config options
};

export default withNx()(nextConfig); // Use ESM export and call withNx