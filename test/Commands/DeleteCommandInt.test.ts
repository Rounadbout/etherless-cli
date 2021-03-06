import { bigNumberify } from 'ethers/utils';

import Configstore from 'configstore';
import DeleteCommand from '../../src/Command/DeleteCommand';
import EthereumContract from '../../src/EtherlessContract/EthereumContract';
import EthereumUserSession from '../../src/Session/EthereumUserSession';

jest.mock('ethers');
jest.mock('yargs');
jest.mock('configstore');
jest.mock('inquirer');

const inquirer = require('inquirer');

inquirer.prompt = jest.fn().mockReturnValue(Promise.resolve('password'));

const ethers = require('ethers');

const yargs = require('yargs');
yargs.positional = jest.fn().mockReturnValue(require('yargs'));

const contract = new ethers.Contract();
Object.defineProperty(contract, 'interface', {
  value: {
    parseLog: jest.fn().mockImplementation(() => ({
      values: {
        id: {
          value: 0,
          eq: jest.fn().mockReturnValue(true),
        },
        funcname: 'mockedFunc',
        param: 'params',
        result: JSON.stringify({ message: 'mocked result message' }),
      },
    })),
  },
});

Object.defineProperty(contract, 'provider', {
  value: {
    getLogs: jest.fn().mockImplementation(() => [
      {
        blockHash: 'mockedBlockHash',
      },
    ]),
    getBlock: jest.fn().mockImplementation(() => ({
      timestamp: '123456789',
    })),
  },
});

Object.defineProperty(contract, 'filters', {
  value: {
    resultOk: jest.fn().mockReturnValue({
      fromBlock: '',
      toBlock: '',
    }),
    resultError: jest.fn().mockReturnValue({
      fromBlock: '',
      toBlock: '',
    }),
    runRequest: jest.fn().mockReturnValue({
      fromBlock: '',
      toBlock: '',
    }),
  },
});

Object.defineProperty(contract, 'signer', {
  value: {
    getAddress: jest.fn().mockReturnValue('address'),
  },
  writable: true,
});

const pkg = require('../../package.json');

const cfgStore = new Configstore(pkg.name);

const ethereumContract = new EthereumContract(contract);
const ethereumUserSession = new EthereumUserSession(
  cfgStore,
  ethers.getDefaultProvider('ropsten'),
);

const command = new DeleteCommand(ethereumContract, ethereumUserSession);

test('check builder', () => {
  expect(command.builder(yargs)).toBeDefined();
});

test('get command syntax', () => {
  expect(command.getCommand()).toBe('delete <function_name>');
});

test('get command description', () => {
  expect(command.getDescription()).toBe('Description:\n_\b  Delete a function you own inside Etherless');
});

test('test command execution', () => {
  (contract.getInfo as jest.Mock)
    .mockReturnValueOnce(
      Promise.resolve(
        JSON.stringify({ developer: 'address' }),
      ),
    );

  (contract.connect as jest.Mock)
    .mockReturnValue(
      contract,
    );

  (cfgStore.get as jest.Mock).mockReturnValue('mocked encrypted wallet');
  ethers.Wallet.fromEncryptedJson = jest.fn().mockImplementationOnce(
    (encryptedJson) => Promise.resolve({
      connect: jest.fn().mockImplementation(() => new ethers.Wallet()),
    }),
  );

  ethereumUserSession.restoreWallet = jest.fn().mockReturnValue(Promise.resolve({}));

  expect(command.exec({ function_name: 'functionName' }))
    .resolves.not.toThrowError();
});
