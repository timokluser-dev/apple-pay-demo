<template>
  <div class="cart-page">
    <v-container>
      <h1>View your Cart</h1>

      <v-table class="my-4">
        <thead>
          <tr>
            <th class="text-left">Name</th>
            <th class="text-left">Price</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in cartItems" :key="item.name">
            <td>{{ item.name }}</td>
            <td>{{ item.price }}</td>
          </tr>
        </tbody>
      </v-table>

      <v-btn v-if="!isCheckout" @click.prevent="onCheckoutClick" class="mb-3">Go to Checkout</v-btn>

      <div v-else ref="checkout-button-container"></div>
    </v-container>
  </div>
</template>

<script lang="ts">
import { useApi, type Cart, type CartItem } from '@/api';
import { createPaymentRequest, setupPaymentButton } from '@/helpers/stripe';
import { Component, Vue } from 'vue-facing-decorator';

@Component({
  components: {},
})
export default class CartPage extends Vue {
  api = useApi();

  cart?: Cart;
  isCheckout = false;

  mounted() {
    this.cart = this.api.getCart();
  }

  async onCheckoutClick(): Promise<void> {
    if (!this.cart) {
      return;
    }

    this.isCheckout = true;

    const paymentRequest = await createPaymentRequest(this.cart);
    await setupPaymentButton(
      paymentRequest,
      this.$refs['checkout-button-container'] as HTMLButtonElement
    );
  }

  get cartItems(): CartItem[] {
    if (!this.cart) {
      return [];
    }

    return this.cart.items;
  }
}
</script>

<style scoped lang="scss"></style>
