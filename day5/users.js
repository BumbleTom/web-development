const loadUsersButton =
  document.querySelector("#load-users");

const filterInput =
  document.querySelector("#filter-input");

const status =
  document.querySelector("#status");

const usersList =
  document.querySelector("#users-list");

let users = [];

/* Render users */

function renderUsers(list) {

  usersList.textContent = "";

  if (list.length === 0) {

    const li =
      document.createElement("li");

    li.textContent =
      "No users match your filter.";

    usersList.appendChild(li);

    return;
  }

  list.forEach(user => {

    const li =
      document.createElement("li");

    const name =
      document.createElement("h3");

    name.textContent =
      user.name;

    const email =
      document.createElement("p");

    email.textContent =
      `Email: ${user.email}`;

    const city =
      document.createElement("p");

    city.textContent =
      `City: ${user.address.city}`;

    const company =
      document.createElement("p");

    company.textContent =
      `Company: ${user.company.name}`;

    li.appendChild(name);
    li.appendChild(email);
    li.appendChild(city);
    li.appendChild(company);

    usersList.appendChild(li);

  });

}

/* Load users */

async function loadUsers() {

  loadUsersButton.disabled = true;

  status.textContent =
    "Loading users...";

  try {

    const response =
      await fetch(
        "https://jsonplaceholder.typicode.com/users"
      );

    if (!response.ok) {
      throw new Error(
        "Request failed."
      );
    }

    users =
      await response.json();

    renderUsers(users);

    status.textContent =
      `Successfully loaded ${users.length} users.`;

  }

  catch (error) {

    status.textContent =
      "Error loading users.";

  }

  finally {

    loadUsersButton.disabled = false;

  }

}

/* Load button */

loadUsersButton.addEventListener(
  "click",
  loadUsers
);

/* Filter */

filterInput.addEventListener(
  "input",
  event => {

    const searchText =
      event.target.value
      .toLowerCase();

    const filteredUsers =
      users.filter(user =>
        user.name
          .toLowerCase()
          .includes(searchText)
      );

    renderUsers(filteredUsers);

  }
);