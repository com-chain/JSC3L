import { Http } from './http'
import { postSerializer } from './serializer'
import { getEndpointAddress } from '../customization'

/**
 * Serialize data, adds default config and transfer to code http module
 *
 */
class PostSerializedHttp extends Http {
  static post (url, data, opts) {
    return super.post(url, postSerializer(data), opts)
  }
}

/**
 * Prepend endpoint address to url, and support passing data to
 * querystring when method is GET.
 */
export class Endpoint extends PostSerializedHttp {
  static request (method, url, ...args) {
    url = url.includes('://') ? url : getEndpointAddress() + url
    return super.request(method, url, ...args)
  }
}
