import { h } from 'vue'
import { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import AsideSponsors from './components/AsideSponsors.vue'
// import HomeSponsors from './components/HomeSponsors.vue'
import TranslationStatus from './components/TranslationStatus.vue'
import './styles/vars.css'
import './styles/sponsors.css'
import VueSchoolLink from './components/VueSchoolLink.vue'
import VueMasteryLogoLink from './components/VueMasteryLogoLink.vue'
import VueMasteryBanner from './components/VueMasteryBanner.vue'

const theme: Theme = {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      // 'home-features-after': () => h(HomeSponsors),
      'aside-ads-before': () => h(AsideSponsors),
      'doc-before': () => h(TranslationStatus),
    })
  },

  enhanceApp({ app }) {
    app.component('VueSchoolLink', VueSchoolLink)
    app.component('VueMasteryLogoLink', VueMasteryLogoLink)
  },

  // TODO: real date
  // setup() {
  //   const { lang } = useData()
  //   watchEffect(() => {
  //     if (typeof document !== 'undefined') {
  //       document.cookie = `nf_lang=${lang.value}; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/`
  //     }
  //   })
  // },
}

export default theme
