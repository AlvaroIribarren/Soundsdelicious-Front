// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import VueClipboard from "vue-clipboard2";
import axios from "axios";
import VueAxios from "vue-axios";
import VueRouter from "vue-router";
import VueAuth from "@websanova/vue-auth";
import router from "./resources/js/router";
import auth from "./resources/js/auth";
import { store } from "./store/store";
import { config } from "./config";

// Set Vue router
Vue.router = router;
Vue.use(VueRouter);

const apiRoot = `https://${config.API_URL}`;

Vue.use(VueAxios, axios);
Vue.axios.defaults.baseURL = apiRoot;
Vue.use(VueAuth, auth);

Vue.config.productionTip = false;

Vue.use(VueClipboard);

/* eslint-disable no-new */
new Vue({
  el: "#app",
  template: "<App/>",
  components: { App },
  router,
  store
});
