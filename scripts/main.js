// Import the shared application state.
import { state } from "./state.js";

// Import the functions needed for saving and restoring the application data.

import {
    loadData,
    saveData,
    saveSettings,
    loadSettings,
    exportJSON,
    importJSON,
} from "./storage.js";

// Import the various validation functions
import {
    valid,
    validateTransaction,
    validateImport,
    normalizeDescription
} from "./validator.js";

// Import UI rendering and the navigation functions.
import {
    showSection,
    renderTransactions,
    filterTransactions,
    renderDashboard,
    setFormError,
    clearFormErrors
} from "./ui.js";

// this loads the previosly saved transactions when the browser is refreshed
state.transactions = loadData();

// Load saved settings and combine them with the defaults.
state.settings = loadSettings(state.settings);
state.settings.rates = state.settings.rates || state.settings.exchangeRates;

// Store the ID of the transaction currently being edited.

let editingId = null;

// create a short helper for selecting the HTML elements.
const $ = selector => document.querySelector(selector);
const symbols = { USD: "$", EUR: "€", RWF: "FRw" };

function convertAmount(amount, fromCurrency, toCurrency, rates = state.settings.rates) {
    const value = Number(amount);
    if (!Number.isFinite(value)) return 0;

    const usd = fromCurrency === "EUR" ? value / rates.EUR
        : fromCurrency === "RWF" ? value / rates.RWF
        : value;

    return toCurrency === "EUR" ? usd * rates.EUR
        : toCurrency === "RWF" ? usd * rates.RWF
        : usd;
}

