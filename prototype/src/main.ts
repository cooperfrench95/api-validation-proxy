import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import VueAnnouncer from 'vue-announcer';

import vuetify from "@/plugins/vuetify";
import '@babel/polyfill'
import 'roboto-fontface/css/roboto/roboto-fontface.css'
import '@mdi/font/css/materialdesignicons.css'

Vue.config.productionTip = false;
Vue.use(VueAnnouncer)

// if (process.env.NODE_ENV === 'development') {
//   const VueAxe = require('vue-axe').default
//   Vue.use(VueAxe)
// }

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
