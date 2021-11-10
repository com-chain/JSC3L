import HttpAbstract from './http'
import postSerializer from './serializer'

/**
 * Serialize data, adds default config and transfer to code http module
 *
 */
abstract class PostSerializedHttpAbstract extends HttpAbstract {
  post (...[url, data, opts]: any[]) {
    return super.post(url, postSerializer(data), opts)
  }
}

/**
 * Prepend endpoint address to url, and support passing data to
 * querystring when method is GET.
 */
export default abstract class EndpointAbstract extends PostSerializedHttpAbstract {

  baseUrl: string

  constructor (baseUrl) {
    super()
    this.baseUrl = baseUrl
  }

  request (method, url, ...args: any[]) {
    url = url.includes('://') ? url : this.baseUrl + url
    return super.request(method, url, ...args)
  }
}
