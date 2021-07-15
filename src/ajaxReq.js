import { Endpoint } from './endpoint'

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

  post (data, callback) {
    this.pendingPosts.push({ data: data, callback: callback })

    if (this.pendingPosts.length === 1) {
      this.queuePost()
    }
  }

  enrollPost (data, callback) {
    Endpoint.post(URL.ENROLL, data, this.config)
      .then(function (data) {
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
      Endpoint.post(URL.SERVER, data, this.config).then(data => {
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
    Endpoint.get(URL.TRANLIST +
             '?addr=' + id + '&count=' + count + '&offset=' + offset)
      .then(function (data) {
        callback(data.data)
      })
  }

  getTransCheck (hash, callback) {
    Endpoint.get(URL.TRANCHECK + '?hash=' + hash)
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransList (id, dateStart, dateEnd, callback) {
    Endpoint.get(URL.EXPORTTRAN +
             '?addr=' + id + '&start=' + dateStart + '&end=' + dateEnd)
      .then(function (data) {
        callback(data.data)
      })
  }

  getExportTransListWithId (id, dateStart, dateEnd, callback) {
    Endpoint.get(URL.EXPORTTRAN +
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
    Endpoint.post(URL.GETCODE, data,
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
    Endpoint.post(URL.GETADDRESS,
      data,
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

    Endpoint.get(URL.KEYSTORE + queryString)
      .then(function (data) {
        callback(data.data)
      })
  }

  publishMessageKey (dataStr, sign, callback) {
    const data = {}
    data.data = dataStr
    data.sign = sign
    Endpoint.post(URL.KEYSTORE,
      data, this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  requestUnlock (address, url, callback) {
    const data = {}
    data.address = address
    Endpoint.post(url, data, this.config)
      .then(function (data) {
        callback(data)
      })
  }

  getReqMessages (addFrom, addTo, callback) {
    const queryString = '?add_req=' + encodeURIComponent(addFrom) +
          '&add_cli=' + encodeURIComponent(addTo)

    Endpoint.get(URL.requestMessages +
             queryString).then(function (data) {
      callback(data.data)
    })
  }

  publishReqMessages (dataStr, sign, callback) {
    const data = {}
    data.data = dataStr
    data.sign = sign
    Endpoint.post(URL.requestMessages,
      data, this.config)
      .then(function (data) {
        callback(data.data)
      })
  }

  currBlock (callback) {
    Endpoint.get(URL.SERVER)
      .then(function (data) {
        callback(data.data)
      })
  }

  getBlock (hash, callback) {
    Endpoint.get(URL.SERVER + '?hash=' + hash)
      .then(function (data) {
        if (data.data && typeof data.data !== 'object') {
          data.data = JSON.parse(data.data).transaction
        }

        callback(data.data)
      })
  }
}

export default new AjaxReq()