const money = (amount, fromCurrency = "USD") => {
    const converted = convertAmount(amount, fromCurrency, state.settings.currency);
    return `${symbols[state.settings.currency] || state.settings.currency} ${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// display a message to the user.
function notify(message) {

    // find the status-message element.
    const output = $("#app-message");

    if (output) {
        //This displays the message
        output.textContent = message;
        output.setAttribute("role", "status");
}   else {
    // log the message if there is no status element
    console.log(message);
}

}

function announce(message) {
    notify(message);
}

function createId() {
    const randomPart = globalThis.crypto?.randomUUID?.() ||
        `${Date.now()}_${Math.random().toString(36).slice(2)}`;
    return `rec_${randomPart}`;
}

// save both the transactions and the settings.
function persist() {
    const dataSaved = saveData(state.transactions);
    const settingsSaved = saveSettings(state.settings);

    if (!dataSaved || !settingsSaved) {
        notify("Unable to save your changes. Check browser storage and try again.");
        return false;
    }

    return true;
}

//Refresh the Transactions table and the dashboard.
function refresh() {
    //Apply the current search, category filter and the sorting order
    const result = filterTransactions(
        state.transactions,
        state.filters,
        transaction => convertAmount(
            Number(transaction.amount),
            transaction.currency || "USD",
            state.settings.currency,
            state.settings.rates
        )
    );

    // Find the element that is used to display seach errors.
    const error = $("#search-error");

    if (error) {
        error.textContent = result.error || "";
    }

    // Render the filtered transactions list.
    renderTransactions(result.data, {
        currency: state.settings.currency,
        money,
        convertAmount,
        rates: state.settings.rates,
        searchRegex: result.regex,
        caseInsensitive: state.filters.caseInsensitive
    });

// Recalculatee and display the dashboard.
renderDashboard(
    state.transactions,
    state.settings,
    money,
    convertAmount
);
}

// Navigate to the requested section.
function navigate() {
  const requestedId = location.hash.slice(1) || "dashboard";
  const requestedElement = document.getElementById(requestedId);

  // Only a real .page-section may control the section switcher.
  const sectionId = requestedElement?.classList.contains("page-section")
    ? requestedId
    : "dashboard";

  showSection(sectionId);
}
    
 // Reset the Add Expense form.
 function resetExpenseForm(){
    // find the expense form.
    const form = $("#expense-form");
    if (!form) return;

    //clear the form fields.
    form.reset();
    clearFormErrors();

    // this exit editing mode
    editingId = null;

    //to restore the normal submite-button text.
    const submit = form.querySelector('[type="submit"]');

    if (submit) {
        submit.textContent = "Save Expense";
    }
    //this code restores  the normal form heading
    const heading = $("#add-expense-title");

    if (heading) {
        heading.textContent = "Add Expense";
    }
 }

// Handles clicks on links that navigate between page sections.
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", event => {
    const id = link.getAttribute("href").slice(1);
    const target = document.getElementById(id);

    // Leave skip links and ordinary anchors to the browser.
    if (!target?.classList.contains("page-section")) return;

    event.preventDefault();
    history.pushState(null, "", `#${id}`);
    navigate();
    document.querySelector("#page-title")?.focus();

    if (id === "add-expense") {
      resetExpenseForm();
    }
  });
});

 // Handles the back and forward buttons on the browser
 window.addEventListener("popstate", () => {
    navigate(location.hash.slice(1) || "dashboard");
 });

 // Display the initail section whenever the webiste loads
 navigate(location.hash.slice(1) || "dashboard");

 //handle the Add expense form submissions
 $("#expense-form")?.addEventListener("submit", event => {

    // prevents the browser from relaoding the page
    event.preventDefault();

    /// read the form fields
    const form = new FormData(event.currentTarget);


    // create a transaction object from the submitted values
    const transaction = {
        description: String(form.get("description") ?? ""),
        amount: Number(form.get("amount")),
        currency: state.settings.currency,
        category: String(form.get("category") || "").trim(),
        date: String(form.get("date") || "")
    };

    transaction.description = normalizeDescription(transaction.description);
    $("#description").value = transaction.description;

    clearFormErrors();
    const result = validateTransaction(
        transaction,
        state.settings.categories
    );
    let ok = result.valid;

    if (!valid(transaction.description, "description")) {
        setFormError(
            "description",
            "Do not use leading/trailing spaces or repeat the same word twice in a row."
        );
        ok = false;
    }

    ["amount", "category", "date"].forEach(id => {
        const value = transaction[id];
        if (!valid(value, id)) {
            setFormError(id, result.errors[id] || `Please enter a valid ${id}.`);
            ok = false;
        }
    });

    if (!ok) {
        announce("Please correct the highlighted fields before saving.");
        document.querySelector('[aria-invalid="true"]')?.focus();
        return;
    }

    // this piece of code records the current date and the current time
    const now = new Date().toISOString();
    const before = state.transactions.map(transaction => ({ ...transaction }));

    if (editingId) {

        //this finds the transaction that is being edited
        const index = state.transactions.findIndex(
            item => item.id === editingId
        );

        // tells process to stop if the transaction no longer exists.
        // and then print a message to the user
        if (index === -1) {
            notify("The transaction could no longer be found");
            return;
        }

        //update the transaction while allowing it remain with its exisiting id
        state.transactions[index] = {
            ...state.transactions[index],
            ...transaction,
            updatedAt: now
        };
    }   else {
        // create a new unique identifier for a new transaction
            const id = createId();

            // Add the new transaction the shared array of transactions
            state.transactions.push({
                id,
                ...transaction,
                createdAt: now,
                updatedAt: now
            });
    }

    if (!saveData(state.transactions)) {
        state.transactions = before;
        refresh();
        announce("The transaction could not be saved. Your existing data was kept.");
        return;
    }

    renderCategoryOptions();
    resetExpenseForm();

    // refresh the table and dashboard.
    refresh();
    announce(editingId ? "Transaction updated successfully" : "Expense saved successfully");

    if (location.hash !== "#transactions") {
        history.pushState(null, "", "#transactions");
    }
    navigate();


 });

 // Handles the edit and delete button clicks using event delegation.
 $("#transactions-body")?.addEventListener("click", event => {

    // checks whether the clicked element is an Edit button
    const editButton = event.target.closest("[data-edit]");

    // check if element clicked is a delete button
    const deleteButton = event.target.closest("[data-deleted]");

    // handle editing
    if (editButton) {

        // this finds the selected transaction
        const transaction = state.transactions.find(
            item => item.id === editButton.dataset.edit
        );

        if (!transaction) return;

        // record the ID so the submission updates the existing transaction
        editingId = transaction.id;


        // find the Add Expense form
        const form = $("#expense-form");

        if (!form) return;

        // fills the form with the existing transaction values
        form.elements.description.value = transaction.description;
        const editAmount = convertAmount(
            transaction.amount,
            transaction.currency || "USD",
            state.settings.currency,
            state.settings.rates
        );
        form.elements.amount.value = editAmount.toFixed(2);
        form.elements.date.value = transaction.date;

        // change the submit button the indicate user is in edit mode
        const submit = form.querySelector('[type="submit"]');

        if (submit) {
            submit.textContent = "Update Expense";
        }

        //change the heading if the element exists.
        const heading = $("#add-expense-title");

        if (heading) {
            heading.textContent = "Edit Expense";
        }

        // update the URL
        history.pushState(null, "", "#add-expense");
        navigate();

    }
    // Handle deletion of records
    if (deleteButton) {

        //retrieve the transaction ID.
        const id = deleteButton.dataset.deleted;

        // ask the user to confirm the deletion.

        if (!confirm("Are you sure you want to delete this transaction?")) {
            return;
        }

        const before = state.transactions;
        state.transactions = state.transactions.filter(
            item => item.id !== id
        );

        if (!saveData(state.transactions)) {
            state.transactions = before;
            refresh();
            announce("The transaction could not be deleted because saving failed.");
            return;
        }

        // refreshes the interface
        refresh();

        // display the confirmation message for the deleted record
        announce("Transaction deleted.");

    }
 });

 // update the search filer when ever the search field changes
 $("#search")?.addEventListener("input", event => {
    state.filters.search = event.target.value;
    refresh();
 });

 // handle case sensitive and case-insensitive search.
 $("#case-insensitive")?.addEventListener("change", event => {
    state.filters.caseInsensitive = event.target.checked;
    refresh();
 });

 // filter transactions by caetogory
 $("#category-filter")?.addEventListener("change", event => {
    state.filters.category = event.target.value;
    refresh();
 });

 // sort the transactions by date or amount
 $("#sort-by")?.addEventListener("change", event =>{
    state.filters.sort = event.target.value;
    refresh();
 });

