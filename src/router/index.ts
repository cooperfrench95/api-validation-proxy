import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";

let Main;
Vue.use(VueRouter);

let isWorker = false;
if (process.env.IS_ELECTRON) {
  isWorker = require("electron").remote.getCurrentWindow().id > 1;
  if (isWorker) {
    Main = () => import("../backgroundWin/entry.vue");
  } else {
    Main = () => import("../components/Main.vue");
  }
}

const RequestView = () => import("../components/RequestView.vue");

const routes: Array<RouteConfig> = [
  {
    path: "/requests",
    name: "Requests",
    component: RequestView
  },
  {
    path: "/",
    name: "Main",
    component: Main
  }
];

const router = new VueRouter({
  routes
});

export default router;
