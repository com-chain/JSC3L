
import { APIError } from '../exception'

class URL {
  static SERVER = 'api.php';
  static ENROLL = 'enroll.php';
  static TRANLIST = 'trnslist.php';
  static EXPORTTRAN = 'export.php';
  static GETCODE = 'getuid.php';
  static GETADDRESS = 'getadd.php';
  static KEYSTORE = 'keys.php';
  static requestMessages = 'requestMessages.php';
}

function cmpEthCallAt(d1, d2) {
  return (d1.ethCallAt.data === d2.ethCallAt.data &&
    d1.ethCallAt.to === d2.ethCallAt.to &&
    d1.blockNb === d2.blockNb)
}

const postPromises = new WeakMap()


export default abstract class AjaxReqAbstract {

  // XXXvlab: need to be public only to allow integrated mode (used in
  // ``jsc3l.wallet``)
  public abstract endpoint: any

  pendingPosts: {
    data: any,
    resolve: Function | Function[],
    reject: Function | Function[],
  }[] = []

  //
  // URL.SERVER POST requests (that are using queuing mecanism)
  //

  post (data) {
    const { queuePost, pendingPosts } = this
    const bindQueuePost = queuePost.bind(this)
    // remove duplicate
    for (const [idx, req] of pendingPosts.entries()) {
      if (req.data.hasOwnProperty("ethCallAt")) {
        if (typeof req.reject !== "function") {
          throw new Error("Unexpected value")
        }
        if (typeof req.resolve !== "function") {
          throw new Error("Unexpected value")
        }
        if (cmpEthCallAt(data, req.data)) {
          console.log("dedup")
          return postPromises.get(req.data)
        }
        break
      }
      if (req.data.hasOwnProperty("batch")) {
        for (const reqData of req.data.batch) {
          if (cmpEthCallAt(data, reqData)) {
            console.log("dedup")
            return postPromises.get(reqData)
          }
        }
        break
      }
    }

    const promise = new Promise(function (resolve, reject) {
      let added = false
      if (data.hasOwnProperty("ethCallAt")) {
        // look for other to aggregate
        for (const [idx, req] of pendingPosts.entries()) {
          if (req.data.hasOwnProperty("ethCallAt")) {
            if (typeof req.reject !== "function") {
              throw new Error("Unexpected value")
            }
            if (typeof req.resolve !== "function") {
              throw new Error("Unexpected value")
            }
            // bingo, let's transform it to a batch
            pendingPosts[idx] = {
              data: { batch: [req.data, data] },
              resolve: [req.resolve, resolve],
              reject: [req.reject, reject],
            }
            added = true
            break
          }
          if (req.data.hasOwnProperty("batch")) {
            (req.data.batch as Function[]).push(data);
            (req.resolve as Function[]).push(resolve);
            (req.reject as Function[]).push(reject)
            added = true
            break
          }
        }
      }
      if (!added) {
        pendingPosts.push({ data, resolve, reject })
      }

      // give the handle to potential other deferred
      setTimeout(bindQueuePost, 0)
    })
    postPromises.set(data, promise)
    return promise
  }

  private async queuePost () {
    const posts = this.pendingPosts.splice(0)  // empties pendingPosts
    if (posts.length == 0) return
    await Promise.allSettled(posts.map(
      async ({data, resolve, reject}) => {
        // patching batch
        if (data.hasOwnProperty("batch")) {
          data.batch = data.batch.map((x: any) => ({
            ethCall: x.ethCallAt,
            blockNb: x.blockNb,
          }))
          console.log(`  Sending batch of ${data.batch.length} queries`)
        }
        const res = await this.endpoint.post(URL.SERVER, data)
        if (res.error) {
          if (!Array.isArray(reject)) reject = [reject]
          for (const r of reject) {
            r(new APIError(res.msg, res.data))
          }
          return
        }
        if (Array.isArray(resolve)) {
          for (const [idx, subRes] of res.data.entries()) {
            if (subRes.error) {
              reject[idx](new APIError(subRes.error.msg, subRes.data))
            } else {
              resolve[idx](subRes.data)
            }
          }
          return
        }
        resolve(res.data)
      }
    ))
  }


  getBalance (addr) { return this.post({ balance: addr }) }
  getTransactionData (addr) { return this.post({ txdata: addr }) }
  sendTx (rawTx, more) { return this.post({ rawtx: rawTx, ...(more ?? {}) }) }
  getEthCall (txobj) { return this.post({ ethCall: txobj }) }

  getEthCallAt (txobj, blockNb) {
    return this.post({ ethCallAt: txobj, blockNb })
  }


  //
  // Other calls
  //

  enrollPost (data) {
    return this.endpoint.post(URL.ENROLL, { data: JSON.stringify(data) })
  }

  async getTransList (id, count, offset) {
    // for some strange reasons, the answer is stringified 2 times,
    // so we need to unpack each entry a second time.
    const data = await this.endpoint.get(URL.TRANLIST, { addr: id, count, offset })
    return data.map((dataJSON) => JSON.parse(dataJSON))
  }

  async getExportTransList (id, start, end) {
    const data = await this.endpoint.get(URL.EXPORTTRAN, { addr: id, start, end })
    return data.map((dataJSON) => JSON.parse(dataJSON))
  }

  getCodesFromAddresses (addresses, currency, caller, signature) {
    return this.endpoint.post(URL.GETCODE, {
      server: currency,
      caller,
      signature,
      addresses
    })
  }

  getAddressesFromCode (code, currency, caller, signature) {
    return this.endpoint.post(URL.GETADDRESS, {
      server: currency,
      caller,
      signature,
      code
    })
  }

  getMessageKey (addr, withPrivate) {
    const data: {[k: string]: any} = { addr }
    if (withPrivate) data.private = '1'
    return this.endpoint.get(URL.KEYSTORE, data)
  }

  publishMessageKey (data, sign) {
    return this.endpoint.post(URL.KEYSTORE, { data, sign })
  }

  requestUnlock (address, url) {
    return this.endpoint.post(url, { address })
  }

  getReqMessages (addFrom, addTo) {
    return this.endpoint.get(
      URL.requestMessages,
      { add_req: addFrom, add_cli: addTo })
  }

  publishReqMessages (data, sign) {
    return this.endpoint.post(URL.requestMessages, { data, sign })
  }

  currBlock () { return this.endpoint.get(URL.SERVER) }

  async getBlock (hash) {
    return (await this.getTransactionInfo(hash)).transaction
  }

  async getTransactionInfo (hash) {
    let res = await this.endpoint.get(URL.SERVER, { hash })
    if (res && typeof res !== 'object') {
      res = JSON.parse(res)
    }
    return res
  }

}

