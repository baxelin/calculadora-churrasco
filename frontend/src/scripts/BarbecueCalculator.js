// src/scripts/barbecueCalculator.js
import { DURATION_RULES, MEATS, DEFAULTS, BEER_CAN_ML } from "../config/bbqConfig.js";

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

    const weight =
      raw > 0 ? raw : (meta?.defaultWeight ?? 1);

    return {
      id,
      label: meta?.label ?? id,
      weight,
    };
  });

  const sum = rows.reduce((acc, r) => acc + r.weight, 0) || 1;
  return rows.map((r) => ({ ...r, share: r.weight / sum }));
}

function initOne(root) {
  const q = (sel) => root.querySelector(sel);

  const adultsEl = q("[data-adults]");
  const kidsEl = q("[data-kids]");
  const hoursEl = q("[data-hours]");
  const wasteEl = q("[data-waste]");
  const beerProfileEl = q("[data-beer-profile]");
  const includeSodaEl = q("[data-include-soda]");

  const meatOut = q("[data-meat-out]");
  const breakdownEl = q("[data-meat-breakdown]");
  const breadOut = q("[data-bread-out]");
  const coalOut = q("[data-coal-out]");
  const saltOut = q("[data-salt-out]");
  const beerOut = q("[data-beer-out]");
  const sodaOut = q("[data-soda-out]");

  const resultsBox = q("[data-results-box]");

  const required = [
    adultsEl,
    kidsEl,
    hoursEl,
    wasteEl,
    beerProfileEl,
    includeSodaEl,
    meatOut,
    breakdownEl,
    breadOut,
    coalOut,
    saltOut,
    beerOut,
    sodaOut,
  ];

  if (required.some((x) => !x)) {
    console.error("BBQ calculator: faltando algum elemento no HTML (data-*)", { root });
    return;
  }

  function calc() {
    const adults = Math.max(0, Number(adultsEl.value || 0));
    const kids = Math.max(0, Number(kidsEl.value || 0));
    const rule = getRule(hoursEl.value);

    const wastePct = Math.max(0, Number(wasteEl.value ?? DEFAULTS.wastePct));
    const baseMeatG = adults * rule.meatAdult + kids * rule.meatKid;
    const totalMeatG = Math.round(baseMeatG * (1 + wastePct));

    meatOut.textContent = fmtKg(totalMeatG);

    // Divisão proporcional pelas carnes selecionadas
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

    // Itens auxiliares
    const bread = adults * DEFAULTS.breadPerAdult + kids * DEFAULTS.breadPerKid;
    const coalKg = Math.max(DEFAULTS.coalMinKg, (totalMeatG / 1000) * DEFAULTS.coalKgPerMeatKg);
    const saltG = Math.max(DEFAULTS.saltMinG, (totalMeatG / 1000) * DEFAULTS.saltGPerMeatKg);

    breadOut.textContent = fmtUnit(bread, "un");
    coalOut.textContent = coalKg.toFixed(1).replace(".", ",") + " kg";
    saltOut.textContent = Math.ceil(saltG) + " g";

    // Cerveja (depende do perfil)
    const beerProfile = beerProfileEl.value; // none/light/medium/heavy
    if (beerProfile === "none") {
      beerOut.textContent = "—";
    } else {
      const beerMl = adults * (rule.beerAdultMl[beerProfile] || 0);
      const cans = Math.ceil(beerMl / BEER_CAN_ML);
      beerOut.textContent = `${fmtLiters(beerMl)} (~${cans} latas de 350ml)`;
    }

    // Refri/água
    const people = adults + kids;
    const sodaMl = includeSodaEl.checked ? people * rule.sodaPersonMl : 0;
    sodaOut.textContent = includeSodaEl.checked ? fmtLiters(sodaMl) : "—";

    // “pop” visual quando recalcula
    if (resultsBox) {
      resultsBox.dataset.pulse = "1";
      window.clearTimeout(resultsBox._pulseTimer);
      resultsBox._pulseTimer = window.setTimeout(() => {
        delete resultsBox.dataset.pulse;
      }, 220);
    }
  }

  // Recalcula em qualquer alteração dentro do componente
  root.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });

  calc();
}

export default function initBbqCalculator() {
  document.querySelectorAll("[data-bbq-calculator]").forEach(initOne);
}
