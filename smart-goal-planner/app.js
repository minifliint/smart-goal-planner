document.addEventListener("DOMContentLoaded", () => {
  const goalsList = document.getElementById("goals-list");
  const form = document.getElementById("new-goal-form");

  // Fetch and display all goals initially
  function fetchAndDisplayGoals() {
    fetch("http://localhost:3000/goals")
      .then(res => res.json())
      .then(goals => {
        goalsList.innerHTML = "";
        goals.forEach(displayGoal);
        updateOverview(goals);
      });
  }
  
 fetchAndDisplayGoals();

  // Handle new goal form submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const newGoal = {
      name: document.getElementById("name").value,
      targetAmount: parseFloat(document.getElementById("targetAmount").value),
      savedAmount: 0,
      category: document.getElementById("category").value,
      deadline: document.getElementById("deadline").value,
      createdAt: new Date().toISOString().split("T")[0]
    };

    fetch("http://localhost:3000/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGoal)
    })
    .then(res => res.json())
    .then(() => {
      form.reset();
      fetchAndDisplayGoals();
    });
  });

  // Display one goal card with all features
  function displayGoal(goal) {
    const div = document.createElement("div");
    div.className = "goal-card";
    div.setAttribute("data-id", goal.id);

    const progress = Math.min(100, Math.floor((goal.savedAmount / goal.targetAmount) * 100));

    div.innerHTML = `
      <h3>${goal.name}</h3>
      <p>Category: ${goal.category}</p>
      <p>Target: $${goal.targetAmount.toFixed(2)}</p>
      <p>Saved: $${goal.savedAmount.toFixed(2)}</p>
      <p>Deadline: ${goal.deadline}</p>

      <div class="progress-bar">
        <div class="progress-bar-inner" style="width: ${progress}%">${progress}%</div>
      </div>

      <form class="deposit-form">
        <input type="number" step="0.01" min="0" placeholder="Deposit amount" required>
        <button type="submit">Deposit</button>
      </form>

      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    `;

    goalsList.appendChild(div);

    // Deposit money handler
    const depositForm = div.querySelector(".deposit-form");
    depositForm.addEventListener("submit", e => {
      e.preventDefault();
      const amountInput = depositForm.querySelector("input");
      const amount = parseFloat(amountInput.value);
      if (amount <= 0 || isNaN(amount)) return alert("Please enter a valid deposit amount.");

      const updatedAmount = goal.savedAmount + amount;

      fetch(`http://localhost:3000/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ savedAmount: updatedAmount })
      })
      .then(res => res.json())
      .then(() => fetchAndDisplayGoals());
    });

    // Delete goal handler
    div.querySelector(".delete-btn").addEventListener("click", () => {
      if (confirm(`Delete goal "${goal.name}"?`)) {
        fetch(`http://localhost:3000/goals/${goal.id}`, { method: "DELETE" })
          .then(() => fetchAndDisplayGoals());
      }
    });

    // Edit goal handler
    div.querySelector(".edit-btn").addEventListener("click", () => {
      showEditForm(goal, div);
    });
  }

  // Show the edit form for a goal
  function showEditForm(goal, container) {
    container.innerHTML = `
      <form class="edit-goal-form">
        <input type="text" name="name" value="${goal.name}" required />
        <input type="number" name="targetAmount" value="${goal.targetAmount}" required />
        <input type="text" name="category" value="${goal.category}" required />
        <input type="date" name="deadline" value="${goal.deadline}" required />
        <button type="submit">Save</button>
        <button type="button" class="cancel-btn">Cancel</button>
      </form>
    `;

    const editForm = container.querySelector(".edit-goal-form");
    const cancelBtn = container.querySelector(".cancel-btn");

    // Cancel edit
    cancelBtn.addEventListener("click", () => {
      container.remove();
      fetchAndDisplayGoals();
    });

    // Submit edit
    editForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const updatedGoal = {
        name: editForm.name.value,
        targetAmount: parseFloat(editForm.targetAmount.value),
        category: editForm.category.value,
        deadline: editForm.deadline.value
      };

      fetch(`http://localhost:3000/goals/${goal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedGoal)
      })
      .then(res => res.json())
      .then(() => fetchAndDisplayGoals());
    });
  }

  // Update overview stats and warnings
  function updateOverview(goals) {
    const totalGoals = goals.length;
    const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
    const goalsCompleted = goals.filter(g => g.savedAmount >= g.targetAmount).length;

    document.getElementById("total-goals").textContent = totalGoals;
    document.getElementById("total-saved").textContent = totalSaved.toFixed(2);
    document.getElementById("goals-completed").textContent = goalsCompleted;

    const warningDiv = document.getElementById("deadlines-warning");
    warningDiv.innerHTML = "";

    const now = new Date();

    goals.forEach(goal => {
      const deadlineDate = new Date(goal.deadline);
      const daysLeft = (deadlineDate - now) / (1000 * 60 * 60 * 24);

      if (goal.savedAmount < goal.targetAmount) {
        if (daysLeft < 0) {
          // Overdue
          const p = document.createElement("p");
          p.style.color = "red";
          p.textContent = `Goal "${goal.name}" is Overdue! Deadline was ${goal.deadline}.`;
          warningDiv.appendChild(p);
        } else if (daysLeft <= 30) {
          // Warning
          const p = document.createElement("p");
          p.style.color = "orange";
          p.textContent = `Goal "${goal.name}" deadline is within 30 days (${goal.deadline}).`;
          warningDiv.appendChild(p);
        }
      }
    });
  }
});