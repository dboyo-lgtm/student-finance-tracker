import { highlight, matches } from "./search.js";

const $ = selector => document.querySelector(selector);

export function setFormError(id, message) {
    const input = $(`#${id}`);
    const error = $(`#${id}-error`);
    if (!input || !error) return;

    error.textContent = message;

    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
}

export function clearFormErrors() {
    ["description", "amount", "category", "date"].forEach(id => {
        setFormError(id, "");
    });
}

// Show only the selected section by  the User
export function showSection(id) {
    const sections = document.querySelectorAll("main > section");

    const target = document.getElementById(id);
    

    if (!target) {
        id = "dashboard";
    }
    // This part hides all sections except the one selected.
    sections.forEach(section => {
        section.hidden = section.id !== id;
    });

    const pageInfo = {
        dashboard: {
            title: "Dashboard",
            subtitle: "Here's your financial overview."
        },
        transactions: {
            title: "Transactions",
            subtitle: "Manage all your expenses."
        },
        "add-expense": {
            title: "Add Expense",
            subtitle: "Record a new student expense."
        },
        settings: {
            title: "Settings",
            subtitle: "Customize you finance tracker."
        },
        about: {
            title: "About",
            subtitle: "About this project."
        }
    }

    // Get the heading and subtitle elements
    const titleElement = document.getElementById("page-title");
    const subTitleElement = document.getElementById("page-subtitle");

    // Get information for the selected page
    const info = pageInfo[id] || pageInfo.dashboard;

    // Update the title
    if (titleElement) {
        titleElement.textContent = info.title;
    }

    // Update the sub-title
if (subTitleElement) {
    subTitleElement.textContent = info.subtitle;
}

    document.querySelectorAll(".nav-link").forEach(link =>{
        link.classList.toggle(
            "active",
            link.getAttribute("href") === `#${id}`
        );
    });

    window.scrollTo({
        top: 0,
        behavior: "auto"
    });
}

// Format the money amount using the selected currency using the international curruncy formattet
export function formatMoney(amount, currency = "USD") {
    try{
        return new Intl.NumberFormat(undefined,{
            style: "currency",
            currency 
        }).format(amount);

    } catch {
        return `${currency}${Number(amount).toFixed(2)}`;
    }
}

//Puts the transaction rows inside the table
export function renderTransactions(data, options = {}) {

    const body = document.querySelector("#transactions-body");

    if (!body) return;

    const {
        currency = "USD",
        money = formatMoney,
        convertAmount = amount => amount,
        rates = {},
        searchRegex = null,
        caseInsensitive = true
    } = options;

    body.replaceChildren();

    if (!data.length) {
        const row = document.createElement("td");
    
    const cell = document.createElement("td");

    cell.colSpan = 5;
    cell.textContent = "No transactions found.";
    cell.className = "empty-state";

    row.appendChild(cell);
    body.appendChild(row);
    } else {

        //Creates one table row for each transaction.
        data.forEach(transaction => {
            const row = document.createElement("tr")
            const description = document.createElement("td");
            const category = document.createElement("td");
            const date = document.createElement("td");
            const amount = document.createElement("td");
            const actions = document.createElement("td");

            description.innerHTML = highlight(
                transaction.description,
                searchRegex
            );

            category.textContent = transaction.category;
            date.textContent = transaction.date;
            const selectedAmount = convertAmount(
                Number(transaction.amount),
                transaction.currency || "USD",
                currency,
                rates
            );
            amount.textContent = money(selectedAmount, currency);

            const edit = document.createElement("button");
            edit.type = "button";
            edit.textContent = "Edit";
            edit.dataset.edit = transaction.id;
            edit.className = "edit-btn";

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Delete";
            remove.dataset.deleted = transaction.id;
            remove.className = "delete-btn";

            actions.append(edit, remove);

            row.append(
                description,
                category,
                date,
                amount,
                actions
            );

            body.appendChild(row);
        });
    }

    // Updates the number of transactions to be displayed
    const count = document.querySelector("#transaction-count");

    if (count) {
        count.textContent = 
            `${data.length} transaction${data.length === 1 ? "" : "s"}`;

    }

}

//Filter and sort all the transaction collections on the website
export function filterTransactions(transactions, filter, amountInSelectedCurrency = transaction => Number(transaction.amount) || 0) {
    const {
        search = "",
        category = "",
        sort = "newest",
        caseInsensitive = true
    } = filter;

    let regex = null;

    if (search.trim()) {
        const flags = caseInsensitive ? "i" : "";

        regex = compileSearch(search, flags);

        if (!regex) {
            return {
                data: [],
                reqex: null,
                error: "Invalid regular expression."
            };
        }
    }

    let data = transactions.filter(transaction => {
        const categoryMatches = 
            !category || transaction.category === category;
        const textMatches =
            !regex ||
            matches(transaction.description, regex) ||
            matches(transaction.category, regex) ||
            matches(transaction.date, regex);
        
            return categoryMatches && textMatches;
    });

    switch (sort) {

        case "oldest":
        case "date-asc":
            data.sort((a, b) => a.date.localeCompare(b.date));
            break;

        case "amount-desc":
        case "highest":
            data.sort((a, b) => amountInSelectedCurrency(b) - amountInSelectedCurrency(a));
            break;

        case "amount-asc":
        case "lowest":
            data.sort((a, b) => amountInSelectedCurrency(a) - amountInSelectedCurrency(b));
            break;

        default:
            data.sort((a, b) => b.date.localeCompare(a.date))
    }


    return {
        data,
        regex,
        error: null
    };
}

