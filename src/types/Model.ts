export enum RoleType {
  User = 'user',
  Admin = 'admin',
  Invalid = 'invalid'
}

export type UserStatus = {
  user_id: number
  online: boolean
}

export type chatInfo = {
  id: number | null
  type: 'group' | 'user' | null
}
