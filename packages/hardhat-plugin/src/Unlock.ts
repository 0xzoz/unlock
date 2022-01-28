/* eslint-disable class-methods-use-this */
import networks from '@unlock-protocol/networks'
// import contracts from '@unlock-protocol/contracts'
import { NetworkConfigs } from '@unlock-protocol/types'
import { NetworksConfig, Network } from 'hardhat/types'

export class UnlockHRE {
  networks: NetworkConfigs

  provider: Network['provider']

  constructor(availableNetworks: NetworksConfig, network: Network) {
    this.provider = network.provider

    this.networks = Object.keys(availableNetworks)
      .map((netName) => availableNetworks[netName])
      .filter(({ chainId }) => chainId)
      .reduce((acc, { chainId }) => {
        if (chainId !== undefined) {
          return {
            ...acc,
            [chainId]: networks[chainId],
          }
        }
        return acc
      }, {})
  }

  public getChainId = async () => {
    return await this.provider.send('eth_chainId')
  }

  public deployLock() {
    console.log('lets deploy')
    return 'hello'
  }
}
