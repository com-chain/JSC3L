import jsc3l_config from './jsc3l_config'

const jsc3l_connection = function () {}

///
// [High level] Look for an available IPFS/IPNS node and store it in the localstorage under 'ComChainRepo'
///

jsc3l_connection.ensureComChainRepo = function (callback) {
  // 1. Check if a list of end-point is stored locally (avoid a IPNS slow call)
  let storedEndPoints = []
  try {
    storedEndPoints = JSON.parse(localStorage.getItem('ComChainApiNodes'))
  } catch (e) {
    storedEndPoints = []
  }

  checkRepo(storedEndPoints, function (result_stored) {
    if (result_stored) {
      callback(true)
    } else {
      // 2. No locally stored nodes available, try the hard-coded Com-Chain list
      checkRepo(jsc3l_config.confEndPointsOur, function (result) {
        if (result) {
          callback(true)
        } else {
          // 3. As a backup try standard ipfs servers
          checkRepo(jsc3l_config.confEndPointsOther, callback)
        }
      })
    }
  })
}

///
// [High level] Get the list of end-points and randomly select a up and running one
///
jsc3l_connection.acquireEndPoint = function (callback) {
  jsc3l_connection.getCCEndPointList(function (list_success) {
    if (list_success) {
      const endpoint_list = JSON.parse(localStorage.getItem('ComChainApiNodes'))
      jsc3l_connection.selectEndPoint(endpoint_list, callback)
    } else {
      callback(false)
    }
  })
}

///
// [Lower level] Get from the IPFS/IPNS node stored it in the localstorage under 'ComChainRepo' the list of ComChain end-points
///
jsc3l_connection.getCCEndPointList = function (callback) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', localStorage.getItem('ComChainRepo') + jsc3l_config.nodesRepo + '?_=' + new Date().getTime(), true)
  xhr.responseType = 'json'
  xhr.onreadystatechange = function (oEvent) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          let to_push = xhr.response
          if (typeof to_push === 'object') {
            to_push = JSON.stringify(xhr.response)
          }

          localStorage.setItem('ComChainApiNodes', to_push)
          callback(true)
        } catch (e) {
          callback(false)
        }
      } else {
        callback(false)
      }
    }
  }
  xhr.send()
}

///
// [Lower level] Select a ComChain end-point with up and running APIs
///
jsc3l_connection.selectEndPoint = function (nodes, callback) {
  if (nodes.length == 0) {
    localStorage.removeItem('ComChainApiNodes')
    callback(false)
  } else {
    // randomly select a node (poor man's load balancing)
    const id = Math.floor((Math.random() * nodes.length))
    const node = nodes[id]

    // check the node is up and running
    jsc3l_connection.testNode(node, function (success) {
      if (success) {
        // store the node
        localStorage.setItem('ComChainAPI', node)
        callback(true)
      } else {
        nodes.splice(id, 1)
        jsc3l_connection.selectEndPoint(nodes, callback)
      }
    })
  }
}

///
// [Lower level] Test if a end-point has up and running APIs
///
jsc3l_connection.testNode = function (api_address, callback) {
  testDbApi(api_address, function (result) {
    if (result) {
      testApi(api_address, callback)
    } else {
      callback(false)
    }
  })
}

/// /////////////////////////////////////////////////////////////////////////////
var checkRepo = function (repoList, callback) {
  if (!repoList || repoList.length == 0) {
    callback(false)
  } else {
    const id = Math.floor((Math.random() * repoList.length))
    const repo = repoList[id]
    const xhr = new XMLHttpRequest()
    xhr.open('GET', repo + jsc3l_config.ping, true)
    xhr.responseType = 'json'
    xhr.timeout = 3000
    xhr.onreadystatechange = function (oEvent) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          localStorage.setItem('ComChainRepo', repo)
          callback(true)
        } else {
          repoList.splice(id, 1)
          checkRepo(repoList, callback)
        }
      }
    }

    xhr.send()
  }
}

var testApi = function (api_address, callback) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', api_address + '/api.php', true)
  xhr.responseType = 'json'
  xhr.timeout = 5000
  xhr.onreadystatechange = function (oEvent) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          let answer = xhr.response
          if (typeof answer === 'object') {
            answer = JSON.stringify(xhr.response)
          }
          callback(answer && answer != 'null' && !answer.error)
        } catch (e) {
          callback(false)
        }
      } else {
        callback(false)
      }
    }
  }
  xhr.send()
}

var testDbApi = function (api_address, callback) {
  const xhr = new XMLHttpRequest()
  xhr.open('GET', api_address + '/dbcheck.php', true)
  xhr.timeout = 5000
  xhr.onreadystatechange = function (oEvent) {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          callback(xhr.response === 'pong')
        } catch (e) {
          callback(false)
        }
      } else {
        callback(false)
      }
    }
  }
  xhr.send()
}

/// /////////////////////////////////////////////////////////////////////////////

module.exports = jsc3l_connection
