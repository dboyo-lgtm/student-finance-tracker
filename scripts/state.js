export const state = {
    // This file controls all the currency converstion rate 
    transactions: [],
    settings: {
        currency: "USD",
        target: 1000,
        monthlyBudget: 1000,
        categories: [
            "Food",
            "Book",
            "Transport",
            "Entertainment",
            "Fees",
            "Other"
        ],
        exchangeRates: {
            EUR: 0.92,
            RWF: 1400,
            CAD: 1.36

        }
    },
    filters: {
        search: "",
        categories: "",
        sort: "newest",
        caseInsensitive: true
    }
};