import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const META_URL = 'https://router.vuejs.org'
export const META_TITLE = 'Vue Router'
export const META_DESCRIPTION = 'Vue.js 的官方路由'

export const zhConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
  description: META_DESCRIPTION,
  head: [
    ['meta', { property: 'og:url', content: META_URL }],
    ['meta', { property: 'og:description', content: META_DESCRIPTION }],
    ['meta', { property: 'twitter:url', content: META_URL }],
    ['meta', { property: 'twitter:title', content: META_TITLE }],
    ['meta', { property: 'twitter:description', content: META_DESCRIPTION }],
  ],

  themeConfig: {
    editLink: {
      pattern: 'https://github.com/vuejs/router/edit/main/packages/docs/:path',
      text: '对本页提出修改建议',
    },

    outlineTitle: '本页内容',

    nav: [
      {
        text: '教程',
        link: '/zh/guide/',
        activeMatch: '^/zh/guide/',
      },
      {
        text: 'API 参考',
        link: '/zh/api/',
        activeMatch: '^/zh/api/',
      },
      {
        text: 'v4.x',
        items: [{ text: 'v3.x', link: 'https://v3.router.vuejs.org/zh' }],
      },
      {
        text: '相关链接',
        items: [
          {
            text: 'Discussions',
            link: 'https://github.com/vuejs/router/discussions',
          },
          {
            text: '更新日志',
            link: 'https://github.com/vuejs/router/blob/main/packages/router/CHANGELOG.md',
          },
          {
            text: 'Vue.js 认证',
            link: 'https://certification.vuejs.org/?friend=VUEROUTER',
          },
        ],
      },
    ],

    sidebar: {
      '/zh/api/': [
        {
          text: 'packages',
          items: [{ text: 'vue-router', link: '/zh/api/' }],
        },
      ],

      '/zh/': [
        {
          items: [
            {
              text: '介绍',
              link: '/zh/introduction.html',
            },
            {
              text: '安装',
              link: '/zh/installation.html',
            },
          ],
        },
        {
          text: '基础',
          collapsible: false,
          items: [
            {
              text: '入门',
              link: '/zh/guide/',
            },
            {
              text: '动态路由匹配',
              link: '/zh/guide/essentials/dynamic-matching.html',
            },
            {
              text: '路由的匹配语法',
              link: '/zh/guide/essentials/route-matching-syntax.html',
            },
            {
              text: '嵌套路由',
              link: '/zh/guide/essentials/nested-routes.html',
            },
            {
              text: '编程式导航',
              link: '/zh/guide/essentials/navigation.html',
            },
            {
              text: '命名路由',
              link: '/zh/guide/essentials/named-routes.html',
            },
            {
              text: '命名视图',
              link: '/zh/guide/essentials/named-views.html',
            },
            {
              text: '重定向和别名',
              link: '/zh/guide/essentials/redirect-and-alias.html',
            },
            {
              text: '路由组件传参',
              link: '/zh/guide/essentials/passing-props.html',
            },
            {
              text: '不同的历史记录模式',
              link: '/zh/guide/essentials/history-mode.html',
            },
          ],
        },
        {
          text: '进阶',
          collapsible: false,
          items: [
            {
              text: '导航守卫',
              link: '/zh/guide/advanced/navigation-guards.html',
            },
            {
              text: '路由元信息',
              link: '/zh/guide/advanced/meta.html',
            },
            {
              text: '数据获取',
              link: '/zh/guide/advanced/data-fetching.html',
            },
            {
              text: '组合式 API',
              link: '/zh/guide/advanced/composition-api.html',
            },
            {
              text: 'RouterView 插槽',
              link: '/zh/guide/advanced/router-view-slot.html',
            },
            {
              text: '过渡动效',
              link: '/zh/guide/advanced/transitions.html',
            },
            {
              text: '滚动行为',
              link: '/zh/guide/advanced/scroll-behavior.html',
            },
            {
              text: '路由懒加载',
              link: '/zh/guide/advanced/lazy-loading.html',
            },
            {
              text: '类型化路由',
              link: '/zh/guide/advanced/typed-routes.html',
            },
            {
              text: '扩展 RouterLink',
              link: '/zh/guide/advanced/extending-router-link.html',
            },
            {
              text: '导航故障',
              link: '/zh/guide/advanced/navigation-failures.html',
            },
            {
              text: '动态路由',
              link: '/zh/guide/advanced/dynamic-routing.html',
            },
          ],
        },
        {
          items: [
            {
              text: '从 Vue2 迁移',
              link: '/zh/guide/migration/index.html',
            },
            {
              text: '关于中文翻译',
              link: '/zh/about-translation.html',
            },
          ],
        },
      ],
    },
  },
}

export const zhSearch: DefaultTheme.AlgoliaSearchOptions['locales'] = {
  zh: {
    placeholder: '搜索文档',
    translations: {
      button: {
        buttonText: '搜索文档',
        buttonAriaLabel: '搜索文档',
      },
      modal: {
        searchBox: {
          resetButtonTitle: '清除查询条件',
          resetButtonAriaLabel: '清除查询条件',
          cancelButtonText: '取消',
          cancelButtonAriaLabel: '取消',
        },
        startScreen: {
          recentSearchesTitle: '搜索历史',
          noRecentSearchesText: '没有搜索历史',
          saveRecentSearchButtonTitle: '保存至搜索历史',
          removeRecentSearchButtonTitle: '从搜索历史中移除',
          favoriteSearchesTitle: '收藏',
          removeFavoriteSearchButtonTitle: '从收藏中移除',
        },
        errorScreen: {
          titleText: '无法获取结果',
          helpText: '你可能需要检查你的网络连接',
        },
        footer: {
          selectText: '选择',
          navigateText: '切换',
          closeText: '关闭',
          searchByText: '搜索供应商',
        },
        noResultsScreen: {
          noResultsText: '无法找到相关结果',
          suggestedQueryText: '你可以尝试查询',
          reportMissingResultsText: '你认为该查询应该有结果？',
          reportMissingResultsLinkText: '点击反馈',
        },
      },
    },
  },
}
