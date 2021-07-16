import jsc3l_config from './jsc3l_config'

const jsc3l_connection = function () {}

///
// [High level] Look for an available IPFS/IPNS node and store it in the localstorage under 'ComChainRepo'
///

jsc3l_connection.ensureComChainRepo = async function () {
  // 1. Check if a list of end-point is stored locally (avoid a IPNS slow call)
  let storedEndPoints = []
  try {
    storedEndPoints = JSON.parse(localStorage.getItem('ComChainApiNodes'))
  } catch (e) {
    storedEndPoints = []
  }

  if (await checkRepo(storedEndPoints)) return true

  // 2. No locally stored nodes available, try the hard-coded Com-Chain list
  if (await checkRepo(jsc3l_config.confEndPointsOur)) return true

  // 3. As a backup try standard ipfs servers
  return checkRepo(jsc3l_config.confEndPointsOther)
}

///
// [High level] Get the list of end-points and randomly select a up and running one
///
jsc3l_connection.acquireEndPoint = async function () {
  if (!await jsc3l_connection.getCCEndPointList()) return false
  const endpoint_list = JSON.parse(localStorage.getItem('ComChainApiNodes'))
  return jsc3l_connection.selectEndPoint(endpoint_list)
}

///
// [Lower level] Get from the IPFS/IPNS node stored it in the localstorage under 'ComChainRepo' the list of ComChain end-points
///
jsc3l_connection.getCCEndPointList = function () {
  // TODO: use http object
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', localStorage.getItem('ComChainRepo') + jsc3l_config.nodesRepo + '?_=' + new Date().getTime(), true)
    xhr.responseType = 'json'
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return
      if (xhr.status !== 200) {
        resolve(false)
        return
      }

      try {
        let to_push = xhr.response
        if (typeof to_push === 'object') {
          to_push = JSON.stringify(xhr.response)
        }

        localStorage.setItem('ComChainApiNodes', to_push)
        resolve(true)
      } catch (e) {
        resolve(false)
      }
    }
    xhr.send()
  })
}

///
// [Lower level] Select a ComChain end-point with up and running APIs
///
jsc3l_connection.selectEndPoint = async function (nodes) {
  if (nodes.length === 0) {
    localStorage.removeItem('ComChainApiNodes')
    return false
  }
  // randomly select a node (poor man's load balancing)
  const id = Math.floor((Math.random() * nodes.length))
  const node = nodes[id]

  // check the node is up and running
  const success = await jsc3l_connection.testNode(node)
  if (success) {
    // store the node
    localStorage.setItem('ComChainAPI', node)
    return true
  }
  nodes.splice(id, 1)
  return jsc3l_connection.selectEndPoint(nodes)
}

///
// [Lower level] Test if a end-point has up and running APIs
///
jsc3l_connection.testNode = async function (api_address) {
  const result = await testDbApi(api_address)
  if (!result) return false

  return testApi(api_address)
}

/// /////////////////////////////////////////////////////////////////////////////
var checkRepo = async function (repoList) {
  if (!repoList || repoList.length == 0) {
    return false
  }
  // TODO: use http
  const id = Math.floor((Math.random() * repoList.length))
  const repo = repoList[id]

  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', repo + jsc3l_config.ping, true)
    xhr.responseType = 'json'
    xhr.timeout = 3000
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return
      if (xhr.status !== 200) {
        repoList.splice(id, 1)
        checkRepo(repoList).then(resolve)
        return
      }
      localStorage.setItem('ComChainRepo', repo)
      resolve(true)
    }

    xhr.send()
  })
}

var testApi = function (api_address) {
  // TODO: use http
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', api_address + '/api.php', true)
    xhr.responseType = 'json'
    xhr.timeout = 5000
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return

      if (xhr.status !== 200) {
        resolve(false)
        return
      }
      try {
        let answer = xhr.response
        if (typeof answer === 'object') {
          answer = JSON.stringify(xhr.response)
        }
        resolve(answer && answer != 'null' && !answer.error)
      } catch (e) {
        resolve(false)
      }
    }
    xhr.send()
  })
}

var testDbApi = function (api_address) {
  // TODO: use http
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', api_address + '/dbcheck.php', true)
    xhr.timeout = 5000
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return
      if (xhr.status !== 200) {
        resolve(false)
        return
      }

      try {
        resolve(xhr.response === 'pong')
      } catch (e) {
        resolve(false)
      }
    }
    xhr.send()
  })
}

/// /////////////////////////////////////////////////////////////////////////////

module.exports = jsc3l_connection
