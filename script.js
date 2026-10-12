/* ==========================================================================
   EMI CALCULATOR — FINANCIAL DASHBOARD ENGINE
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. DOM ELEMENTS SELECTION
   -------------------------------------------------------------------------- */
const emiForm = document.getElementById("emiForm");

const loanAmountInput = document.getElementById("loanAmount");
const interestRateInput = document.getElementById("interestRate");
const loanTenureInput = document.getElementById("loanTenure");
const tenureTypeInput = document.getElementById("tenureType");

const monthlyEMIOutput = document.getElementById("monthlyEMI");
const principalAmountOutput = document.getElementById("principalAmount");
const totalInterestOutput = document.getElementById("totalInterest");
const totalPaymentOutput = document.getElementById("totalPayment");

const summaryText = document.getElementById("summaryText");
const errorMessage = document.getElementById("errorMessage");
const errorMessageContainer = document.getElementById("errorMessageContainer");

// Visualization Elements
const principalProgressBar = document.getElementById("principalProgressBar");
const interestProgressBar = document.getElementById("interestProgressBar");
const principalRatioBadge = document.getElementById("principalRatioBadge");
const interestRatioBadge = document.getElementById("interestRatioBadge");


/* --------------------------------------------------------------------------
   2. CURRENCY & NUMBER FORMATTERS
   -------------------------------------------------------------------------- */
const inrFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

/**
 * Formats a numeric value into standard Indian Rupee currency representation.
 * @param {number} amount - The amount to format.
 * @returns {string} - Formatted currency string (e.g. ₹1,25,000.00).
 */
function formatCurrency(amount) {
    if (!Number.isFinite(amount)) return "₹0.00";
    return inrFormatter.format(amount);
}


/* --------------------------------------------------------------------------
   3. ERROR NOTIFICATION MANAGEMENT
   -------------------------------------------------------------------------- */
