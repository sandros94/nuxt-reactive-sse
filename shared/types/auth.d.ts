export type GitHubUser = {
  id: number
  login: string
  avatar_url: string

  [key: string]: unknown
}
export type User = GitHubUser

declare module '#auth-utils' {
  interface User extends GitHubUser {}

  // interface UserSession {}

  // interface SecureSessionData {}
}
