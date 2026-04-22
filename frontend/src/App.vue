<script setup>
import { computed, ref, watch } from "vue";

import Navbar from "./components/Navbar.vue";
import Footer from "./components/Footer.vue";

import Landing from "./pages/Landing.vue";
import Prediction from "./pages/Prediction.vue";
import Stocks from "./pages/Stocks.vue";
import Contact from "./pages/Contact.vue";

const PAGE_STORAGE_KEY = "tradetrack-current-page";

const PAGES = {
  home: "home",
  prediction: "prediction",
  stocks: "stocks",
  contact: "contact",
};

function getInitialPage() {
  const saved = window.localStorage.getItem(PAGE_STORAGE_KEY);
  return Object.values(PAGES).includes(saved) ? saved : PAGES.home;
}

const currentPage = ref(getInitialPage());

watch(
  currentPage,
  (value) => {
    window.localStorage.setItem(PAGE_STORAGE_KEY, value);
  },
  { immediate: true }
);

function navigate(pageId) {
  currentPage.value = Object.values(PAGES).includes(pageId) ? pageId : PAGES.home;
}

const currentComponent = computed(() => {
  switch (currentPage.value) {
    case PAGES.prediction:
      return Prediction;
    case PAGES.stocks:
      return Stocks;
    case PAGES.contact:
      return Contact;
    case PAGES.home:
    default:
      return Landing;
  }
});
</script>

<template>
  <div class="app-shell">
    <Navbar :current-page="currentPage" @navigate="navigate" />
    <main class="app-content">
      <component :is="currentComponent" @navigate="navigate" />
    </main>
    <Footer @navigate="navigate" />
  </div>
</template>

