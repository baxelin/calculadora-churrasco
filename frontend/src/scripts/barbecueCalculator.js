import { DURATION_RULES, MEATS, DEFAULTS, BEER_CAN_ML } from "../config/bbqConfig.js";

const EMOJI_SEGMENTS = ["🔥", "🥩", "🍗", "🧄", "🥖", "🧂", "🍺", "🧊", "😋", "🎉"];

function fmtKg(g) {
  const kg = g / 1000;
  return kg.toFixed(2).replace(".", ",") + " kg";
}
function fmtUnit(n, unit) {
  return `${Math.ceil(n)} ${unit}`;
}
function fmtLiters(ml) {
  const l = ml / 1000;
  return l.toFixed(1).replace(".", ",") + " L";
}
function getRule(hoursId) {
  return DURATION_RULES.find((r) => r.id === String(hoursId)) ?? DURATION_RULES[0];
}
function getDurationLabel(hoursId) {
  return getRule(hoursId)?.label ?? String(hoursId);
}

function getSelectedMeats(root) {
  const checks = [...root.querySelectorAll("[data-meat-check]")];
  const selectedIds = checks.filter((c) => c.checked).map((c) => c.value);
  if (selectedIds.length === 0) return [];

  const rows = selectedIds.map((id) => {
    const meta = MEATS.find((m) => m.id === id);
    const input = root.querySelector(`[data-meat-weight][data-meat-id="${id}"]`);
    const raw = Number(input?.value ?? 0);
    const weight = raw > 0 ? raw : (meta?.defaultWeight ?? 1);
    return { id, label: meta?.label ?? id, weight };
  });

  const sum = rows.reduce((acc, r) => acc + r.weight, 0) || 1;
  return rows.map((r) => ({ ...r, share: r.weight / sum }));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback antigo
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function initOne(root) {
  const q = (sel) => root.querySelector(sel);

  const appGrid = q("[data-app-grid]");
  const loaderOverlay = q("[data-loader-overlay]");

  const adultsEl = q("[data-adults]");
  const kidsEl = q("[data-kids]");
  const hoursEl = q("[data-hours]");

  const wasteEl = q("[data-waste]");
  const beerProfileEl = q("[data-beer-profile]");
  const includeSodaEl = q("[data-include-soda]");

  const calcBtn = q("[data-calc-btn]");

  const meatOut = q("[data-meat-out]");
  const breakdownEl = q("[data-meat-breakdown]");
  const breadOut = q("[data-bread-out]");
  const coalOut = q("[data-coal-out]");
  const saltOut = q("[data-salt-out]");
  const beerOut = q("[data-beer-out]");
  const sodaOut = q("[data-soda-out]");

  const resultsBox = q("[data-results-box]");
  const advancedBox = q("[data-advanced]");

  const emojiRow = q("[data-emoji-row]");
  const bigEmoji = q("[data-big-emoji]");
  const fillEl = q("[data-progress-fill]");
  const pctEl = q("[data-progress-pct]");

  const copyBtn = q("[data-copy-btn]");
  const waBtn = q("[data-wa-btn]");
  const toast = q("[data-toast]");

  const required = [
    appGrid, loaderOverlay,
    adultsEl, kidsEl, hoursEl,
    wasteEl, beerProfileEl, includeSodaEl,
    calcBtn,
    meatOut, breakdownEl, breadOut, coalOut, saltOut, beerOut, sodaOut,
    resultsBox, advancedBox,
    emojiRow, bigEmoji, fillEl, pctEl,
    copyBtn, waBtn, toast,
  ];

  if (required.some((x) => !x)) {
    console.error("BBQ calculator: faltando elemento (data-*) no HTML.", { root });
    return;
  }

  let state = "idle";
  let lastShareText = "";

  function renderEmojiRow() {
    emojiRow.innerHTML = EMOJI_SEGMENTS.map((e, i) => {
      const start = i * 10;
      const end = (i + 1) * 10;
      return `<span data-emoji-seg="${i}" title="${start}-${end}%">${e}</span>`;
    }).join("");
  }

  function setProgress(pct) {
    const p = Math.max(0, Math.min(100, pct));
    fillEl.style.width = `${p}%`;
    pctEl.textContent = `${p}%`;

    const seg = Math.min(9, Math.floor(p / 10));
    bigEmoji.textContent = EMOJI_SEGMENTS[seg] ?? "🔥";

    emojiRow.querySelectorAll("[data-emoji-seg]").forEach((el) => {
      const i = Number(el.getAttribute("data-emoji-seg"));
      if (i <= seg) el.setAttribute("data-on", "1");
      else el.removeAttribute("data-on");
    });
  }

  function buildShareText(payload) {
    const lines = [];
    lines.push("🔥 Calculadora de Churrasco 2000");
    lines.push("");
    lines.push(`Pessoas: ${payload.adults} adultos, ${payload.kids} crianças`);
    lines.push(`Duração: ${payload.durationLabel}`);
    lines.push("");

    lines.push(`🥩 Carne (total): ${payload.meatTotal}`);
    if (payload.meatLines.length) {
      lines.push("Divisão:");
      payload.meatLines.forEach((l) => lines.push(`- ${l}`));
    }
    lines.push("");

    lines.push("Extras:");
    lines.push(`- Pão de alho: ${payload.bread}`);
    lines.push(`- Carvão: ${payload.coal}`);
    lines.push(`- Sal grosso: ${payload.salt}`);
    lines.push("");

    lines.push("Bebidas:");
    lines.push(`- Cerveja: ${payload.beer}`);
    lines.push(`- Refri/Água: ${payload.soda}`);
    lines.push("");
    lines.push("Estimativa marota. Ajuste conforme a fome do pessoal 😋");

    return lines.join("\n");
  }

  function calc() {
    const adults = Math.max(0, Number(adultsEl.value || 0));
    const kids = Math.max(0, Number(kidsEl.value || 0));
    const rule = getRule(hoursEl.value);

    const wastePct = Math.max(0, Number(wasteEl.value ?? DEFAULTS.wastePct));
    const baseMeatG = adults * rule.meatAdult + kids * rule.meatKid;
    const totalMeatG = Math.round(baseMeatG * (1 + wastePct));

    const meatTotalText = fmtKg(totalMeatG);
    meatOut.textContent = meatTotalText;

    const selected = getSelectedMeats(root);
    let meatLines = [];
    if (selected.length === 0) {
      breakdownEl.innerHTML = `<div data-row><span>Nenhuma carne selecionada</span><span>—</span></div>`;
    } else {
      breakdownEl.innerHTML = selected
        .map((m) => {
          const grams = Math.round(totalMeatG * m.share);
          const line = `${m.label}: ${fmtKg(grams)}`;
          meatLines.push(line);
          return `<div data-row><span>${m.label}</span><span>${fmtKg(grams)}</span></div>`;
        })
        .join("");
    }

    const bread = adults * DEFAULTS.breadPerAdult + kids * DEFAULTS.breadPerKid;
    const coalKg = Math.max(DEFAULTS.coalMinKg, (totalMeatG / 1000) * DEFAULTS.coalKgPerMeatKg);
    const saltG = Math.max(DEFAULTS.saltMinG, (totalMeatG / 1000) * DEFAULTS.saltGPerMeatKg);

    const breadText = fmtUnit(bread, "un");
    const coalText = coalKg.toFixed(1).replace(".", ",") + " kg";
    const saltText = Math.ceil(saltG) + " g";

    breadOut.textContent = breadText;
    coalOut.textContent = coalText;
    saltOut.textContent = saltText;

    const beerProfile = beerProfileEl.value;
    let beerText = "—";
    if (beerProfile !== "none") {
      const beerMl = adults * (rule.beerAdultMl[beerProfile] || 0);
      const cans = Math.ceil(beerMl / BEER_CAN_ML);
      beerText = `${fmtLiters(beerMl)} (~${cans} latas de 350ml)`;
    }
    beerOut.textContent = beerText;

    const people = adults + kids;
    const sodaMl = includeSodaEl.checked ? people * rule.sodaPersonMl : 0;
    const sodaText = includeSodaEl.checked ? fmtLiters(sodaMl) : "—";
    sodaOut.textContent = sodaText;

    // texto pra copiar/whatsapp
    lastShareText = buildShareText({
      adults,
      kids,
      durationLabel: getDurationLabel(hoursEl.value),
      meatTotal: meatTotalText,
      meatLines,
      bread: breadText,
      coal: coalText,
      salt: saltText,
      beer: beerText,
      soda: sodaText,
    });

    // anim “pop”
    resultsBox.dataset.pulse = "1";
    window.clearTimeout(resultsBox._pulseTimer);
    resultsBox._pulseTimer = window.setTimeout(() => delete resultsBox.dataset.pulse, 220);
  }

  function setInputsDisabled(disabled) {
    root.querySelectorAll("input, select, button").forEach((el) => (el.disabled = disabled));
  }

  function goIdle() {
    state = "idle";
    root.dataset.state = "idle";
    loaderOverlay.hidden = true;

    appGrid.hidden = false;
    advancedBox.hidden = true;
    resultsBox.hidden = true;

    calcBtn.hidden = false;
    calcBtn.textContent = "Calcular! 🥩";
  }

  function goDone() {
    state = "done";
    root.dataset.state = "done";
    loaderOverlay.hidden = true;

    appGrid.hidden = false;
    advancedBox.hidden = false;
    resultsBox.hidden = false;

    setInputsDisabled(false);
    calcBtn.hidden = true; // some depois do primeiro cálculo

    // confetti rápido
    resultsBox.dataset.confetti = "1";
    window.clearTimeout(resultsBox._confTimer);
    resultsBox._confTimer = window.setTimeout(() => delete resultsBox.dataset.confetti, 900);

    calc();
  }

  function startLoading() {
    if (state === "loading") return;

    const firstTime = (state === "idle");
    state = "loading";
    root.dataset.state = "loading";

    // primeiro cálculo: some tudo e mostra loader central
    appGrid.hidden = firstTime;
    loaderOverlay.hidden = false;

    setInputsDisabled(true);
    setProgress(0);

    const durationMs = 2400; // mais lento
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) requestAnimationFrame(tick);
      else goDone();
    };

    requestAnimationFrame(tick);
  }

  // share buttons
  copyBtn.addEventListener("click", async () => {
    if (!lastShareText) return;
    const ok = await copyToClipboard(lastShareText);
    toast.textContent = ok ? "Copiado!" : "Não consegui copiar 😅";
    toast.hidden = false;
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => (toast.hidden = true), 1200);
  });

  waBtn.addEventListener("click", () => {
    if (!lastShareText) return;
    const url = `https://wa.me/?text=${encodeURIComponent(lastShareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // init
  renderEmojiRow();
  setProgress(0);
  goIdle();

  calcBtn.addEventListener("click", startLoading);

  // após calcular, qualquer mudança recalcula automático
  root.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => state === "done" && calc());
    el.addEventListener("change", () => state === "done" && calc());
  });
}

export default function initBbqCalculator() {
  document.querySelectorAll("[data-bbq-calculator]").forEach(initOne);
}
