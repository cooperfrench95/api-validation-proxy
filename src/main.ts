import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueAnnouncer from 'vue-announcer';
import lang from './plugins/lang';

import vuetify from "@/plugins/vuetify";
import '@babel/polyfill'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.config.productionTip = false;
Vue.use(VueAnnouncer)

new Vue({
  router,
  store,
  vuetify,
  i18n: lang,
  render: h => h(App)
}).$mount("#app");
