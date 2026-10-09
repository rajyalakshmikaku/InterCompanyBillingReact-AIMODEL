export function getLoggedUser() {
  const data = localStorage.getItem("loggedUser");
  return data ? JSON.parse(data) : null;
}
