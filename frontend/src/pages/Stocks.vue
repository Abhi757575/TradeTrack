<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import SvgChart from "../components/SvgChart.vue";
import "../styles/stocks.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";
const CHAT_ENDPOINT = import.meta.env.VITE_CHAT_ENDPOINT || `${API_BASE}/chat`;

const MODEL_OPTIONS = [
  { value: "lstm", label: "LSTM - Long Short-Term Memory" },
  { value: "xgboost", label: "XGBoost - Gradient Boosted Trees" },
  { value: "gradient_boosting", label: "Gradient Boosting - Sequential Ensemble" },
  { value: "random_forest", label: "Random Forest - 500 Trees" },
  { value: "svm", label: "SVM - RBF Kernel" },
  { value: "linear_regression", label: "Linear Regression - Baseline" },
];

const MODEL_DESCS = {
  lstm: {
    desc: "Sequential neural network that learns from time-series patterns over a 20-day window.",
    rmse: "~2.2%",
  },
  xgboost: {
    desc: "Gradient boosted trees. Excellent for capturing feature interactions and non-linearity.",
    rmse: "~2.5%",
  },
  gradient_boosting: {
    desc: "Sequential decision tree ensemble. Robust to outliers, balanced accuracy.",
    rmse: "~2.3%",
  },
  random_forest: {
    desc: "500 random decision trees averaged together. High stability, low variance.",
    rmse: "~2.7%",
  },
  svm: {
    desc: "Support Vector Machine with RBF kernel on standardised features.",
    rmse: "~3.0%",
  },
  linear_regression: {
    desc: "Baseline linear model. Fast, interpretable, best on trending stocks.",
    rmse: "~4.2%",
  },
};

const FIELD_CONFIG = [
  {
    key: "SMA_10",
    id: "f_sma10",
    label: "SMA 10",
    sublabel: "10-day avg",
    hint: "10-day simple moving avg",
    step: "0.01",
  },
  {
    key: "SMA_50",
    id: "f_sma50",
    label: "SMA 50",
    sublabel: "50-day avg",
    hint: "50-day simple moving avg",
    step: "0.01",
  },
  {
    key: "RSI",
    id: "f_rsi",
    label: "RSI",
    sublabel: "0 - 100",
    hint: "Relative Strength Index - overbought >70, oversold <30",
    step: "0.01",
    min: "0",
    max: "100",
    full: true,
  },
  {
    key: "MACD",
    id: "f_macd",
    label: "MACD",
    hint: "MACD line value",
    step: "0.0001",
  },
  {
    key: "MACD_Signal",
    id: "f_macd_signal",
    label: "MACD Signal",
    hint: "Signal line value",
    step: "0.0001",
  },
];

function createEmptyFields() {
  return {
    SMA_10: "",
    SMA_50: "",
    RSI: "",
    MACD: "",
    MACD_Signal: "",
  };
}

function formatFixed(value, digits = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : "-";
}

function formatPct(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "--";
  const sign = num > 0 ? "+" : "";
  return `${sign}${num.toFixed(2)}%`;
}

const tickerInput = ref("");
const companyData = ref(null);

const rankings = ref(null);
const rankingsLoading = ref(false);
const rankingsError = ref("");

const model = ref("lstm");
const days = ref(5);
const fields = ref(createEmptyFields());
const autofilledFields = ref({});
const results = ref(null);

const toast = ref("");
const isPredicting = ref(false);
const predictEnabled = ref(false);
const resultsRef = ref(null);

const chatMessages = ref([
  {
    role: "assistant",
    text: "Ask me anything about these rankings or how to use TradeTrack.",
    ts: Date.now() + Math.random(),
  },
]);
const chatInput = ref("");
const chatLoading = ref(false);

watch(toast, (value) => {
  if (!value) return;
  const timer = window.setTimeout(() => {
    toast.value = "";
  }, 4000);
  return () => window.clearTimeout(timer);
});

onMounted(async () => {
  rankingsLoading.value = true;
  rankingsError.value = "";
  try {
    const response = await fetch(`${API_BASE}/rankings/ytd?limit=10`);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || "Failed to load rankings");
    }
    rankings.value = await response.json();
  } catch (error) {
    rankingsError.value = error.message || "Failed to load rankings";
  } finally {
    rankingsLoading.value = false;
  }
});