// This compiles a search exprerssion and return null if it is invalid.
function compileSearch(value, flags) {
    try {
        return new RegExp(value, flags);
    } catch {
        return null;
    }
}

function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function dashboardStats(transactions, settings = {}, convertAmount) {
    if (!Array.isArray(transactions)) transactions = [];

    const currency = settings.currency || "USD";
    const amountInSelectedCurrency = transaction => {
        const amount = Number(transaction.amount) || 0;
        if (typeof convertAmount !== "function") return amount;
        return convertAmount(
            amount,
            transaction.currency || "USD",
            currency,
            settings.rates || settings.exchangeRates
        );
    };

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthly = transactions.filter(transaction =>
        typeof transaction.date === "string" &&
        transaction.date.startsWith(month)
    );
    const allTimeTotal = transactions.reduce(
        (sum, transaction) => sum + amountInSelectedCurrency(transaction),
        0
    );
    const monthlyTotal = monthly.reduce(
        (sum, transaction) => sum + amountInSelectedCurrency(transaction),
        0
    );

    const categoryTotals = new Map();
    transactions.forEach(transaction => {
        categoryTotals.set(
            transaction.category,
            (categoryTotals.get(transaction.category) || 0) +
                amountInSelectedCurrency(transaction)
        );
    });
    const top = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    const target = Number(settings.target ?? settings.monthlyBudget) || 0;
    const left = target - monthlyTotal;
    const percent = target > 0 ? Math.round((monthlyTotal / target) * 100) : 0;

    return {
        count: transactions.length,
        total: allTimeTotal,
        monthlyTotal,
        topCategory: top?.[0] || "—",
        topCategoryTotal: top?.[1] || 0,
        budget: target,
        remaining: Math.max(left, 0),
        percentage: target > 0 ? Math.min(percent, 100) : 0,
        overBudget: left < 0
    };
}

export function renderDashboard(transactions, settings = {}, money = formatMoney, convertAmount) {
    if (typeof settings === "number") {
        settings = { currency: money, monthlyBudget: settings };
        money = formatMoney;
    }

    const currency = settings.currency || "USD";
    const stats = dashboardStats(transactions, settings, convertAmount);
    const output = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    };

    output("total-spent", money(stats.total, currency));
    output("transaction-count", String(stats.count));
    output("top-category", stats.topCategory);
    output("top-category-total", money(stats.topCategoryTotal, currency));
    output("budget-total", money(stats.budget, currency));
    output("budget-spent", money(stats.monthlyTotal, currency));
    output("budget-left", money(stats.remaining, currency));
    output("budget-percent", `${stats.percentage}%`);
    output("dashboard-target", money(stats.budget, currency));
    output("dashboard-currency", currency);

    const circle = document.querySelector(".budget-circle");
    circle?.style.setProperty("--percent", `${stats.percentage}%`);

    const status = document.getElementById("budget-status");
    if (status) {
        status.className = "budget-status";
        if (stats.overBudget) {
            status.textContent = `You are ${money(stats.monthlyTotal - stats.budget, currency)} over your monthly budget.`;
            status.classList.add("over");
            status.setAttribute("role", "alert");
            status.setAttribute("aria-live", "assertive");
        } else {
            status.textContent = `You have ${money(stats.remaining, currency)} left this month.`;
            status.classList.add("under");
            status.setAttribute("role", "status");
            status.setAttribute("aria-live", "polite");
        }
    }

    const chart = document.getElementById("chart");
    if (chart) {
        const days = Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setHours(12, 0, 0, 0);
            date.setDate(date.getDate() - (6 - index));
            return {
                date: dateKey(date),
                label: date.toLocaleDateString(undefined, { weekday: "short" })
            };
        });
        const values = days.map(day => transactions
            .filter(transaction => transaction.date === day.date)
            .reduce((sum, transaction) => {
                const amount = Number(transaction.amount) || 0;
                return sum + (typeof convertAmount === "function"
                    ? convertAmount(
                        amount,
                        transaction.currency || "USD",
                        currency,
                        settings.rates || settings.exchangeRates
                    )
                    : amount);
            }, 0));
        const max = Math.max(...values, 1);

        chart.replaceChildren(...days.map((day, index) => {
            const item = document.createElement("div");
            item.className = "chart-item";
            const amount = document.createElement("small");
            amount.textContent = money(values[index], currency);
            const barContainer = document.createElement("div");
            barContainer.className = "bar-container";
            const bar = document.createElement("div");
            bar.className = "bar";
            bar.style.height = `${values[index] / max * 100}%`;
            barContainer.appendChild(bar);
            const label = document.createElement("span");
            label.textContent = day.label;
            item.append(amount, barContainer, label);
            return item;
        }));
        chart.setAttribute("role", "img");
        chart.setAttribute(
            "aria-label",
            `Spending over the last seven days. Total ${money(values.reduce((sum, value) => sum + value, 0), currency)}.`
        );
    }

    return stats;
}