/**
 * Displays a descriptive error message and highlights the alert container.
 * @param {string} message - Error description to display to the user.
 */
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    if (errorMessageContainer) {
        errorMessageContainer.style.display = "flex";
        errorMessageContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

/**
 * Clears active error messages and hides the alert container.
 */
function clearError() {
    if (errorMessage) {
        errorMessage.textContent = "";
    }
    if (errorMessageContainer) {
        errorMessageContainer.style.display = "none";
    }
}


/* --------------------------------------------------------------------------
   4. VISUALIZATION PROGRESS BAR UPDATE
   -------------------------------------------------------------------------- */
/**
 * Dynamically updates the principal vs interest segmented breakdown bar.
 * Safely handles 0% interest and 0 total loan payment scenarios.
 * @param {number} principal - Principal loan amount.
 * @param {number} interest - Total interest payable.
 */
function updateVisualization(principal, interest) {
    const total = principal + interest;

    let principalPct = 100;
    let interestPct = 0;

    if (total > 0) {
        principalPct = (principal / total) * 100;
        interestPct = (interest / total) * 100;

        // Ensure clean boundary rounding (between 0% and 100%)
        principalPct = Math.max(0, Math.min(100, principalPct));
        interestPct = Math.max(0, Math.min(100, interestPct));
    }

    const principalPctDisplay = interest === 0 ? "100%" : `${principalPct.toFixed(1)}%`;
    const interestPctDisplay = interest === 0 ? "0%" : `${interestPct.toFixed(1)}%`;

    if (principalProgressBar) {
        principalProgressBar.style.width = `${principalPct}%`;
    }
    if (interestProgressBar) {
        interestProgressBar.style.width = `${interestPct}%`;
    }

    if (principalRatioBadge) {
        principalRatioBadge.textContent = `Principal: ${principalPctDisplay}`;
    }
    if (interestRatioBadge) {
        interestRatioBadge.textContent = `Interest: ${interestPctDisplay}`;
    }
}


/* --------------------------------------------------------------------------
   5. RESET DISPLAY STATE
   -------------------------------------------------------------------------- */
/**
 * Resets all output cards, loan summary message, and visualization bar to default.
 */
function resetResults() {
    if (monthlyEMIOutput) monthlyEMIOutput.textContent = "₹0.00";
    if (principalAmountOutput) principalAmountOutput.textContent = "₹0.00";
    if (totalInterestOutput) totalInterestOutput.textContent = "₹0.00";
    if (totalPaymentOutput) totalPaymentOutput.textContent = "₹0.00";

    if (summaryText) {
        summaryText.textContent = "Enter your loan details to view your repayment summary.";
    }

    updateVisualization(100, 0);
}


/* --------------------------------------------------------------------------
   6. EMI CALCULATION LOGIC
   -------------------------------------------------------------------------- */
/**
 * Validates form inputs, converts tenure to monthly units, executes loan
 * amortization calculation, and renders the updated results.
 * @param {Event} event - The form submit event.
 */
function calculateEMI(event) {
    if (event) {
        event.preventDefault();
    }

    clearError();

    /* 6.1 Parse raw input values */
    const rawPrincipal = loanAmountInput.value.trim();
    const rawRate = interestRateInput.value.trim();
    const rawTenure = loanTenureInput.value.trim();

    const principal = Number(rawPrincipal);
    const annualRate = Number(rawRate);
    const tenureValue = Number(rawTenure);

    /* 6.2 Validate Loan Amount */
    if (rawPrincipal === "" || !Number.isFinite(principal) || principal <= 0) {
        showError("Please enter a valid loan amount greater than ₹0.");
        loanAmountInput.focus();
        return;
    }

    if (principal > 1000000000) {
        showError("Loan amount cannot exceed ₹1,000 Crore (₹100,00,00,000).");
        loanAmountInput.focus();
        return;
    }

    /* 6.3 Validate Annual Interest Rate */
    if (rawRate === "" || !Number.isFinite(annualRate) || annualRate < 0) {
        showError("Please enter a non-negative interest rate (0% or higher).");
        interestRateInput.focus();
        return;
    }

    if (annualRate > 100) {
        showError("Annual interest rate cannot exceed 100%.");
        interestRateInput.focus();
        return;
    }

    /* 6.4 Validate Loan Tenure */
    if (
        rawTenure === "" ||
        !Number.isFinite(tenureValue) ||
        !Number.isInteger(tenureValue) ||
        tenureValue <= 0
    ) {
        showError("Please enter a positive whole number for the loan tenure.");
        loanTenureInput.focus();
        return;
    }

    /* 6.5 Convert Tenure to Months */
    const isYears = tenureTypeInput.value === "years";
    const months = isYears ? tenureValue * 12 : tenureValue;

    if (months > 1200) {
        showError("Loan tenure cannot exceed 100 years (1,200 months).");
        loanTenureInput.focus();
        return;
    }

    /* 6.6 Calculate Monthly EMI */
    let monthlyEMI;
    let totalPayment;
    let totalInterest;

    if (annualRate === 0) {
        // Safe handling for zero-interest loan (no interest payable)
        monthlyEMI = principal / months;
        totalPayment = principal;
        totalInterest = 0;
    } else {
        // Standard amortization formula: EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
        const monthlyRate = annualRate / 12 / 100;
        const compoundFactor = Math.pow(1 + monthlyRate, months);

        monthlyEMI = (principal * monthlyRate * compoundFactor) / (compoundFactor - 1);
        totalPayment = monthlyEMI * months;
        totalInterest = totalPayment - principal;
    }

    /* 6.7 Update Output Card Displays */
    monthlyEMIOutput.textContent = formatCurrency(monthlyEMI);
    principalAmountOutput.textContent = formatCurrency(principal);
    totalInterestOutput.textContent = formatCurrency(totalInterest);
    totalPaymentOutput.textContent = formatCurrency(totalPayment);

    /* 6.8 Update Segmented Visualization Bar */
    updateVisualization(principal, totalInterest);

    /* 6.9 Build Formatted Summary Description */
    const tenureUnitText = isYears
        ? (tenureValue === 1 ? "1 year" : `${tenureValue} years (${months} months)`)
        : (months === 1 ? "1 month" : `${months} months`);

    const interestDescription = annualRate === 0
        ? "with a 0% interest-free loan"
        : `at an annual interest rate of ${annualRate}%`;

    summaryText.textContent =
        `For a loan of ${formatCurrency(principal)}, ${interestDescription}, ` +
        `over ${tenureUnitText}, your monthly EMI is ` +
        `${formatCurrency(monthlyEMI)}. ` +
        `Your total interest payable is ${formatCurrency(totalInterest)}, ` +
        `and your overall repayment amount is ${formatCurrency(totalPayment)}.`;
}


/* --------------------------------------------------------------------------
   7. EVENT LISTENERS
   -------------------------------------------------------------------------- */
// Form submission (Calculate EMI)
emiForm.addEventListener("submit", calculateEMI);

// Reset form
emiForm.addEventListener("reset", function () {
    // Timeout ensures native reset event has cleared input values first
    setTimeout(() => {
        clearError();
        resetResults();
        loanAmountInput.focus();
    }, 0);
});

// Clear errors actively when user modifies any input
loanAmountInput.addEventListener("input", clearError);
interestRateInput.addEventListener("input", clearError);
loanTenureInput.addEventListener("input", clearError);
tenureTypeInput.addEventListener("change", clearError);


/* --------------------------------------------------------------------------
   8. FOOTER DYNAMIC YEAR INITIALIZATION
   -------------------------------------------------------------------------- */
const currentYearElement = document.getElementById("currentYear");
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}


/* --------------------------------------------------------------------------
   9. INITIALIZATION
   -------------------------------------------------------------------------- */
resetResults();