let tickerTimer = null;
watch(
  tickerInput,
  (nextValue) => {
    const symbol = String(nextValue || "").trim().toUpperCase();

    if (tickerTimer) window.clearTimeout(tickerTimer);
    tickerTimer = null;

    if (!symbol || symbol.length > 5) {
      companyData.value = null;
      predictEnabled.value = false;
      return;
    }

    companyData.value = null;
    predictEnabled.value = false;

    tickerTimer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/autofill/${symbol}`);
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.detail || "Not found");
        }

        const data = await response.json();
        companyData.value = {
          symbol,
          company_name: data.company_name || symbol,
          current_price: data.current_price,
          change_pct: data.change_pct,
        };
        fields.value = {
          SMA_10: data.SMA_10 !== undefined ? Number(data.SMA_10).toFixed(4) : "",
          SMA_50: data.SMA_50 !== undefined ? Number(data.SMA_50).toFixed(4) : "",
          RSI: data.RSI !== undefined ? Number(data.RSI).toFixed(4) : "",
          MACD: data.MACD !== undefined ? Number(data.MACD).toFixed(4) : "",
          MACD_Signal: data.MACD_Signal !== undefined ? Number(data.MACD_Signal).toFixed(4) : "",
        };
        autofilledFields.value = {
          SMA_10: true,
          SMA_50: true,
          RSI: true,
          MACD: true,
          MACD_Signal: true,
        };
        predictEnabled.value = true;
      } catch (error) {
        toast.value = error.message || "Failed to load stock data";
        companyData.value = null;
        predictEnabled.value = false;
      }
    }, 600);
  },
  { immediate: true }
);

watch(results, async (value) => {
  if (!value || !resultsRef.value) return;
  await nextTick();
  resultsRef.value.scrollIntoView({ behavior: "smooth", block: "start" });
});

function handleFieldChange(key, value) {
  fields.value = { ...fields.value, [key]: value };
  autofilledFields.value = { ...autofilledFields.value, [key]: false };
}

function localChatAnswer(questionRaw) {
  const question = String(questionRaw || "").trim().toLowerCase();
  if (!question) return "Type a question and hit Send.";

  if (question.includes("most average") || question.includes("average")) {
    return "“Most average” are the tickers whose YTD returns are closest to the universe mean return.";
  }

  if (question.includes("ytd") || question.includes("return") || question.includes("rank")) {
    return "Rankings are YTD % returns for a fixed universe of tickers. Higher means better YTD performance.";
  }

  if (question.includes("predict") || question.includes("model")) {
    return "Use the prediction panel to choose a model and horizon, then click Predict. The API call is /predict/{symbol}?model_id=...&days=...";
  }

  if (question.includes("indicator") || question.includes("rsi") || question.includes("macd") || question.includes("sma")) {
    return "Indicators are technical signals. RSI is momentum (0–100), MACD is trend/momentum, SMA_10/SMA_50 are moving averages.";
  }

  return "I can help with rankings (YTD / most-average), indicators (RSI/MACD/SMA), or how to run predictions. What do you want to know?";
}

async function sendChat() {
  const text = String(chatInput.value || "").trim();
  if (!text || chatLoading.value) return;

  chatMessages.value = [...chatMessages.value, { role: "user", text, ts: Date.now() + Math.random() }];
  chatInput.value = "";
  chatLoading.value = true;

  try {
    const response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `Chat failed (${response.status})`);
    }

    const data = await response.json();
    const answer = data?.answer || data?.message || data?.text;
    if (!answer) throw new Error("Chat response missing answer");

    chatMessages.value = [...chatMessages.value, { role: "assistant", text: String(answer), ts: Date.now() + Math.random() }];
  } catch (error) {
    chatMessages.value = [...chatMessages.value, { role: "assistant", text: localChatAnswer(text), ts: Date.now() + Math.random() }];
  } finally {
    chatLoading.value = false;
    await nextTick();
    const el = document.getElementById("aiChatScroll");
    if (el) el.scrollTop = el.scrollHeight;
  }
}

async function runPredict() {
  const symbol = String(tickerInput.value || "").trim().toUpperCase();
  const featureVals = {
    SMA_10: parseFloat(fields.value.SMA_10),
    SMA_50: parseFloat(fields.value.SMA_50),
    RSI: parseFloat(fields.value.RSI),
    MACD: parseFloat(fields.value.MACD),
    MACD_Signal: parseFloat(fields.value.MACD_Signal),
  };

  if (Object.values(featureVals).some((value) => Number.isNaN(value))) {
    toast.value = "Please fill all 5 indicator fields before predicting.";
    return;
  }

  isPredicting.value = true;
  try {
    const response = await fetch(`${API_BASE}/predict/${symbol}?model_id=${model.value}&days=${days.value}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(featureVals),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || "Prediction failed");
    }

    results.value = await response.json();
  } catch (error) {
    toast.value = error.message || "Prediction failed";
  } finally {
    isPredicting.value = false;
  }
}

