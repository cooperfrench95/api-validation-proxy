import Vue from "vue";
import Vuetify from "vuetify";
import "vuetify/dist/vuetify.min.css";
import colors from "vuetify/es5/util/colors";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      dark: {
        primary: colors.cyan.base,
        accent: colors.amber.base,
        positive: colors.green.base,
        error: colors.red.base,
        warning: colors.amber.base,
        info: colors.lightBlue.base
      }
    },
    dark: true
  },
  icons: {
    iconfont: "mdi"
  }
});
