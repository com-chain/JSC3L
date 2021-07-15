function isHttpSuccess (status) { return status >= 200 && status < 300 }

export class Http {
  // TODO: second arg ``config`` doesn't seem to be used
  static get (url) {
    return new Promise(function (resolve, reject) {
      const xhttp = new XMLHttpRequest()
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
          let jsonObj = {}
          let error = true
          try {
            jsonObj = JSON.parse(this.response)
            error = false
          } catch (err) {}

          const respData = {
            data: jsonObj,
            status: this.status,
            headers: '',
            config: '',
            statusText: this.statusText
          }

          if (isHttpSuccess(this.status) && !error) {
            resolve(respData)
          } else {
            reject(respData)
          }
        }
      }
      xhttp.open('GET', url, true)
      xhttp.send()
    })
  }

  // TODO: config doesn't seem to be used
  static post (url, data, config) {
    return new Promise(function (resolve, reject) {
      const xhttp = new XMLHttpRequest()
      xhttp.onreadystatechange = function () {
        if (this.readyState === 4) {
          let jsonObj = {}
          let error = true
          try {
            jsonObj = JSON.parse(this.response)
            error = false
          } catch (err) {}

          const respData = {
            data: jsonObj,
            status: this.status,
            headers: '',
            config: '',
            statusText: this.statusText
          }

          if (isHttpSuccess(this.status) && !error) {
            resolve(respData)
          } else {
            reject(respData)
          }
        }
      }
      xhttp.open('POST', url, true)

      // TODO: this could be set through config and seemed to be
      // intended that way
      xhttp.setRequestHeader(
        'Content-Type', 'application/x-www-form-urlencoded')

      xhttp.send(data)
    })
  }
}
