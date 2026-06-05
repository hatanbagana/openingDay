const CLIENT_ID_KEY = "client_id";

export function getClientId() {
  if (typeof window === "undefined") {
    return "";
  }

  let id = window.localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = window.crypto.randomUUID();
    window.localStorage.setItem(CLIENT_ID_KEY, id);
  }

  return id;
}
