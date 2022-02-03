/* eslint-disable import/no-cycle */
import type { providers, Signer } from 'ethers'
import * as contracts from '@unlock-protocol/contracts'
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names'

import fs from 'fs-extra'
import path from 'path'

import { UnlockHRE } from './Unlock'

export async function deployContract(
  { ethers, network }: UnlockHRE,
  contractName: string,
  versionNumber: number,
  constructorArguments: any[],
  signer?: Signer,
  confirmations: number = 5,
  deploymentOptions: providers.TransactionRequest = {}
): Promise<string> {
  if (
    deploymentOptions.gasLimit === undefined &&
    typeof network.config.gas === 'number'
  ) {
    deploymentOptions.gasLimit = network.config.gas
  }

  // check contract exists
  const contractVersion = `${contractName}V${versionNumber}`
  if (!Object.keys(contracts).includes(contractVersion)) {
    throw Error(
      `Contract '${contractVersion}' is not in present in @unlock-protocol/contracts`
    )
  }

  const { bytecode, abi } = contracts[contractVersion as keyof {}]

  const factory = await ethers.getContractFactory(abi, bytecode, signer)
  const contract = await factory.deploy(...constructorArguments)
  await contract.deployTransaction.wait(confirmations)
  return contract.address
}

export async function deployUpgreadableContract(
  { ethers, network, upgrades, run, contractsFolder }: UnlockHRE,
  contractName: string,
  versionNumber: number,
  initializer: string,
  initializerArguments: any[],
  signer?: Signer,
  confirmations: number = 5,
  deploymentOptions: providers.TransactionRequest = {}
): Promise<string> {
  if (
    deploymentOptions.gasLimit === undefined &&
    typeof network.config.gas === 'number'
  ) {
    deploymentOptions.gasLimit = network.config.gas
  }

  // check contract exists
  const contractVersion = `${contractName}V${versionNumber}`
  if (!Object.keys(contracts).includes(contractVersion)) {
    throw Error(
      `Contract '${contractVersion}' is not in present in @unlock-protocol/contracts`
    )
  }

  // need to copy .sol for older versions from contracts package
  const contractPath = path.resolve(
    contractsFolder,
    '.unlock',
    `${contractName}V${versionNumber}.sol`
  )

  await fs.copy(
    require.resolve(
      `@unlock-protocol/contracts/dist/${contractName}/${contractName}V${versionNumber}.sol`
    ),
    contractPath
  )

  // Make sure that contract artifacts are up-to-date.
  await run(TASK_COMPILE)

  // delete .sol file now that we have artifact
  await fs.remove(contractPath)

  // get factory
  const qualified = `contracts/.unlock/${contractName}V${versionNumber}.sol:${contractName}`
  const factory = await ethers.getContractFactory(qualified, signer)

  const contract = await upgrades.deployProxy(factory, initializerArguments, {
    initializer,
  })
  await contract.deployTransaction.wait(confirmations)
  return contract.address
}
