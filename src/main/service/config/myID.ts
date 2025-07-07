let loginUser: number = 0

export function setMyID(id: number): void {
  loginUser = id
}

export function getMyID(): number {
  return loginUser
}
