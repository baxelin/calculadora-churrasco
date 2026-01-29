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

  const required = [
    appGrid, loaderOverlay,
    adultsEl, kidsEl, hoursEl,
    wasteEl, beerProfileEl, includeSodaEl,
    calcBtn,
    meatOut, breakdownEl, breadOut, coalOut, saltOut, beerOut, sodaOut,
    resultsBox, advancedBox,
    emojiRow, bigEmoji, fillEl, pctEl,
  ];

  if (required.some((x) => !x)) {
    console.error("BBQ calculator: faltando elemento (data-*) no HTML.", { root });
    return;
  }

  let state = "idle";

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

  function calc() {
    const adults = Math.max(0, Number(adultsEl.value || 0));
    const kids = Math.max(0, Number(kidsEl.value || 0));
    const rule = getRule(hoursEl.value);

    const wastePct = Math.max(0, Number(wasteEl.value ?? DEFAULTS.wastePct));
    const baseMeatG = adults * rule.meatAdult + kids * rule.meatKid;
    const totalMeatG = Math.round(baseMeatG * (1 + wastePct));

    meatOut.textContent = fmtKg(totalMeatG);

    const selected = getSelectedMeats(root);
    if (selected.length === 0) {
      breakdownEl.innerHTML = `<div data-row><span>Nenhuma carne selecionada</span><span>—</span></div>`;
    } else {
      breakdownEl.innerHTML = selected
        .map((m) => {
          const grams = Math.round(totalMeatG * m.share);
          return `<div data-row><span>${m.label}</span><span>${fmtKg(grams)}</span></div>`;
        })
        .join("");
    }

    const bread = adults * DEFAULTS.breadPerAdult + kids * DEFAULTS.breadPerKid;
    const coalKg = Math.max(DEFAULTS.coalMinKg, (totalMeatG / 1000) * DEFAULTS.coalKgPerMeatKg);
    const saltG = Math.max(DEFAULTS.saltMinG, (totalMeatG / 1000) * DEFAULTS.saltGPerMeatKg);

    breadOut.textContent = fmtUnit(bread, "un");
    coalOut.textContent = coalKg.toFixed(1).replace(".", ",") + " kg";
    saltOut.textContent = Math.ceil(saltG) + " g";

    const beerProfile = beerProfileEl.value; // none/light/medium/heavy
    if (beerProfile === "none") {
      beerOut.textContent = "—";
    } else {
      const beerMl = adults * (rule.beerAdultMl[beerProfile] || 0);
      const cans = Math.ceil(beerMl / BEER_CAN_ML);
      beerOut.textContent = `${fmtLiters(beerMl)} (~${cans} latas de 350ml)`;
    }

    const people = adults + kids;
    const sodaMl = includeSodaEl.checked ? people * rule.sodaPersonMl : 0;
    sodaOut.textContent = includeSodaEl.checked ? fmtLiters(sodaMl) : "—";

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
  }

  function goDone() {
    state = "done";
    root.dataset.state = "done";
    loaderOverlay.hidden = true;

    appGrid.hidden = false;
    advancedBox.hidden = false;
    resultsBox.hidden = false;

    setInputsDisabled(false);
    calcBtn.textContent = "Recalcular! 🥩";

    calc();
  }

  function startLoading() {
    if (state === "loading") return;

    state = "loading";
    root.dataset.state = "loading";

    // some tudo, aparece loader central
    const firstTime = (state === "idle");

    // 1º cálculo: some tudo como você queria
    appGrid.hidden = firstTime;

    // recálculo: não some o app, só mostra overlay por cima
    loaderOverlay.hidden = false;


    setInputsDisabled(true);
    setProgress(0);

    const durationMs = 1200;
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

  // init
  renderEmojiRow();
  setProgress(0);
  goIdle();

  calcBtn.addEventListener("click", startLoading);

  // após calcular, qualquer mudança recalcula sem loader
  root.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => state === "done" && calc());
    el.addEventListener("change", () => state === "done" && calc());
  });
}

export default function initBbqCalculator() {
  document.querySelectorAll("[data-bbq-calculator]").forEach(initOne);
}
