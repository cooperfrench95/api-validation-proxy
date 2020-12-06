import { IPCHandler } from "./../IPCHandler";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const SET_URL = "SET_URL";
const SET_PATH = "SET_PATH";

export default new Vuex.Store({
  state: {
    handler: new IPCHandler(),
    url: "",
    path: ""
  },
  getters: {
    handler: state => state.handler,
    url: state => state.url,
    path: state => state.path,
  },
  actions: {
    setURL({ commit }, url: string) {
      commit(SET_URL, url);
    },
    setPath({ commit }, path: string) {
      commit(SET_PATH, path)
    }
  },
  mutations: {
    [SET_URL](state, url) {
      state.url = url;
      localStorage.setItem('url', url)
    },
    [SET_PATH](state, path) {
      state.path = path;
      localStorage.setItem('path', path)
    }
  }
});
