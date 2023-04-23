<template>
  <div class="thank-you-page">
    <v-container>
      <h1>Thank You</h1>
      <p>Thank You for Your Purchase. Your Payment Has Been Confirmed.</p>

      <v-btn @click.prevent="$router.push({ name: 'cart' })" class="mt-4">Back to Cart</v-btn>
    </v-container>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-facing-decorator';

@Component({
  components: {},
})
export default class ThankYouPage extends Vue {}
</script>

<style scoped lang="scss"></style>
