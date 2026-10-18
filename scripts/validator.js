export const patterns = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,
  duplicate: /\b(\w+)\s+\1\b/i
};

// Collapse repeated interior spaces only. Leading/trailing spaces remain invalid.
export function normalizeDescription(value) {
  return String(value ?? "").replace(/ {2,}/g, " ");
}

export function isRealDate(value) {
  const text = String(value ?? "");
  if (!patterns.date.test(text)) return false;

  const [year, month, day] = text.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day;
}

export function valid(value, type) {
  const text = String(value ?? "");

  if (type === "date") return isRealDate(text);
  if (type === "description") {
    return patterns.description.test(text) && !patterns.duplicate.test(text);
  }

  return patterns[type]?.test(text) ?? false;
}

export function validateRecord(record) {
  if (!record || typeof record !== "object" || Array.isArray(record)) return false;

  const amountText = String(record.amount);
  const allowedCurrencies = ["USD", "EUR", "RWF"];

  return typeof record.id === "string" && record.id.trim().length > 0 &&
    typeof record.description === "string" && valid(record.description, "description") &&
    typeof record.amount === "number" && Number.isFinite(record.amount) &&
    record.amount >= 0 && patterns.amount.test(amountText) &&
    typeof record.category === "string" && valid(record.category, "category") &&
    isRealDate(record.date) &&
    typeof record.createdAt === "string" && Number.isFinite(Date.parse(record.createdAt)) &&
    typeof record.updatedAt === "string" && Number.isFinite(Date.parse(record.updatedAt)) &&
    (record.currency === undefined || allowedCurrencies.includes(record.currency));
}

export function validateImport(data) {
  if (!Array.isArray(data) || !data.every(validateRecord)) return false;
  const ids = data.map(record => record.id);
  return new Set(ids).size === ids.length;
}

export function validateTransaction(transaction) {
  const errors = {};
  const values = transaction && typeof transaction === "object" ? transaction : {};

  if (!valid(values.description, "description")) {
    errors.description = "Please enter a valid description.";
  }
  if (!valid(values.amount, "amount")) {
    errors.amount = "Please enter a valid amount.";
  }
  if (!valid(values.category, "category")) {
    errors.category = "Please enter a valid category.";
  }
  if (!valid(values.date, "date")) {
    errors.date = "Please enter a valid date.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
