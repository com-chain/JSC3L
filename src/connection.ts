import * as config from './config'
import HttpAbstract from './rest/http'
import * as t from './type'


abstract class ConnectionAbstract {

  protected abstract http: HttpAbstract


  ///
  // [High level] Look for an available IPFS/IPNS node and return it
  ///

  public async lookupAvailableComChainRepo (storedEndPointsSuggestion?: string[]) {
    // 1. Check if a list of endpoint is stored locally (avoid a IPNS slow call)
    const storedEndPoints = storedEndPointsSuggestion || []

    const endPointLists = [
      storedEndPoints, // 1. try locally stored end-points if any
      config.confEndPointsOur, // 2. try the hard-coded Com-Chain list
      config.confEndPointsOther // 3. As a backup try standard ipfs servers (slow)
    ]

    for (let i = 0; i < endPointLists.length; i++) {
      const repo = await this.checkRepo(endPointLists[i])
      if (repo) return repo
    }
    return false
  }

  ///
  // [High level] Get the list of endpoints and randomly select a up
  // and running one
  ///
  public async acquireEndPoint (repo: string) {
    const apiNodes = await this.getCCEndPointList(repo)
    if (!apiNodes) return false
    const endpoint = await this.selectEndPoint(apiNodes)
    return { apiNodes, endpoint }
  }

  ///
  // [Lower level] Get the list of ComChain end-points from given repo
  ///
  async getCCEndPointList (repo: string) {
    try {
      return await this.http.get(
        repo + config.nodesRepo,
        { _: new Date().getTime() })
    } catch (e) {
      console.error(`Failed to get endpoint list on ${repo}`, e)
      return false
    }
  }

  ///
  // [Lower level] Select a ComChain end-point with up and running APIs
  ///
  async selectEndPoint (nodes: string[]) {
    while (nodes.length > 0) {
      // randomly select a node (poor man's load balancing)
      const id = Math.floor((Math.random() * nodes.length))
      const node = nodes[id]

      // check the node is up and running
      const success = await this.testNode(node)
      if (success) return node
      nodes.splice(id, 1)
    }
    return false
  }

  ///
  // [Lower level] Test if a end-point has up and running APIs
  ///
  async testNode (apiAddress) {
    const result = await this.testDbApi(apiAddress)
    if (!result) return false

    return this.testApi(apiAddress)
  }


  // //////////////////////////////////////////////////////////////////////////

  async checkRepo (repoList) {
    while (repoList?.length) {
      const id = Math.floor((Math.random() * repoList.length))
      const repo = repoList[id]
      try {
        await this.http.get(repo + config.ping, null, { timeout: 3000 })
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

  async testApi (apiAddress) {
    try {
      const answer = await this.http.get(
        apiAddress + '/api.php', null,
        { timeout: 5000 })
      return answer !== 'null' && !answer.error && answer
    } catch (err) {
      console.log(`API Check: HTTP request to ${apiAddress} failed`, err)
      return false
    }
  }

  async testDbApi (apiAddress) {
    try {
      const answer = await this.http.get(
        apiAddress + '/dbcheck.php', null,
        { timeout: 5000 })
      return answer === 'pong'
    } catch (err) {
      console.log(`DbAPI Check: HTTP request to ${apiAddress} failed`, err)
      return false
    }
  }


  /**
   * Gets the configuration for the given currency
   *
   */
  public async getConfJSON (repo, currencyName) {
    try {
      return await this.http.get(
        `${repo}${config.configRepo}/${currencyName}.json`,
        { _: new Date().getTime() })
    } catch (err) {
      return false
    }
  }

}


/**
 * Manages Persistent Store to keep list of nodes and avoid IPFS lookup
 * when possible.
 *
 */
export default abstract class ConnectionMgrAbstract extends ConnectionAbstract {

  protected abstract persistentStore: t.IPersistentStore

  repo: string
  conf: any
  endpoint: string


  /**
   * This lookup will store result in memory for speeding other methods.
   */
  public async lookupAvailableComChainRepo (storedEndPointsSuggestion?: string[]) {

    if (!storedEndPointsSuggestion) {
      const apiNodeSuggestions = this.persistentStore.get('ApiNodes', '[]')
      storedEndPointsSuggestion = JSON.parse(apiNodeSuggestions)
    }
    const repo = await super.lookupAvailableComChainRepo(storedEndPointsSuggestion)
    if (!repo) {
      throw new Error('No repository available.')
    }
    this.repo = repo
    return repo
  }


  /**
   * This lookup will store result in memory for speeding other methods.
   * and saves the result in persistentStore for faster calls.
   */
  public async acquireEndPoint (repo?: string) {
    if (!repo) {
      if (!this.repo) {
        // Will have a look in the persistent store for suggestions,
        // and save in `this.repo` the result for other methods.
        await this.lookupAvailableComChainRepo()
      }
      repo = this.repo
    }
    const apiNodesEndpoint = await super.acquireEndPoint(repo)
    if (!apiNodesEndpoint) {
      throw new Error('Endpoint list retrieval failed.')
    }
    const { apiNodes, endpoint } = apiNodesEndpoint
    if (typeof endpoint !== 'string') {
      throw new Error('No endpoint in list seems available.')
    }

    this.persistentStore.set('ApiNodes', JSON.stringify(apiNodes))
    this.endpoint = endpoint
    return { apiNodes, endpoint }
  }


  /**
   * This lookup will store result in memory for speeding other methods.
   * and saves the result in persistentStore for faster calls.
   * - If argument `repo` is not provided, it'll use the last one in memory
   * leaved by a previous call of `lookupAvailableComChainRepo()`.
   * - If no previous call was made, it'll do one.
   */
  public async getConfJSON (currencyName: string, repo?: string) {
    if (!repo) {
      if (!this.repo) {
        // Will have a look in the persistent store for suggestions,
        // and save in `this.repo` the result for other methods.
        await this.lookupAvailableComChainRepo()
      }
      repo = this.repo
    }
    const conf = await super.getConfJSON(repo, currencyName)
    if (!conf) {
      throw new Error('Failed to get conf.')
    }
    this.persistentStore.set('ServerConf', JSON.stringify(conf))
    this.conf = conf
    // Completing with other informations
    conf.repo = repo
    conf.custoRepo = repo + config.custoRepo
    return conf
  }


  /**
   * Return conf stored in memory or persistent storage (need to
   * be not async).
   */
  public getLocalConfJSON () {
    if (this.conf) return this.conf
    const cfgJson = this.persistentStore.get('ServerConf')
    if (!cfgJson) return null
    const cfg = JSON.parse(cfgJson)
    // Completing with other informations if available

    if (this.repo) {
      cfg.repo = this.repo
      cfg.custoRepo = this.repo + config.custoRepo
    }
    return cfg
  }

}
