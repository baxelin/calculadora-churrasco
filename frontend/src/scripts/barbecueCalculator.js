import { DURATION_RULES, MEATS, DEFAULTS, BEER_CAN_ML } from "../config/bbqConfig.js";

const EMOJI_SEGMENTS = ["🔥", "🥩", "🍗", "🧄", "🥖", "🧂", "🍺", "🧊", "😋", "🎉"];
const SODA_BOTTLE_ML = 2000;

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

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
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

function roundToSum(floats, target) {
  const floors = floats.map((f) => Math.floor(f));
  let sum = floors.reduce((a, b) => a + b, 0);
  let rem = target - sum;

  const frac = floats.map((f, i) => ({ i, frac: f - Math.floor(f) }));

  if (rem > 0) {
    frac.sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < rem; k++) floors[frac[k % frac.length].i] += 1;
  } else if (rem < 0) {
    // tira dos menores fracs, sem ficar negativo
    frac.sort((a, b) => a.frac - b.frac);
    rem = -rem;
    for (let k = 0; k < rem; k++) {
      const idx = frac[k % frac.length].i;
      if (floors[idx] > 0) floors[idx] -= 1;
    }
  }
  return floors;
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

  const meatChecks = [...root.querySelectorAll("[data-meat-check]")];
  const shareInputs = [...root.querySelectorAll("[data-meat-share]")];
  const shareValues = [...root.querySelectorAll("[data-meat-share-value]")];
  const lockInputs = [...root.querySelectorAll("[data-meat-lock]")];

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

  function setToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    window.clearTimeout(toast._t);
    toast._t = window.setTimeout(() => (toast.hidden = true), 1200);
  }

  function getMeatItems() {
    return MEATS.map((m) => {
      const check = meatChecks.find((c) => c.value === m.id);
      const share = shareInputs.find((i) => i.getAttribute("data-meat-id") === m.id);
      const shareVal = shareValues.find((s) => s.getAttribute("data-meat-id") === m.id);
      const lock = lockInputs.find((l) => l.getAttribute("data-meat-id") === m.id);
      const row = root.querySelector(`[data-meat-row][data-meat-id="${m.id}"]`);
      return { id: m.id, label: m.label, check, share, shareVal, lock, row };
    }).filter((x) => x.check && x.share && x.shareVal && x.lock && x.row);
  }

  function setShareUI(id, val) {
    const it = getMeatItems().find((x) => x.id === id);
    if (!it) return;
    it.share.value = String(val);
    it.shareVal.textContent = `${val}%`;
  }

  function normalizeShares(pinnedId = null, pinnedVal = null) {
    const items = getMeatItems();
    const selected = items.filter((it) => it.check.checked);

    // deselecionados -> 0
    items.forEach((it) => {
      if (!it.check.checked) setShareUI(it.id, 0);
      it.share.disabled = !it.check.checked;
      it.lock.disabled = !it.check.checked;
      if (!it.check.checked) it.lock.checked = false;
      it.row.dataset.locked = it.lock.checked ? "1" : "0";
    });

    if (selected.length === 0) return;

    if (selected.length === 1) {
      setShareUI(selected[0].id, 100);
      selected[0].row.dataset.locked = selected[0].lock.checked ? "1" : "0";
      return;
    }

    // aplica valor "pinned" se veio de interação do usuário
    if (pinnedId) {
      const pv = Math.max(0, Math.min(100, Number(pinnedVal ?? 0)));
      setShareUI(pinnedId, Math.round(pv));
    }

    // locks atuais (após aplicar pinned)
    const locked = selected.filter((it) => it.lock.checked);
    const unlocked = selected.filter((it) => !it.lock.checked);

    const getVal = (it) => Number(it.share.value || 0);

    let lockedSum = locked.reduce((a, it) => a + getVal(it), 0);

    // Se locks estourarem 100, reduz o pinned (se ele estiver locked) ou o último locked
    if (lockedSum > 100) {
      const targetIt =
        pinnedId ? locked.find((it) => it.id === pinnedId) : null;

      const fallback = targetIt ?? locked[locked.length - 1];
      const othersSum = lockedSum - getVal(fallback);
      const maxAllowed = Math.max(0, 100 - othersSum);

      setShareUI(fallback.id, maxAllowed);
      lockedSum = othersSum + maxAllowed;
    }

    const remaining = Math.max(0, 100 - lockedSum);

    // Se todo mundo estiver locked, joga o resto no pinned (ou no último locked)
    if (unlocked.length === 0) {
      const target =
        pinnedId ? locked.find((it) => it.id === pinnedId) : locked[locked.length - 1];
      setShareUI(target.id, getVal(target) + remaining);
      return;
    }

    // Distribui remaining entre unlocked proporcionalmente (ou igual se tudo 0)
    const current = unlocked.map((it) => ({ it, v: getVal(it) }));
    const total = current.reduce((a, x) => a + x.v, 0);

    const floats = total > 0
      ? current.map((x) => (x.v / total) * remaining)
      : current.map(() => remaining / current.length);

    const ints = roundToSum(floats, remaining);
    current.forEach((x, i) => setShareUI(x.it.id, ints[i]));
  }


  function getSelectedMeatsByShare() {
    const items = getMeatItems().filter((it) => it.check.checked);
    const selected = items.map((it) => {
      const pct = Number(it.share.value || 0);
      return {
        id: it.id,
        label: it.label,
        share: Math.max(0, Math.min(1, pct / 100)),
      };
    });

    const sum = selected.reduce((a, b) => a + b.share, 0) || 1;
    return selected.map((x) => ({ ...x, share: x.share / sum }));
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
    lines.push("");
    lines.push("🔗 Link da calculadora:");
    lines.push("https://calculadora-churrasco-2000.vercel.app/");
    lines.push("");
    lines.push("👨‍💻 GitHub:");
    lines.push("https://github.com/baxelin");
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

    const selected = getSelectedMeatsByShare();
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

    let sodaText = "—";
    if (includeSodaEl.checked) {
      const bottles = Math.ceil(sodaMl / SODA_BOTTLE_ML);
      sodaText = `${fmtLiters(sodaMl)} (~${bottles} garrafas de 2L)`;
    }
    sodaOut.textContent = sodaText;

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
    calcBtn.hidden = true;

    // garante que preferências somem 100 só entre as selecionadas
    normalizeShares();

    calc();
  }

  function startLoading() {
    if (state === "loading") return;

    const firstTime = (state === "idle");
    state = "loading";
    root.dataset.state = "loading";

    appGrid.hidden = firstTime;
    loaderOverlay.hidden = false;

    setInputsDisabled(true);
    setProgress(0);

    const durationMs = 2400;
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

  // Share buttons
  copyBtn.addEventListener("click", async () => {
    if (!lastShareText) return;
    const ok = await copyToClipboard(lastShareText);
    setToast(ok ? "Copiado!" : "Não consegui copiar 😅");
  });

  waBtn.addEventListener("click", () => {
    if (!lastShareText) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(lastShareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  });

  // Eventos de carnes
  function onCheckChange(id) {
    const items = getMeatItems();
    const it = items.find((x) => x.id === id);
    if (!it) return;

    if (!it.check.checked) {
      // desmarcou -> zera e normaliza as outras
      normalizeShares();
      if (state === "done") calc();
      return;
    }

    // marcou -> dá uma fatia inicial e normaliza
    const selected = items.filter((x) => x.check.checked);
    const target = Math.round(100 / selected.length);
    setShareUI(id, target);
    normalizeShares();
    if (state === "done") calc();
  }

  function onShareInput(id, val) {
    normalizeShares(id, val);
    if (state === "done") calc();
  }

  meatChecks.forEach((c) => {
    c.addEventListener("change", () => onCheckChange(c.value));
  });

  shareInputs.forEach((r) => {
    const id = r.getAttribute("data-meat-id");
    r.addEventListener("input", () => onShareInput(id, r.value));
    r.addEventListener("change", () => onShareInput(id, r.value));
  });

  lockInputs.forEach((l) => {
    const id = l.getAttribute("data-meat-id");
    l.addEventListener("change", () => {
      const row = root.querySelector(`[data-meat-row][data-meat-id="${id}"]`);
      if (row) row.dataset.locked = l.checked ? "1" : "0";

      normalizeShares();
      if (state === "done") calc();
    });
  });

  // init
  renderEmojiRow();
  setProgress(0);
  goIdle();

  // deixa UI dos % sincronizada desde o começo
  normalizeShares();

  calcBtn.addEventListener("click", startLoading);

  // após calcular, qualquer mudança recalcula
  root.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", () => state === "done" && calc());
    el.addEventListener("change", () => state === "done" && calc());
  });
}

export default function initBbqCalculator() {
  document.querySelectorAll("[data-bbq-calculator]").forEach(initOne);
}
