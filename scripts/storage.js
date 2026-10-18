import { validateImport } from "./validator.js";

const DATA_KEY = "student-finance-data";
const SETTINGS_KEY = "student-finance-settings";
const LEGACY_DATA_KEY = "studentFinanceTransaction";
const LEGACY_SETTINGS_KEY = "studentFinanceSettings";
const DEFAULT_RATES = { EUR: 0.92, RWF: 1400 };
const ALLOWED_CURRENCIES = ["USD", "EUR", "RWF"];

export function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY) ??
      localStorage.getItem(LEGACY_DATA_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return validateImport(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveData(data) {
  try {
    if (!validateImport(data)) return false;
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(defaults = {}) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY) ??
      localStorage.getItem(LEGACY_SETTINGS_KEY) ??
      "{}";
    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
      throw new Error("Stored settings must be an object.");
    }

    const defaultRates = {
      ...DEFAULT_RATES,
      ...(defaults.exchangeRates || {})
    };
    const storedRates = stored.rates ?? stored.exchangeRates;
    const ratesObject = storedRates && typeof storedRates === "object" &&
      !Array.isArray(storedRates) ? storedRates : {};
    const rates = { ...defaultRates };

    for (const [code, rate] of Object.entries(ratesObject)) {
      if (!["EUR", "RWF", "CAD"].includes(code)) continue;
      const numericRate = Number(rate);
      if (Number.isFinite(numericRate) && numericRate > 0) {
        rates[code] = numericRate;
      }
    }

    const defaultTarget = Number(defaults.target ?? defaults.monthlyBudget ?? 1000);
    const savedTarget = Number(stored.target ?? stored.monthlyBudget);
    const target = Number.isFinite(savedTarget) && savedTarget >= 0
      ? savedTarget
      : Number.isFinite(defaultTarget) && defaultTarget >= 0 ? defaultTarget : 1000;
    const defaultBudget = Number(defaults.monthlyBudget ?? defaults.target ?? target);
    const savedBudget = Number(stored.monthlyBudget ?? stored.target);
    const monthlyBudget = Number.isFinite(savedBudget) && savedBudget >= 0
      ? savedBudget
      : Number.isFinite(defaultBudget) && defaultBudget >= 0 ? defaultBudget : target;
    const currency = ALLOWED_CURRENCIES.includes(stored.currency)
      ? stored.currency
      : defaults.currency || "USD";

    return {
      ...defaults,
      ...stored,
      currency,
      target,
      monthlyBudget,
      rates,
      categories: Array.isArray(stored.categories)
        ? stored.categories.filter(category => typeof category === "string")
        : [...(defaults.categories || [])],
      exchangeRates: rates
    };
  } catch {
    return {
      ...defaults,
      rates: {
        ...DEFAULT_RATES,
        ...(defaults.exchangeRates || {})
      },
      exchangeRates: {
        ...DEFAULT_RATES,
        ...(defaults.exchangeRates || {})
      }
    };
  }
}

export function saveSettings(settings) {
  try {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return false;
    }

    const target = Number(settings.target ?? settings.monthlyBudget);
    const rates = settings.rates ?? settings.exchangeRates;
    if (!Number.isFinite(target) || target < 0) return false;
    if (!ALLOWED_CURRENCIES.includes(settings.currency)) return false;
    if (!rates || typeof rates !== "object" || Array.isArray(rates)) return false;

    for (const code of ["EUR", "RWF"]) {
      const rate = Number(rates[code]);
      if (!Number.isFinite(rate) || rate <= 0) return false;
    }

    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

export function load() {
  return loadData();
}

export function save(data) {
  return saveData(data);
}

export function exportJSON(transactions, settings) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions,
    settings
  };

  const blob = new Blob(
    [JSON.stringify(data, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "student-finance-data.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file) {
  const text = await file.text();

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }
}
