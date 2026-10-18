# Student Finance Tracker

A responsive web application developed to help students record, organize, search, and analyze their daily expenses.
Live URL: https://dboyo-lgtm.github.io/student-finance-tracker/
## 1. Project Overview

The Student Finance Tracker allows students to monitor their spending, organize transactions by category, set monthly budgets, and view financial statistics.

The application is built using HTML, CSS, and vanilla JavaScript without JavaScript frameworks.

Transaction records and application settings are saved in the browser using LocalStorage.

## 2. Project Objectives

The objectives of this project are to:

* Help students track their daily expenses.
* Organize expenses by category.
* Calculate monthly spending totals.
* Monitor spending against a monthly budget.
* Search and sort financial records.
* Store data persistently in the browser.
* Support JSON data import and export.
* Provide a responsive and accessible user interface.

## 3. Technologies Used

* HTML5 — semantic page structure.
* CSS3 — responsive styling and layouts.
* JavaScript — application logic and DOM manipulation.
* Regular Expressions — input validation and transaction search.
* LocalStorage — persistent browser storage.
* JSON — transaction import and export.
* Google Fonts — typography.
* Material Icons — interface icons.
* Git and GitHub — version control and project hosting.

## 4. Main Features

### Dashboard

* Total monthly expenses.
* Number of transactions for the current month.
* Highest-spending category.
* Monthly budget target.
* Seven-day spending chart.
* Budget usage percentage.
* Remaining budget calculation.
* Warning when spending exceeds the target.

### Transactions

* Display transaction records in a table.
* Search using regular expressions.
* Toggle case-insensitive searching.
* Highlight matching search results.
* Filter by category.
* Sort by date.
* Sort descriptions alphabetically.
* Sort by transaction amount.
* Edit existing transactions.
* Delete transactions with confirmation.

### Add and Edit Expenses

Each transaction contains:

* Unique ID.
* Description.
* Amount.
* Category.
* Date.
* Creation timestamp (`createdAt`).
* Last modification timestamp (`updatedAt`).

Input validation helps prevent invalid transaction data from being saved.

### Settings

* Set a monthly spending target.
* Select a base currency.
* Store EUR and RWF exchange-rate settings.
* Import transaction data from JSON.
* Export transaction data to JSON.

**Note:** The current version stores currency and exchange-rate settings but does not automatically convert existing transaction amounts when the selected currency changes.

### Data Persistence

The application uses LocalStorage to retain transaction records and settings between browser sessions.

### Responsive Interface

The interface uses responsive CSS layouts to support mobile phones, tablets, and desktop screens.

## 5. Project Structure

```text
student-finance-tracker/
│
├── index.html
├── README.md
├── .gitignore
├── tests.html
├── seed.json
│
├── styles/
│   └── styles.css
│
└── scripts/
    ├── main.js
    ├── validators.js
    └── storage.js
```

### File Responsibilities

| File                    | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `index.html`            | Application structure and interface       |
| `styles/styles.css`     | Styling and responsive layouts            |
| `scripts/main.js`       | Main application logic and event handling |
| `scripts/validators.js` | Regular expressions and data validation   |
| `scripts/storage.js`    | LocalStorage operations                   |
| `tests.html`            | Validation test page                      |
| `seed.json`             | Sample transaction data                   |
| `README.md`             | Project documentation                     |
| `.gitignore`            | Files Git should ignore                   |

## 6. Regular Expression Catalog

The application uses regular expressions to validate transaction fields.

### Description

```regex
/^\S(?:.*\S)?$/
```

Checks that the description does not begin or end with whitespace.

### Amount

```regex
/^(0|[1-9]\d*)(\.\d{1,2})?$/
```

Accepts non-negative amounts with up to two decimal places.

Examples:

* `10`
* `10.50`
* `0.75`

### Date

```regex
/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/
```

Checks the `YYYY-MM-DD` date format and basic month/day ranges.

Note that this expression alone does not reject every impossible calendar date, such as February 31.

