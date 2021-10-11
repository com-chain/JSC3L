
function httpRequest (method, url, data, opts) {
  return new Promise(function (resolve, reject) {
    const xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange = function () {
      if (this.readyState !== 4) return

      let data = this.response
      if (typeof data === 'string') {
        let parsedData
        try {
          parsedData = JSON.parse(data)
        } catch (err) {
          parsedData = data
          // const printableData = data.length > 200
          //   ? `${data.slice(0, 200)}..`
          //   : data
          // reject(new Error(`Data is not parseable JSON: ${printableData}`))
          // return
        }
        data = parsedData
      }
      if (this.status === 0) {
        reject(new Error('Invalid request'))
        return
      }
      if (this.status.toString().slice(0, 1) !== '2') {
        reject(new Error(`Request failed with status ${this.status}`))
        return
      }

      resolve({
        data,
        status: this.status,
        statusText: this.statusText
      })
    }
    xhttp.open(method, url, true)
    if (opts?.timeout) xhttp.timeout = opts.timeout
    if (opts?.responseType) xhttp.responseType = opts.responseType
    if (method === 'POST') {
      xhttp.setRequestHeader(
        'Content-Type', 'application/x-www-form-urlencoded')
      xhttp.send(data)
    } else if (method === 'GET') {
      xhttp.send()
    } else {
      throw new Error(`Unknown http method ${method}`)
    }
  })
}


interface IJsonHasData {
    data: any;
}

function isJsonHasData(elt): elt is IJsonHasData {
   return (elt as IJsonHasData).data !== undefined;
}

/**
 * Support passing data to querystring when method is GET.
 */
export class Http {
  static async request (...[method, url, data, opts]: any[]) {
    if (method === 'GET' && data && Object.keys(data).length > 0) {
      url += '?' + (new URLSearchParams(data)).toString()
    }

    const xhr = await httpRequest(
        method, url, method === 'GET' ? null : data, opts)
    if (!isJsonHasData(xhr)) {
      throw new Error(`Missing 'data' in JSON response from ${method} call on ${url}.`)
    }
    return xhr.data
  }

  static get (...args: any[]) { return this.request('GET', ...args) }
  static post (...args: any[]) { return this.request('POST', ...args) }
}
