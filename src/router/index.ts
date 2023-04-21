import { createRouter, createWebHashHistory } from 'vue-router';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: { name: 'cart' },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../pages/CartPage.vue'),
    },
  ],
});

export default router;
