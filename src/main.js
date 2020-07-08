import Vue from 'vue';
import App from './App.vue';
import VueRouter from 'vue-router';
import VueGtag from 'vue-gtag';

Number.isInteger = Number.isInteger || function (value) {
  return typeof value === 'number' &&
  isFinite(value) &&
  Math.floor(value) === value;
};

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