const modelInfo = computed(() => MODEL_DESCS[model.value] || {});
const accuracyHistory = computed(() => results.value?.accuracy_history || []);
const forecastData = computed(() => {
  const preds = results.value?.predictions || [];
  return preds.map((item) => ({
    ...item,
    range: `$${formatFixed(item.lower)} - $${formatFixed(item.upper)}`,
  }));
});
const metrics = computed(() => results.value?.metrics || {});
</script>

<template>
  <section class="wrap">
      
    <div class="rankings-stack">
      <div class="card rankings-card">
        <div class="card-title">Top 10 best performing stocks (YTD)</div>
        <div class="rankings-meta">
          <div class="rankings-meta-item">{{ rankings?.year ? `Year: ${rankings.year}` : "Year: --" }}</div>
          <div class="rankings-meta-item">{{ rankings?.as_of ? `As of: ${rankings.as_of}` : "As of: --" }}</div>
          <div class="rankings-meta-item">
            {{
              rankings?.mean_return_pct !== undefined
                ? `Universe avg: ${formatPct(rankings.mean_return_pct)}`
                : "Universe avg: --"
            }}
          </div>
        </div>

        <div v-if="rankingsLoading" class="rankings-state">Loading rankings...</div>
        <div v-else-if="rankingsError" class="rankings-state rankings-error">{{ rankingsError }}</div>
        <ol v-else class="rankings-list">
          <li v-for="row in (rankings?.top_gainers || [])" :key="row.symbol" class="rankings-item">
            <div class="rankings-left">
              <div class="rankings-symbol">{{ row.symbol }}</div>
              <div v-if="row.company_name" class="rankings-name">{{ row.company_name }}</div>
            </div>
            <div :class="`rankings-ret ${row.return_pct >= 0 ? 'up' : 'dn'}`">{{ formatPct(row.return_pct) }}</div>
          </li>
        </ol>
      </div>

      <div class="card rankings-card">
        <div class="card-title">Top 10 most average performing stocks (YTD)</div>
        <div class="rankings-meta">
          <div class="rankings-meta-item">{{ rankings?.year ? `Year: ${rankings.year}` : "Year: --" }}</div>
          <div class="rankings-meta-item">{{ rankings?.as_of ? `As of: ${rankings.as_of}` : "As of: --" }}</div>
          <div class="rankings-meta-item">
            {{
              rankings?.mean_return_pct !== undefined
                ? `Universe avg: ${formatPct(rankings.mean_return_pct)}`
                : "Universe avg: --"
            }}
          </div>
        </div>
        <div v-if="rankingsLoading" class="rankings-state">Loading rankings...</div>
        <div v-else-if="rankingsError" class="rankings-state rankings-error">{{ rankingsError }}</div>
        <ol v-else class="rankings-list">
          <li v-for="row in (rankings?.most_average || [])" :key="row.symbol" class="rankings-item">
            <div class="rankings-left">
              <div class="rankings-symbol">{{ row.symbol }}</div>
              <div v-if="row.company_name" class="rankings-name">{{ row.company_name }}</div>
            </div>
            <div :class="`rankings-ret ${row.return_pct >= 0 ? 'up' : 'dn'}`">{{ formatPct(row.return_pct) }}</div>
          </li>
        </ol>
      </div>
    </div>

    <div class="card ai-chat-card">
      <div class="card-title">
        GenAI Chat
        <span class="pill">BETA</span>
      </div>
      <div class="ai-chat-sub">Ask any question and get an answer (uses local fallback if no chat API is configured).</div>

      <div id="aiChatScroll" class="ai-chat-window" role="log" aria-live="polite">
        <div
          v-for="msg in chatMessages"
          :key="msg.ts"
          :class="`ai-chat-bubble ${msg.role === 'user' ? 'user' : 'assistant'}`"
        >
          <div class="ai-chat-role">{{ msg.role === "user" ? "You" : "Bot" }}</div>
          <div class="ai-chat-text">{{ msg.text }}</div>
        </div>
        <div v-if="chatLoading" class="ai-chat-typing">Bot is typing...</div>
      </div>

      <div class="ai-chat-input-row">
        <input
          v-model="chatInput"
          class="ai-chat-input"
          type="text"
          placeholder="e.g., What does ‘most average’ mean?"
          @keydown.enter="sendChat"
        />
        <button class="ai-chat-send" type="button" :disabled="chatLoading || !chatInput.trim()" @click="sendChat">
          Send
        </button>
      </div>
    </div>

    <div id="toast" :class="`toast ${toast ? '' : 'hidden'}`">{{ toast }}</div>
  </section>
</template>