### Category

```regex
/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/
```

Allows letters, spaces, and hyphens.

Examples:

* `Food`
* `School Fees`
* `Public-Transport`

### Duplicate-Word Backreference

```regex
/\b(\w+)\s+\1\b/i
```

Detects consecutive repeated words.

Example:

```text
very very
```

The expression uses a capturing group and a backreference.

### Search

The search field accepts regular expressions. Invalid expressions are handled using `try/catch`.

Matching text can be highlighted in the transaction table.

## 7. Data Model

Each transaction follows this structure:

```json
{
  "id": "rec_123",
  "description": "Lunch",
  "amount": 8.5,
  "category": "Food",
  "date": "2026-10-14",
  "createdAt": "2026-10-14T08:00:00.000Z",
  "updatedAt": "2026-10-14T08:00:00.000Z"
}
```

## 8. Running the Application

### Option 1: VS Code Live Server

1. Open the project in VS Code.
2. Install the Live Server extension if it is not already installed.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Option 2: Python HTTP Server

Open the VS Code terminal in the project directory and run:

```bash
py -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The HTTP server is recommended because the application uses JavaScript modules.

## 9. Testing

Open the test page using the same local server:

```text
http://localhost:8000/tests.html
```

The test page checks validation rules, including:

* Valid and invalid descriptions.
* Valid and invalid amounts.
* Valid and invalid date formats.
* Valid and invalid categories.
* Duplicate-word backreferences.

Additional manual testing should cover:

* Creating transactions.
* Editing transactions.
* Deleting transactions.
* Searching and highlighting results.
* Sorting and category filtering.
* Dashboard calculations.
* Monthly budget calculations.
* LocalStorage persistence after reloading.
* JSON import and export.
* Responsive layouts.
* Keyboard navigation.

## 10. Seed Data

The `seed.json` file contains sample transactions for testing.

To import the sample data:

1. Start the application.
2. Open Settings.
3. Select Import JSON.
4. Choose `seed.json`.

**Warning:** Importing the seed file replaces the current transaction list. Export your existing records first if you need to preserve them.

## 11. Accessibility

The application includes:

* Semantic HTML landmarks.
* Labels for form fields.
* A skip-to-content link.
* Visible keyboard focus indicators.
* Accessible button labels.
* ARIA live regions for status messages.
* A caption for the transaction table.
* Responsive layouts.

Accessibility should also be verified through keyboard testing and manual inspection.

## 12. Project Milestones

### M1 — Specification and Wireframes

Define the project objectives, requirements, features, and page structure.

### M2 — Semantic HTML and CSS

Create the page structure and implement responsive styling.

### M3 — Forms and Regular Expressions

Implement transaction forms and regex-based validation.

### M4 — Rendering, Sorting, and Search

Render transaction records dynamically and implement sorting, filtering, searching, and highlighting.

### M5 — Dashboard and Budget

Calculate monthly statistics, category totals, the seven-day spending trend, and budget status.

### M6 — Persistence, Import/Export, and Settings

Implement LocalStorage, JSON import/export, monthly targets, and currency settings.

### M7 — Accessibility, Testing, and Documentation

Improve accessibility, test the application, refine the responsive interface, and document the project.

## 13. GitHub Repository

GitHub username: `dboyo-lgtm`

Repository URL:

https://github.com/dboyo-lgtm/student-finance-tracker

GitHub Pages URL:

https://dboyo-lgtm.github.io/student-finance-tracker/

**Important:** These URLs assume that your repository is named `student-finance-tracker` and GitHub Pages is enabled. Update them if your actual repository name or deployment URL differs.

## 14. Developer

**Developer:** BOYO DAVID

**GitHub:** https://github.com/dboyo-lgtm

## 15. Conclusion

The Student Finance Tracker demonstrates responsive interface development, DOM manipulation, regular-expression validation, transaction management, data persistence, JSON processing, and basic financial analysis using HTML, CSS, and vanilla JavaScript.
