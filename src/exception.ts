export class APIError extends Error {
  data: string
  constructor (message, data) {
    super(message)
    this.name = 'APIError'
    this.data = data
  }
}

export class NoEndpointAvailable extends Error {
  data: string
  constructor (message) {
    super(message)
    this.name = 'NoEndpointAvailable'
  }
}
