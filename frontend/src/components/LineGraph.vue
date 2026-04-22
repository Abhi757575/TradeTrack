<script setup>
import { computed } from "vue";
import "../styles/graph.css";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  width: {
    type: Number,
    default: 320,
  },
  height: {
    type: Number,
    default: 160,
  },
  gradientId: {
    type: String,
    default: "graphGradient",
  },
  gridLines: {
    type: Number,
    default: 4,
  },
});

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

const max = computed(() => Math.max(...props.data.map(toNumber)));
const min = computed(() => Math.min(...props.data.map(toNumber)));
const stepX = computed(() => (props.data.length > 1 ? props.width / (props.data.length - 1) : props.width));

const points = computed(() => {
  return props.data
    .map((value, index) => {
      const val = toNumber(value);
      const ratio = max.value === min.value ? 0.5 : (val - min.value) / (max.value - min.value);
      const x = index * stepX.value;
      const y = props.height - ratio * props.height;
      return `${x},${y}`;
    })
    .join(" ");
});

const grid = computed(() => {
  return Array.from({ length: props.gridLines + 1 }, (_, index) => {
    const y = (props.height / props.gridLines) * index;
    return { key: `grid-${index}`, y };
  });
});
</script>

<template>
  <svg
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    class="line-graph"
    role="img"
    aria-label="Trend visualization"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00d6ff" />
        <stop offset="100%" stop-color="#03a64f" />
      </linearGradient>
    </defs>

    <g class="line-graph-grid">
      <line
        v-for="line in grid"
        :key="line.key"
        x1="0"
        :y1="line.y"
        :x2="width"
        :y2="line.y"
        stroke="rgba(255, 255, 255, 0.08)"
        stroke-dasharray="4 4"
      />
    </g>

      <polygon
        :points="`0,${height} ${points} ${width},${height}`"
        fill="rgba(3, 166, 79, 0.15)"
      />
      <polyline
        :points="points"
        fill="none"
        :stroke="`url(#${gradientId})`"
        stroke-width="4"
        stroke-linecap="round"
      />
  </svg>
</template>
