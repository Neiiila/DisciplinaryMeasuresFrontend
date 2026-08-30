export interface LoginCredentials {
  /** Either the employee's email address or their employee id. */
  identifier: string
  password: string
}

export interface RegisterPayload {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginResponse {
  token: string
}
