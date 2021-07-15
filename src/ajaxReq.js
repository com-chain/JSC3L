import { getEndpointAddress } from './jsc3l_customization'

/* AJAX Request to the backend */

class http {
  static isSuccess (status) { return status >= 200 && status < 300 }

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

          if (http.isSuccess(this.status) && !error) {
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

          if (http.isSuccess(this.status) && !error) {
            resolve(respData)
          } else {
            reject(respData)
          }
        }
      }
      xhttp.open('POST', url, true)

      // set headers
      xhttp.setRequestHeader(
        'Content-Type', 'application/x-www-form-urlencoded')

      // send request
      xhttp.send(data)
    })
  }
}

/// ///////////////////////////

const isScope = function (obj) {
  return obj && obj.$evalAsync && obj.$watch
}

const isWindow = function (obj) {
  return obj && obj.window === obj
}

const toJsonReplacer = function (key, value) {
  let val = value
  if (typeof key === 'string' &&
      key.charAt(0) === '$' &&
      key.charAt(1) === '$') {
    val = undefined
  } else if (isWindow(value)) {
    val = '$WINDOW'
  } else if (value && window.document === value) {
    val = '$DOCUMENT'
  } else if (isScope(value)) {
    val = '$SCOPE'
  }
  return val
}

const isNumber = function (arg) {
  return typeof arg === 'number'
}

const toJson = function (obj, pretty) {
  if (isUndefined(obj)) { return undefined }
  if (!isNumber(pretty)) {
    pretty = pretty ? 2 : null
  }
  return JSON.stringify(obj, toJsonReplacer, pretty)
}

const isDate = function (value) {
  return toString.call(value) === '[object Date]'
}

const isObject = function (value) {
  return value !== null && typeof value === 'object'
}

const serializeValue = function (v) {
  if (isObject(v)) {
    return isDate(v) ? v.toISOString() : toJson(v)
  }
  return v
}

const encodeUriQuery = function (val, pctEncodeSpaces) {
  return encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%3B/gi, ';')
    .replace(/%20/g, pctEncodeSpaces ? '%20' : '+')
}

const isUndefined = function (value) {
  return typeof value === 'undefined'
}

const forEachSorted = function (obj, iterator, context) {
  const keys = Object.keys(obj).sort()
  for (let i = 0; i < keys.length; i++) {
    iterator.call(context, obj[keys[i]], keys[i])
  }
  return keys
}

const postSerializer = function (params) {
  if (!params) return ''

  const parts = []
  serialize(params, '', true)
  return parts.join('&')

  function serialize (toSerialize, prefix, topLevel) {
    if (toSerialize === null || isUndefined(toSerialize)) { return }
    if (Array.isArray(toSerialize)) {
      toSerialize.forEach(function (value, index) {
        serialize(value, prefix + '[' + (isObject(value) ? index : '') + ']')
      })
    } else if (isObject(toSerialize) && !isDate(toSerialize)) {
      forEachSorted(toSerialize, function (value, key) {
        serialize(value,
          prefix + (topLevel ? '' : '[') + key + (topLevel ? '' : ']'))
      })
    } else {
      parts.push(
        encodeUriQuery(prefix) + '=' +
          encodeUriQuery(serializeValue(toSerialize)))
    }
  }
}

/// /////////////////////////////////////////

class URL {
  static SERVER = 'api.php';
  static ENROLL = 'enroll.php';
  static TRANLIST = 'trnslist.php';
  static TRANCHECK = 'api.php';
  static EXPORTTRAN = 'export.php';
  static GETCODE = 'getuid.php';
  static GETADDRESS = 'getadd.php';
  static KEYSTORE = 'keys.php';
  static requestMessages = 'requestMessages.php';
}

