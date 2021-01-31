import Vue from 'vue'
import VueI18n from 'vue-i18n'
import moment from 'moment'
import chineseLang from './locales/zh'
import englishLang from './locales/en'
Vue.use(VueI18n)

const getDefaultLanguage = () => {
  let lang = localStorage.getItem('lang')
  if (!lang || ['zh', 'en'].indexOf(lang) < 0) {
    lang = 'en'
  }
  moment.locale(lang)
  return lang
}
const a = ''

// export i18n instance
export default new VueI18n({
  locale: getDefaultLanguage(),
  fallbackLocale: 'en',
  messages: {
    zh: chineseLang,
    en: englishLang,
  },
  silentTranslationWarn: true
})
