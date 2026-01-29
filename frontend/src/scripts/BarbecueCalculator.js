function rules(hours) {
  if (hours >= 8) return { meatAdult: 600, meatKid: 300, beerAdultMl: 2000, sodaPersonMl: 600 };
  if (hours >= 6) return { meatAdult: 500, meatKid: 250, beerAdultMl: 1600, sodaPersonMl: 500 };
  return { meatAdult: 400, meatKid: 200, beerAdultMl: 1200, sodaPersonMl: 400 };
}

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

function initOne(root) {
  const q = (sel) => root.querySelector(sel);

  const adultsEl = q("[data-adults]");
  const kidsEl = q("[data-kids]");
  const hoursEl = q("[data-hours]");
  const includeBeerEl = q("[data-include-beer]");
  const includeSodaEl = q("[data-include-soda]");

  const meatOut = q("[data-meat-out]");
  const breadOut = q("[data-bread-out]");
  const coalOut = q("[data-coal-out]");
  const saltOut = q("[data-salt-out]");
  const beerOut = q("[data-beer-out]");
  const sodaOut = q("[data-soda-out]");

  function calc() {
    const adults = Math.max(0, Number(adultsEl.value || 0));
    const kids = Math.max(0, Number(kidsEl.value || 0));
    const hours = Number(hoursEl.value);

    const r = rules(hours);
    const meatG = adults * r.meatAdult + kids * r.meatKid;

    const bread = adults * 2 + kids * 1;                // unidades
    const coalKg = Math.max(2, (meatG / 1000) * 1);     // ~1kg carvão por 1kg carne (mín 2kg)
    const saltG = Math.max(100, (meatG / 1000) * 30);

    const people = adults + kids;
    const beerMl = includeBeerEl.checked ? adults * r.beerAdultMl : 0;
    const sodaMl = includeSodaEl.checked ? people * r.sodaPersonMl : 0;

    meatOut.textContent = fmtKg(meatG);
    breadOut.textContent = fmtUnit(bread, "un");
    coalOut.textContent = coalKg.toFixed(1).replace(".", ",") + " kg";
    saltOut.textContent = Math.ceil(saltG) + " g";

    beerOut.textContent = includeBeerEl.checked ? fmtLiters(beerMl) : "—";
    sodaOut.textContent = includeSodaEl.checked ? fmtLiters(sodaMl) : "—";
  }

  [adultsEl, kidsEl, hoursEl, includeBeerEl, includeSodaEl].forEach((el) => {
    el.addEventListener("input", calc);
    el.addEventListener("change", calc);
  });

  calc();
}

export default function initBbqCalculator() {
  document.querySelectorAll("[data-bbq-calculator]").forEach(initOne);
}
