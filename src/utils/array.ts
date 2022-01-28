export const getLastItem = <T>(array: T[]): T => {
  return array.slice(-1)[0]
}
