import * as config from './config'

///
// [High level] Look for an available IPFS/IPNS node and store it in
// the localstorage under 'ComChainRepo'
///

export async function ensureComChainRepo () {
  // 1. Check if a list of end-point is stored locally (avoid a IPNS slow call)
  let storedEndPoints = []
  try {
    storedEndPoints = JSON.parse(localStorage.getItem('ComChainApiNodes'))
  } catch (e) {
    storedEndPoints = []
  }

  if (await checkRepo(storedEndPoints)) return true

  // 2. No locally stored nodes available, try the hard-coded Com-Chain list
  if (await checkRepo(config.confEndPointsOur)) return true

  // 3. As a backup try standard ipfs servers
  return checkRepo(config.confEndPointsOther)
}

///
// [High level] Get the list of end-points and randomly select a up
// and running one
///
export async function acquireEndPoint () {
  if (!await getCCEndPointList()) return false
  const endpointList = JSON.parse(localStorage.getItem('ComChainApiNodes'))
  return selectEndPoint(endpointList)
}

///
// [Lower level] Get from the IPFS/IPNS node stored it in the
// localstorage under 'ComChainRepo' the list of ComChain end-points
///
function getCCEndPointList () {
  // TODO: use http object
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', localStorage.getItem('ComChainRepo') +
             config.nodesRepo + '?_=' + new Date().getTime(), true)
    xhr.responseType = 'json'
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState !== 4) return
      if (xhr.status !== 200) {
        resolve(false)
        return
      }

      try {
        localStorage.setItem(
          'ComChainApiNodes',
          (typeof xhr.response === 'object')
            ? JSON.stringify(xhr.response)
            : xhr.response
        )
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
async function selectEndPoint (nodes) {
  if (nodes.length === 0) {
    localStorage.removeItem('ComChainApiNodes')
    return false
  }
  // randomly select a node (poor man's load balancing)
  const id = Math.floor((Math.random() * nodes.length))
  const node = nodes[id]

  // check the node is up and running
  const success = await testNode(node)
  if (success) {
    // store the node
    localStorage.setItem('ComChainAPI', node)
    return true
  }
  nodes.splice(id, 1)
  return selectEndPoint(nodes)
}

///
// [Lower level] Test if a end-point has up and running APIs
///
async function testNode (apiAddress) {
  const result = await testDbApi(apiAddress)
  if (!result) return false

  return testApi(apiAddress)
}

// /////////////////////////////////////////////////////////////////////////////
async function checkRepo (repoList) {
  if (!repoList || repoList.length === 0) {
    return false
  }
  // TODO: use http
  const id = Math.floor((Math.random() * repoList.length))
  const repo = repoList[id]

  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', repo + config.ping, true)
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

function testApi (apiAddress) {
  // TODO: use http
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', apiAddress + '/api.php', true)
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
        resolve(answer && answer !== 'null' && !answer.error)
      } catch (e) {
        resolve(false)
      }
    }
    xhr.send()
  })
}

function testDbApi (apiAddress) {
  // TODO: use http
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest()
    xhr.open('GET', apiAddress + '/dbcheck.php', true)
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
