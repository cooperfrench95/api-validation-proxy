import { IPCHandler } from "./../IPCHandler";
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    handler: new IPCHandler()
  },
  getters: {
    handler: state => state.handler
  },
  actions: {},
  mutations: {}
});
