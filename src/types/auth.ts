export interface User {
  id: string;
  username: string;
  name: string;
}

export interface AuthSession {
  token: string;
  user: User;
}

export interface LoginPayload {
  username: string;
  password: string;
}
