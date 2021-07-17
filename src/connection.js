import * as config from './config'
import { Http } from './rest/http'

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

  const endPointLists = [
    storedEndPoints, // 1. try locally stored end-points if any
    config.confEndPointsOur, // 2. try the hard-coded Com-Chain list
    config.confEndPointsOther // 3. As a backup try standard ipfs servers (slow)
  ]

  for (let i = 0; i < endPointLists.length; i++) {
    const repo = await checkRepo(endPointLists[i])
    if (repo) {
      localStorage.setItem('ComChainRepo', repo)
      return repo
    }
  }
  return false
}

///
// [High level] Get the list of end-points and randomly select a up
// and running one
///
export async function acquireEndPoint () {
  const repo = localStorage.getItem('ComChainRepo')
  const apiNodes = await getCCEndPointList(repo)
  if (!apiNodes) return false
  localStorage.setItem('ComChainApiNodes', JSON.stringify(apiNodes))
  const endpoint = await selectEndPoint(apiNodes)
  if (!endpoint) {
    localStorage.removeItem('ComChainApiNodes')
    return false
  }
  // store the node
  localStorage.setItem('ComChainAPI', endpoint)
  return endpoint
}

///
// [Lower level] Get from the IPFS/IPNS node stored it in the
// localstorage under 'ComChainRepo' the list of ComChain end-points
///
function getCCEndPointList (repo) {
  return Http.get(repo + config.nodesRepo, { _: new Date().getTime() })
}

///
// [Lower level] Select a ComChain end-point with up and running APIs
///
async function selectEndPoint (nodes) {
  while (nodes.length > 0) {
    // randomly select a node (poor man's load balancing)
    const id = Math.floor((Math.random() * nodes.length))
    const node = nodes[id]

    // check the node is up and running
    const success = await testNode(node)
    if (success) return node
    nodes.splice(id, 1)
  }
  return false
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
  while (repoList?.length) {
    const id = Math.floor((Math.random() * repoList.length))
    const repo = repoList[id]
    try {
      await Http.get(repo + config.ping, null, { timeout: 3000 })
      console.log(`Connection OK to ${repo}`)
      return repo
    } catch (err) {
      console.log(`Failed to make contact ${repo} in less that 3s`)
      console.log(`  Reason: ${err}`)
      repoList.splice(id, 1)
    }
  }
  return false
}

async function testApi (apiAddress) {
  try {
    const answer = await Http.get(apiAddress + '/api.php', null,
      { timeout: 5000 })
    return answer && answer !== 'null' && !answer.error
  } catch (err) {
    console.log(`API Check: HTTP request to ${apiAddress} failed`, err)
    return false
  }
}

async function testDbApi (apiAddress) {
  try {
    const answer = await Http.get(apiAddress + '/dbcheck.php', null,
      { timeout: 5000 })
    return answer === 'pong'
  } catch (err) {
    console.log(`DbAPI Check: HTTP request to ${apiAddress} failed`, err)
    return false
  }
}