$("#save-target")?.addEventListener("click", () => {
    const raw = $("#monthly-target").value;
    if (!valid(raw, "amount")) {
        announce("Enter a valid target of zero or more, with up to two decimal places.");
        $("#monthly-target").focus();
        return;
    }

    const previous = state.settings.target;
    state.settings.target = Number(raw);
    state.settings.monthlyBudget = Number(raw);
    if (!saveSettings(state.settings)) {
        state.settings.target = previous;
        state.settings.monthlyBudget = previous;
        $("#monthly-target").value = previous;
        announce("The target could not be saved. Existing settings were kept.");
        return;
    }
    refresh();
    announce("Monthly target saved.");
});

$("#save-currency-settings")?.addEventListener("click", () => {
    const oldCurrency = state.settings.currency;
    const oldRates = { ...state.settings.rates };
    const nextCurrency = $("#base-currency").value;
    const rawEUR = $("#rate-eur").value.trim();
    const rawRWF = $("#rate-rwf").value.trim();
    const nextEUR = Number(rawEUR);
    const nextRWF = Number(rawRWF);

    if (!rawEUR || !rawRWF || !Number.isFinite(nextEUR) || nextEUR <= 0 ||
        !Number.isFinite(nextRWF) || nextRWF <= 0) {
        announce("Both exchange rates must be numbers greater than zero.");
        return;
    }

    const convertedTarget = convertAmount(
        state.settings.target,
        oldCurrency,
        nextCurrency,
        oldRates
    );
    const previous = {
        ...state.settings,
        rates: { ...state.settings.rates },
        exchangeRates: { ...state.settings.exchangeRates }
    };

    state.settings.currency = nextCurrency;
    state.settings.target = convertedTarget;
    state.settings.monthlyBudget = convertedTarget;
    state.settings.rates = { EUR: nextEUR, RWF: nextRWF };
    state.settings.exchangeRates = { ...state.settings.rates };

    if (!saveSettings(state.settings)) {
        state.settings = previous;
        fillSettings(state.settings);
        announce("Currency settings could not be saved.");
        return;
    }

    fillSettings(state.settings);
    refresh();
    announce("Currency settings saved.");
});

 // Add a new category
 $("#add-category")?.addEventListener("click", () => {

    // read the category that has been entered by the user.
    const input = $("#new-category");
    const category = input?.value.trim();

    //validate teh category format
    if (!category || !valid(category, "category")) {
        notify("Please Enter a valid category.");
        return;
    }

    // prevent duplicate category names.
    if (state.settings.categories.includes(category)){
        notify("The category already exist");
        return;
    }

    // Add the category to the shared settings
    state.settings.categories.push(category);


    // save and refesh category controls
    if (!persist()) {
        state.settings.categories.pop();
        return;
    }
    renderCategoryOptions();

    notify("Category added.");

    // Clear the input
    input.value = "";
 });

 
