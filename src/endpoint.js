import { Http } from './http'
import { postSerializer } from './serializer'
import { getEndpointAddress } from './jsc3l_customization'

/**
 * Serialize data, adds default config and transfer to code http module
 *
 */
class PostSerializedHttp extends Http {
  static post (url, data) { return super.post(url, postSerializer(data)) }
}

/**
 * Prepend endpoint address to url
 *
 */
export class Endpoint extends PostSerializedHttp {
  static request (method, url, data) {
    return super.request(
      method,
      url.includes('://') ? url : getEndpointAddress() + url,
      data)
  }
}
