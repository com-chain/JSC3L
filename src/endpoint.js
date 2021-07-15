import { Http } from './http'
import { postSerializer } from './serializer'
import { getEndpointAddress } from './jsc3l_customization'

/**
 * Serialize data, adds default config and transfer to code http module
 *
 */
class PostSerializedHttp extends Http {
  static get (url, data) {
    return super.get(url, data, PostSerializedHttp.config)
  }

  static post (url, data) {
    return super.post(url, postSerializer(data), PostSerializedHttp.config)
  }

  static config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  }
}

/**
 * Prepend endpoint address to url
 *
 */
export class Endpoint extends PostSerializedHttp {
  static get (url, ...args) {
    url = (url.includes('://')) ? url : getEndpointAddress() + url
    return super.get(url, ...args)
  }

  static post (url, ...args) {
    url = (url.includes('://')) ? url : getEndpointAddress() + url
    return super.post(url, ...args)
  }
}
