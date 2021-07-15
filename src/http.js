export class Http {
  static request (method, url, data) {
    return new Promise(function (resolve, reject) {
      const xhttp = new XMLHttpRequest()
      xhttp.onreadystatechange = function () {
        if (this.readyState !== 4) return

        let jsonObj = {}
        let action
        try {
          jsonObj = JSON.parse(this.response)
        } catch (err) {
          console.log(`JsonParseError: ${err}`)
          action = reject
        }

        action ??= this.status.toString().slice(0, 1) !== 2 ? resolve : reject
        action({
          data: jsonObj,
          status: this.status,
          headers: '',
          config: '',
          statusText: this.statusText
        })
      }
      xhttp.open(method, url, true)
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

  static get (url, data) { return this.request('GET', url, data) }
  static post (url, data) { return this.request('POST', url, data) }
}
