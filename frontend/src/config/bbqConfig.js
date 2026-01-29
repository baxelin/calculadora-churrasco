// src/config/bbqConfig.js
export const BEER_CAN_ML = 350;

export const DEFAULTS = {
  wastePct: 0.1, // 10% de margem
  breadPerAdult: 2,
  breadPerKid: 1,
  coalKgPerMeatKg: 1,
  coalMinKg: 2,
  saltGPerMeatKg: 30,
  saltMinG: 100,
};

// Regras por duração
export const DURATION_RULES = [
  {
    id: "4",
    label: "Até 4h",
    meatAdult: 400,
    meatKid: 200,
    beerAdultMl: { light: 350, medium: 700, heavy: 1050 },
    sodaPersonMl: 400,
  },
  {
    id: "6",
    label: "Até 6h",
    meatAdult: 500,
    meatKid: 250,
    beerAdultMl: { light: 500, medium: 1000, heavy: 1500 },
    sodaPersonMl: 500,
  },
  {
    id: "8",
    label: "8h ou mais",
    meatAdult: 600,
    meatKid: 300,
    beerAdultMl: { light: 650, medium: 1300, heavy: 2000 },
    sodaPersonMl: 600,
  },
];

export const MEATS = [
  { id: "picanha", label: "Picanha", defaultWeight: 3, group: "Bovinas" },
  { id: "fraldinha", label: "Fraldinha", defaultWeight: 2, group: "Bovinas" },
  { id: "contra_file", label: "Contra-filé", defaultWeight: 2, group: "Bovinas" },
  { id: "maminha", label: "Maminha", defaultWeight: 2, group: "Bovinas" },
  { id: "linguica", label: "Linguiça", defaultWeight: 2, group: "Outros" },
  { id: "frango", label: "Frango", defaultWeight: 1, group: "Aves" },
  { id: "coracao", label: "Coração de galinha", defaultWeight: 1, group: "Aves" },
  { id: "costela", label: "Costela", defaultWeight: 2 },
];
