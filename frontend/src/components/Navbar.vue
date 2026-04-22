<script setup>
import "../styles/navbar.css";

defineProps({
  currentPage: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["navigate"]);

const NAV_ITEMS = [
  { id: "home", label: "Overview" },
  { id: "prediction", label: "Prediction" },
  { id: "stocks", label: "Stocks" },
  { id: "contact", label: "Contact" },
];

function go(pageId) {
  emit("navigate", pageId);
}
</script>

<template>
  <header class="nav-shell">
    <div class="nav-left">
      <div class="nav-brand" role="button" tabindex="0" @click="go('home')">
        TradeTrack
        <span>Live Trade Intelligence</span>
      </div>
    </div>
    <nav class="nav-links">
      <button
        v-for="item in NAV_ITEMS"
        :key="item.id"
        type="button"
        :class="`nav-link ${currentPage === item.id ? 'active' : ''}`"
        @click="go(item.id)"
      >
        {{ item.label }}
      </button>
    </nav>
  </header>
</template>

