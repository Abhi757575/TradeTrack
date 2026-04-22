<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  width: {
    type: Number,
    default: 800,
  },
  height: {
    type: Number,
    default: 260,
  },
  xKey: {
    type: String,
    default: "date",
  },
  lines: {
    type: Array,
    required: true,
    // [{ key, color, width?, dash? }]
  },
  band: {
    type: Object,
    default: null,
    // { lowerKey, upperKey, fill }
  },
  padding: {
    type: Number,
    default: 12,
  },
  gridLines: {
    type: Number,
    default: 4,
  },
});

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const seriesValues = computed(() => {
  const keys = [];
  if (props.band?.lowerKey) keys.push(props.band.lowerKey);
  if (props.band?.upperKey) keys.push(props.band.upperKey);
  for (const ln of props.lines) keys.push(ln.key);

  const values = [];
  for (const row of props.data) {
    for (const key of keys) {
      const num = toNumber(row?.[key]);
      if (num !== null) values.push(num);
    }
  }
  return values;
});

const yDomain = computed(() => {
  const values = seriesValues.value;
  if (!values.length) return { min: 0, max: 1 };
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.08;
  return { min: min - pad, max: max + pad };
});

const xCount = computed(() => Math.max(props.data.length, 1));

function scaleX(index) {
  const innerW = props.width - props.padding * 2;
  if (xCount.value <= 1) return props.padding + innerW / 2;
  return props.padding + (innerW * index) / (xCount.value - 1);
}

function scaleY(value) {
  const innerH = props.height - props.padding * 2;
  const { min, max } = yDomain.value;
  const ratio = (value - min) / (max - min);
  return props.height - props.padding - ratio * innerH;
}

function buildPolyline(key) {
  const pts = [];
  props.data.forEach((row, index) => {
    const val = toNumber(row?.[key]);
    if (val === null) return;
    pts.push(`${scaleX(index)},${scaleY(val)}`);
  });
  return pts.join(" ");
}

const bandPath = computed(() => {
  if (!props.band) return "";
  const lowerKey = props.band.lowerKey;
  const upperKey = props.band.upperKey;
  if (!lowerKey || !upperKey) return "";

  const upperPts = [];
  const lowerPts = [];
  props.data.forEach((row, index) => {
    const u = toNumber(row?.[upperKey]);
    const l = toNumber(row?.[lowerKey]);
    if (u !== null) upperPts.push(`${scaleX(index)},${scaleY(u)}`);
    if (l !== null) lowerPts.push(`${scaleX(index)},${scaleY(l)}`);
  });
  if (!upperPts.length || !lowerPts.length) return "";
  // Close polygon: upper left->right, then lower right->left.
  const all = [...upperPts, ...lowerPts.reverse()].join(" ");
  return all;
});

const grid = computed(() => {
  const lines = [];
  for (let i = 0; i <= props.gridLines; i += 1) {
    const y = props.padding + ((props.height - props.padding * 2) / props.gridLines) * i;
    lines.push({ key: `g-${i}`, y });
  }
  return lines;
});
</script>

<template>
  <svg :width="width" :height="height" :viewBox="`0 0 ${width} ${height}`" role="img">
    <g>
      <line
        v-for="g in grid"
        :key="g.key"
        :x1="padding"
        :x2="width - padding"
        :y1="g.y"
        :y2="g.y"
        stroke="rgba(255,255,255,0.06)"
        stroke-dasharray="4 4"
      />
    </g>

    <polygon
      v-if="band && bandPath"
      :points="bandPath"
      :fill="band.fill || 'rgba(0,229,160,0.10)'"
      stroke="transparent"
    />

    <polyline
      v-for="ln in lines"
      :key="ln.key"
      :points="buildPolyline(ln.key)"
      fill="none"
      :stroke="ln.color"
      :stroke-width="ln.width || 2"
      stroke-linecap="round"
      stroke-linejoin="round"
      :stroke-dasharray="ln.dash || null"
      opacity="0.95"
    />
  </svg>
</template>

