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
    {
      path: '/thank-you',
      name: 'thank-you',
      component: () => import('../pages/ThankYouPage.vue'),
    },
  ],
});

export default router;
