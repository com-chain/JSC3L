import { Http } from './http'
import { postSerializer } from './serializer'
import { getEndpointAddress } from '../customization'

/**
 * Serialize data, adds default config and transfer to code http module
 *
 */
class PostSerializedHttp extends Http {
  static post (url, data) { return super.post(url, postSerializer(data)) }
}

/**
 * Prepend endpoint address to url, and support passing data to
 * querystring when method is GET.
 */
export class Endpoint extends PostSerializedHttp {
  static request (method, url, data) {
    url = url.includes('://') ? url : getEndpointAddress() + url
    if (method === 'GET' && Object.keys(data).length != 0) {
      url += '?' + (new URLSearchParams(data)).toString()
    }

    return super.request(method, url, method === 'GET' ? null : data)
  }
}
