export class APIError extends Error {
  data: string
  constructor (message, data) {
    super(message)
    this.name = 'APIError'
    this.data = data
  }
}


