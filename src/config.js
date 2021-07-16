

const config = function () {}

config.confEndPointsOur = [
  'https://node-001.cchosting.org',
  'https://node-002.cchosting.org',
  'https://node-003.cchosting.org',
  'https://node-004.cchosting.org',
  'https://node-cc-001.cchosting.org/',
  'https://api.monnaie-leman.org'
]

config.confEndPointsOther = [
  'https://ipfs.io',
  'https://ipfs.infura.io',
  'https://ipfs.jes.xxx',
  'https://siderus.io',
  'https://hardbin.com',
  'https://ipfs.infura.io',
  'https://xmine128.tk'
]

// IPNS of the list of available ComChain currency configs
config.configRepo = '/ipns/QmaAAZor2uLKnrzGCwyXTSwogJqmPjJgvpYgpmtz5XcSmR/configs'

// IPNS of the list of available ComChain end-points
config.nodesRepo = '/ipns/QmcRWARTpuEf9E87cdA4FfjBkv7rKTJyfvsLFTzXsGATbL'

// IPNS of the configuration for the different currencies
config.custoRepo = '/ipns/QmaAAZor2uLKnrzGCwyXTSwogJqmPjJgvpYgpmtz5XcSmR/resources/'

config.ping = config.configRepo + '/ping.json'

module.exports = config
