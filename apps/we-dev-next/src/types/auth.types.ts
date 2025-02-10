export interface UserCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  token: string;
  user: UserData;
}

export interface UserData {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}

export interface PasswordUpdateCredentials {
  email: string;
  oldPassword: string;
  newPassword: string;
}

export interface OAuthProvider {
  name: string;
  clientId: string;
  clientSecret: string;
  callbackUrl: string;
}

export interface GithubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

export interface AuthError {
  message: string;
  status: number;
}
