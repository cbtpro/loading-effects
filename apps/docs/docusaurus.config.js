const pagesPath = (process.env.BASE_URL ?? '').replace(/^\/+|\/+$/g, '');
const baseUrl = pagesPath ? `/${pagesPath}/` : '/';
const repository = process.env.GITHUB_REPOSITORY;

module.exports = {
  title: 'Loading Effects',
  tagline: 'Web 加载动效目录、设计规范与接入指南',
  url: process.env.SITE_URL || 'http://localhost:3000',
  baseUrl,
  trailingSlash: true,
  onBrokenLinks: 'throw',
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },
  presets: [
    ['classic', {
      docs: {
        path: '../../docs',
        routeBasePath: '/',
        sidebarPath: './sidebars.js',
      },
      blog: false,
    }],
  ],
  themeConfig: {
    navbar: {
      title: 'Loading Effects',
      items: [
        { type: 'doc', docId: 'index', label: '开始', position: 'left' },
        { type: 'doc', docId: 'effect-catalog', label: '动效目录', position: 'left' },
        { type: 'doc', docId: 'architecture', label: '技术设计', position: 'left' },
        ...(repository ? [{ href: `https://github.com/${repository}`, label: 'GitHub', position: 'right' }] : []),
      ],
    },
  },
};
