<script setup>
import "../styles/footer.css";

const emit = defineEmits(["navigate"]);

function go(pageId) {
  emit("navigate", pageId);
}

const columns = [
  {
    title: "Platform",
    items: [
      { label: "Overview", page: "home" },
      { label: "Prediction", page: "prediction" },
      { label: "Stocks", page: "stocks" },
    ],
  },
  {
    title: "Research",
    items: [
      { label: "Contact desk", page: "contact" },
      { label: "Signal briefs", page: "contact" },
      { label: "Custom watchlists", page: "contact" },
    ],
  },
  {
    title: "Notes",
    items: [
      { label: "Demo data is illustrative", page: "home" },
      { label: "APIs: localhost:8000", page: "stocks" },
      { label: "Docs: /docs", page: "home" },
    ],
  },
];
</script>

<template>
  <footer class="footer-shell">
    <div>
      <div class="footer-brand">TradeTrack</div>
      <p class="footer-tagline">Stock signals, forecasting, and research workflows.</p>
    </div>

    <div class="footer-columns">
      <div v-for="col in columns" :key="col.title">
        <h4>{{ col.title }}</h4>
        <div>
          <button
            v-for="item in col.items"
            :key="item.label"
            type="button"
            class="nav-link"
            style="padding: 0; background: none; border: none; color: inherit; cursor: pointer;"
            @click="go(item.page)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>
    </div>

    <p class="footer-copy">
      {{ new Date().getFullYear() }} TradeTrack. Not investment advice.
    </p>
  </footer>
</template>

