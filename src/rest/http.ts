import * as t from '../type'


function getHostOrUrlParts (HostOrUrl: string): t.UrlParts {
  let protocol: string, host: string, port: number, path: string
  if (HostOrUrl.includes('://')) {
    ;[protocol, HostOrUrl] = HostOrUrl.split('://')
  } else {
    protocol = 'https'
    HostOrUrl = HostOrUrl.replace(/\/$/, '')
  }
  if (HostOrUrl.includes('/')) {
    const splits = HostOrUrl.split('/')
    ;[host, path] = [splits[0], '/' + splits.slice(1).join('/')]
  } else {
    // assume host only
    path = ''
    host = HostOrUrl
  }
  if (host.includes(':')) {
    const splits = host.split(':')
    if (splits.length > 2) {
      throw new Error(`Too many ':' to get host and port: ${host}`)
    }
    ;[host, port] = [splits[0], parseInt(splits[1])]
  } else {
    if (protocol === 'http') {
      port = 80
    } else if (protocol === 'https') {
      port = 443
    } else {
      throw new Error(
        `Could not infer port from unknown protocol ${protocol}`
      )
    }
  }
  return {
    protocol,
    host,
    port,
    path,
  }
}


/**
 * Support passing data to querystring when method is GET.
 */
export default abstract class HttpAbstract {

  protected abstract httpRequest: t.HttpRequest

  async request (...[method, url, data, opts]: any[]) {
    if (method === 'GET' && data && Object.keys(data).length > 0) {
      url += '?' + (new URLSearchParams(data)).toString()
    }

    var coreOpts = {
      method,
      data: method === 'GET' ? null : data,
      ...opts,
      ...getHostOrUrlParts(url)
    }
    return await <any> this.httpRequest(coreOpts)
  }

  get (...args: any[]) { return this.request('GET', ...args) }
  post (...args: any[]) { return this.request('POST', ...args) }
}