class AjaxReq {
  pendingPosts = []
  config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    }
  }

  post (data, callback) {
    this.pendingPosts.push({ data: data, callback: callback })

    if (this.pendingPosts.length === 1) {
      this.queuePost()
    }
  }

  enrollPost (data, callback) {
    http.post(getEndpointAddress() + URL.ENROLL,
      postSerializer(data), this.config).then(function (data) {
      callback(data.data)
    })
  }

  getBalance (addr, callback) {
    this.post({ balance: addr }, callback)
  }

  getTransactionData (addr, callback) {
    this.post({ txdata: addr }, callback)
  }

  sendRawTx (rawTx, additionalData, callback) {
    const postData = { rawtx: rawTx }
    if (additionalData &&
        Object.keys(additionalData) &&
        Object.keys(additionalData).length > 0) {
      for (const item in additionalData) {
        postData[item] = additionalData[item]
      }
    }
    this.post(postData, callback)
  }

  getEstimatedGas (txobj, callback) {
    this.post({ estimatedGas: txobj }, callback)
  }

  getEthCall (txobj, callback) {
    this.post({ ethCall: txobj }, callback)
  }

  getEthCallAt (txobj, blockNb, callback) {
    this.post({ ethCallAt: txobj, blockNb: blockNb }, callback)
  }

  queuePost () {
    const data = this.pendingPosts[0].data
    const callback = this.pendingPosts[0].callback

    try {
      http.post(getEndpointAddress() + URL.SERVER,
        postSerializer(data), this.config).then(data => {
        callback(data.data)
        this.pendingPosts.splice(0, 1)
        if (this.pendingPosts.length > 0) { this.queuePost() }
      })
    } catch (err) {
      console.log(err)
      this.pendingPosts.splice(0, 1)
      if (this.pendingPosts.length > 0) { this.queuePost() }
    }
  }

  validateEnrollmentLetter (id, currency, signature, callback) {
    const data = {}
    data.id = id
    data.currency = currency
    data.signature = signature
    this.enrollPost({ data: JSON.stringify(data) }, callback)
  }

  enrollAddress (id, address, currency, token, callback) {
    const data = {}
    data.id = id
    data.adresse = address
    data.token = token
    data.currency = currency
    this.enrollPost({ data: JSON.stringify(data) }, callback)
  }

  getTransList (id, count, offset, callback) {
    http.get(getEndpointAddress() + URL.TRANLIST +
             '?addr=' + id + '&count=' + count + '&offset=' + offset)
      .then(function (data) {
        callback(data.data)
      })
  }

  getTransCheck (hash, callback) {
    http.get(getEndpointAddress() + URL.TRANCHECK + '?hash=' + hash)
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransList (id, dateStart, dateEnd, callback) {
    http.get(getEndpointAddress() + URL.EXPORTTRAN +
             '?addr=' + id + '&start=' + dateStart + '&end=' + dateEnd)
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransListWithId (id, dateStart, dateEnd, callback) {
    http.get(getEndpointAddress() + URL.EXPORTTRAN +
             '?addr=' + id + '&start=' + dateStart + '&end=' + dateEnd)
      .then(function (data) {
        callback(data.data, id)
      })
  }

  getCodesFromAddresses (addresses, currency, caller, signature, callback) {
    const data = {
      server: currency,
      caller: caller,
      signature: signature,
      addresses: addresses
    }
    http.post(getEndpointAddress() + URL.GETCODE, postSerializer(data),
      this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  getAddressesFromCode (code, currency, caller, signature, callback) {
    const data = {
      server: currency,
      caller: caller,
      signature: signature,
      code: code
    }
    http.post(getEndpointAddress() + URL.GETADDRESS,
      postSerializer(data),
      this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  getMessageKey (address, withPrivate, callback) {
    let queryString = '?addr=' + encodeURIComponent(address)
    if (withPrivate) {
      queryString = queryString + '&private=1'
    }

    http.get(getEndpointAddress() + URL.KEYSTORE + queryString)
      .then(function (data) {
        callback(data.data)
      })
  }

  publishMessageKey (dataStr, sign, callback) {
    const data = {}
    data.data = dataStr
    data.sign = sign
    http.post(getEndpointAddress() + URL.KEYSTORE,
      postSerializer(data), this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  requestUnlock (address, url, callback) {
    const data = {}
    data.address = address
    http.post(url, postSerializer(data), this.config)
      .then(function (data) {
        callback(data)
      })
  }

  getReqMessages (addFrom, addTo, callback) {
    const queryString = '?add_req=' + encodeURIComponent(addFrom) +
          '&add_cli=' + encodeURIComponent(addTo)

    http.get(getEndpointAddress() + URL.requestMessages +
             queryString).then(function (data) {
      callback(data.data)
    })
  }

  publishReqMessages (dataStr, sign, callback) {
    const data = {}
    data.data = dataStr
    data.sign = sign
    http.post(getEndpointAddress() + URL.requestMessages,
      postSerializer(data), this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  currBlock (callback) {
    http.get(getEndpointAddress() + URL.SERVER)
      .then(function (data) {
        callback(data.data)
      })
  }

  getBlock (hash, callback) {
    http.get(getEndpointAddress() + URL.SERVER + '?hash=' + hash)
      .then(function (data) {
        if (data.data && typeof data.data !== 'object') {
          data.data = JSON.parse(data.data).transaction
        }

        callback(data.data)
      })
  }
}

export default new AjaxReq()