/// this populates teh category dropdowns using the saved category list.
function renderCategoryOptions() {

    // select the category filter and expense-form category field.
    const selects = [

        $("#category-filter"),
        $("#expense-form")?.elements.category

    ].filter(Boolean);

    selects.forEach(select => {

        // remember the currently selected value.
        const selected = select.value;

        // remove existing options.
        select.replaceChildren();

        // create the default option.
        const first = document.createElement("option");

        first.value = "";
        first.textContent = select.id === "category-filter"
            ? "All Categories"
            : "Select Category";

            select.appendChild(first);

            // add all the available categories
            state.settings.categories.forEach(category => {
                const option = document.createElement("option");

                option.value = category;
                option.textContent = category;

                select.appendChild(option);
            });

            // restore the selected value when possible.
            select.value = selected;

    });
}


// download transactions and settings as JSON
$("#export-data")?.addEventListener("click", () => {
    exportJSON(state.transactions, state.settings);
});

// Import transactions from a selected JSON file.
$("#import-data")?.addEventListener("change", async event => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {

        // read and validate the JSON file.
        const data = await importJSON(file);
        const transactions = Array.isArray(data)
            ? data
            : data && typeof data === "object"
                ? data.transactions ?? data.transaction
                : null;

        if (!validateImport(transactions)) {
            throw new Error("The selected file contains invalid transaction data.");
        }

        // ask for confirmation before replacing existing transactions
        const replace = confirm(
            "Importing will replace your exisiting transactions. Continue?"
        );

        if (!replace) return;

        const importedSettings = data.settings && typeof data.settings === "object"
            ? {
                ...state.settings,
                ...data.settings,
                exchangeRates: {
                    ...state.settings.exchangeRates,
                    ...(data.settings.exchangeRates || {}),
                    ...(data.settings.rates || {})
                },
                rates: {
                    ...state.settings.rates,
                    ...(data.settings.exchangeRates || {}),
                    ...(data.settings.rates || {})
                }
            }
            : state.settings;

        if (!saveData(transactions)) {
            notify("Unable to save the imported transactions. Check browser storage and try again.");
            return;
        }

        if (!saveSettings(importedSettings)) {
            notify("Unable to save the imported settings. Check browser storage and try again.");
            return;
        }

        state.transactions = transactions;
        state.settings = importedSettings;

        // refresh the application
        renderCategoryOptions();
        refresh();

        notify("Data imported successfully.");
    } catch (error) {
        // display an error if reading or validating fails
        notify(error.message || "Import failed.");
    } finally {
        input.value = "";
    }
});

// initialize application controls and display current data.
function initialize(){


    //populate category dropdowns.
    renderCategoryOptions();

    fillSettings(state.settings);

    // restore the case-insensitive search settings
    const insensistiveInput = $("#case-insensitive");

    if (insensistiveInput) {

        insensistiveInput.checked = state.filters.caseInsensitive;
    }

    // display saved transactions and dashboard statistics
    refresh();
}

function fillSettings(settings) {
    const currencyInput = $("#base-currency");
    const targetInput = $("#monthly-target");
    const eurInput = $("#rate-eur");
    const rwfInput = $("#rate-rwf");

    if (currencyInput) currencyInput.value = settings.currency;
    if (targetInput) targetInput.value = settings.target;
    if (eurInput) eurInput.value = settings.rates.EUR;
    if (rwfInput) rwfInput.value = settings.rates.RWF;
}

// run initialization after the module is laoded
initialize();
