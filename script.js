const categories = ["Food", "Travel", "Shopping", "Bills", "Other"];
const currency = "₹";

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let editId = null; // id of the expense being edited (null = adding a new one)

// elements
const themeButton = document.getElementById("theme-button");
const totalText = document.getElementById("total");
const categoryList = document.getElementById("category-list");
const formTitle = document.getElementById("form-title");
const form = document.getElementById("expense-form");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const dateInput = document.getElementById("date");
const categoryInput = document.getElementById("category");
const titleError = document.getElementById("title-error");
const amountError = document.getElementById("amount-error");
const dateError = document.getElementById("date-error");
const categoryError = document.getElementById("category-error");
const saveButton = document.getElementById("save-button");
const cancelButton = document.getElementById("cancel-button");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");
const sortBy = document.getElementById("sort-by");
const clearButton = document.getElementById("clear-button");
const expenseTable = document.getElementById("expense-table");
const emptyMessage = document.getElementById("empty-message");

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
}

// dark mode 
function showThemeText() {
  if (document.body.classList.contains("dark")) {
    themeButton.textContent = "Light mode";
  } else {
    themeButton.textContent = "Dark mode";
  }
}

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}
showThemeText();

themeButton.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  if (document.body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
  showThemeText();
});

// form
form.addEventListener("input", (event) => {
  document.getElementById(event.target.id + "-error").textContent = "";
});

function checkForm() {
  titleError.textContent = titleInput.value.trim() === "" ? "Enter a title." : "";
  amountError.textContent = Number(amountInput.value) <= 0 ? "Amount must be more than 0." : "";
  dateError.textContent = dateInput.value === "" ? "Pick a date." : "";
  categoryError.textContent = categoryInput.value === "" ? "Choose a category." : "";

  return !(titleError.textContent || amountError.textContent || dateError.textContent || categoryError.textContent);
}

function resetForm() {
  editId = null;
  form.reset();
  dateInput.value = new Date().toLocaleDateString("en-CA"); // today, as YYYY-MM-DD
  titleError.textContent = "";
  amountError.textContent = "";
  dateError.textContent = "";
  categoryError.textContent = "";
  formTitle.textContent = "Add an expense";
  saveButton.textContent = "Add expense";
  cancelButton.hidden = true;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!checkForm()) return;

  const expense = {
    title: titleInput.value.trim(),
    amount: Number(amountInput.value),
    category: categoryInput.value,
    date: dateInput.value
  };

  if (editId === null) {
    expense.id = Date.now();
    expenses.push(expense);
  } else {
    expense.id = editId;
    const index = expenses.findIndex((e) => e.id === editId);
    expenses[index] = expense;
  }

  saveExpenses();
  resetForm();
  render();
});

cancelButton.addEventListener("click", resetForm);

// edit and delete
function startEdit(id) {
  const expense = expenses.find((e) => e.id === id);
  editId = id;
  titleInput.value = expense.title;
  amountInput.value = expense.amount;
  dateInput.value = expense.date;
  categoryInput.value = expense.category;
  formTitle.textContent = "Edit expense";
  saveButton.textContent = "Save changes";
  cancelButton.hidden = false;
  titleInput.focus();
}

function deleteExpense(id) {
  const expense = expenses.find((e) => e.id === id);
  if (!confirm("Delete " + expense.title + "?")) return;

  expenses = expenses.filter((e) => e.id !== id);
  if (editId === id) resetForm();
  saveExpenses();
  render();
}

// one listener for all the Edit and Delete buttons
expenseTable.addEventListener("click", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  const id = Number(row.dataset.id);

  if (event.target.className === "edit") startEdit(id);
  if (event.target.className === "delete") deleteExpense(id);
});

// filters 
filterCategory.addEventListener("change", render);
filterMonth.addEventListener("input", render);
sortBy.addEventListener("change", render);

clearButton.addEventListener("click", () => {
  filterCategory.value = "all";
  filterMonth.value = "";
  sortBy.value = "date-new";
  render();
});

// draw the screen 
function sumOf(list) {
  return list.reduce((sum, e) => sum + e.amount, 0);
}

function render() {
  // filter
  const shown = expenses.filter((e) => {
    const categoryOk = filterCategory.value === "all" || e.category === filterCategory.value;
    const monthOk = filterMonth.value === "" || e.date.startsWith(filterMonth.value);
    return categoryOk && monthOk;
  });

  // sort
  if (sortBy.value === "date-new") shown.sort((a, b) => b.date.localeCompare(a.date));
  if (sortBy.value === "date-old") shown.sort((a, b) => a.date.localeCompare(b.date));
  if (sortBy.value === "amount-high") shown.sort((a, b) => b.amount - a.amount);
  if (sortBy.value === "amount-low") shown.sort((a, b) => a.amount - b.amount);

  // totals
  totalText.textContent = currency + sumOf(shown).toFixed(2);
  categoryList.innerHTML = "";
  categories.forEach((category) => {
    const total = sumOf(shown.filter((e) => e.category === category));
    categoryList.innerHTML += `<li><span>${category}</span><span>${currency}${total.toFixed(2)}</span></li>`;
  });

  // table rows
  expenseTable.innerHTML = "";
  shown.forEach((expense) => {
    const row = document.createElement("tr");
    row.dataset.id = expense.id;
    row.innerHTML = `
      <td></td>
      <td>${expense.category}</td>
      <td>${expense.date}</td>
      <td>${currency}${expense.amount.toFixed(2)}</td>
      <td>
        <button class="edit">Edit</button>
        <button class="delete">Delete</button>
      </td>`;
    row.cells[0].textContent = expense.title; // textContent keeps odd characters from breaking the page
    expenseTable.appendChild(row);
  });

  // message when there is nothing to show
  emptyMessage.hidden = shown.length > 0;
  if (expenses.length === 0) {
    emptyMessage.textContent = "No expenses yet. Add your first one above.";
  } else {
    emptyMessage.textContent = "No expenses match these filters.";
  }
}

// start 
categoryInput.innerHTML = '<option value="">Choose a category</option>';
filterCategory.innerHTML = '<option value="all">All categories</option>';
categories.forEach((c) => {
  categoryInput.innerHTML += `<option>${c}</option>`;
  filterCategory.innerHTML += `<option>${c}</option>`;
});

resetForm();
render();
