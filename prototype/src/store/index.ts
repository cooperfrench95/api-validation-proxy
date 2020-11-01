import { IPCHandler } from "./../IPCHandler";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const SET_URL = "SET_URL";

export default new Vuex.Store({
  state: {
    handler: new IPCHandler(),
    url: ""
  },
  getters: {
    handler: state => state.handler,
    url: state => state.url
  },
  actions: {
    setURL({ commit }, url: string) {
      commit(SET_URL, url);
    }
  },
  mutations: {
    [SET_URL](state, url) {
      state.url = url;
    }
  }
});
