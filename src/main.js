import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import VueGtag from 'vue-gtag';

Vue.config.productionTip = false;

Vue.use(VueRouter);


const router = new VueRouter({
  routes: [
    {
      path: '/',
      name: 'main',
      component: App,
    },
  ],
});

Vue.use(VueGtag, {
  config : {
    id: 'UA-860026-1',
  },
}, router);

new Vue({
  el: '#app',
  router,
  render (h) {
    return h(App, {});
  },
});