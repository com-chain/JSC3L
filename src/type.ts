export const httpMethods = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'HEAD'
] as const

export type httpMethod = typeof httpMethods[number]

export type coreHttpOpts = {
    protocol: string
    host: string
    path: string
    method: httpMethod
    headers?: {}
    port?: number
    data?: any        // TODO: inconsistency with lokapi here
    timeout?: number
}

export type HttpRequest = (opts: coreHttpOpts) => Object

export interface IPersistentStore {
  get(key: string, defaultValue?: string): string
  set(key: string, value: string): void
  del(key: string): void
}

export type UrlParts = {
    protocol: string
    host: string
    port: number
    path: string
}

