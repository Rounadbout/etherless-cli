import { bigNumberify } from 'ethers/utils';
import * as fs from 'fs';
import Configstore from 'configstore';
import EditCommand from '../../src/Command/EditCommand';
import EthereumContract from '../../src/EtherlessContract/EthereumContract';
import EthereumUserSession from '../../src/Session/EthereumUserSession';
import JSFileParser from '../../src/FileParser/JSFileParser';
import IPFSFileManager from '../../src/IPFS/IPFSFileManager';

jest.mock('../../src/EtherlessContract/EthereumContract');
jest.mock('../../src/Session/EthereumUserSession');
jest.mock('../../src/FileParser/JSFileParser');
jest.mock('../../src/IPFS/IPFSFileManager');
jest.mock('ethers');
jest.mock('yargs');
jest.mock('configstore');
jest.mock('inquirer');

const inquirer = require('inquirer');

inquirer.prompt = jest.fn().mockReturnValue(Promise.resolve('password'));

const ethers = require('ethers');

let yargs = require('yargs');

yargs = jest.fn().mockImplementation(() => {});
yargs.positional = jest.fn().mockReturnValue(yargs);
yargs.option = jest.fn().mockReturnValue(yargs);

jest.mock('ipfs-mini');
const IPFS = require('ipfs-mini');

const ipfsMiniMock = new IPFS.Ipfs();
const fileManager = new IPFSFileManager(ipfsMiniMock);

const contract = new ethers.Contract();

const pkg = require('../../package.json');

const cfgStore = new Configstore(pkg.name);

const ethereumContract = new EthereumContract(contract);
const ethereumUserSession = new EthereumUserSession(
  cfgStore,
  ethers.getDefaultProvider('ropsten'),
);

const fileParser = new JSFileParser();

const command = new EditCommand(fileParser, fileManager, ethereumContract, ethereumUserSession);

beforeAll(() => {
  fs.writeFileSync('mockedSourceFile.js', 'function foo() {}');
});

test('check builder', () => {
  expect(command.builder(yargs)).toBeDefined();
});

test('get command syntax', () => {
  expect(command.getCommand()).toBe('edit <function_name> [s] [d]');
});

test('get command description', () => {
  expect(command.getDescription()).toBe('edit a function you deployed');
});

test('edit function description', () => {
  ethereumContract.connect = jest.fn().mockReturnValue(null);
  ethereumUserSession.restoreWallet = jest.fn().mockReturnValue(Promise.resolve({}));
  ethereumContract.updateDesc = jest.fn().mockReturnValue(Promise.resolve({}));
  ethereumUserSession.getAddress = jest.fn().mockReturnValue('address');
  ethereumContract.getFunctionInfo = jest.fn().mockReturnValue({
    developer: 'address',
  });

  expect(command.exec({ function_name: 'foo', d: 'new description' }))
    .resolves.toBe('Description updated correctly\n');
});

test('edit function source code', () => {
  ethereumContract.connect = jest.fn().mockReturnValue(null);
  ethereumUserSession.restoreWallet = jest.fn().mockReturnValue(Promise.resolve({}));
  ethereumUserSession.getAddress = jest.fn().mockReturnValue('address');
  ethereumContract.sendDeployRequest = jest.fn().mockReturnValue(Promise.resolve(bigNumberify(1)));
  ethereumContract.listenResponse = jest.fn().mockReturnValue(
    Promise.resolve(JSON.stringify({ message: 'result message' })),
  );
  fileManager.save = jest.fn().mockReturnValue('mocked cid');
  fileParser.parse = jest.fn().mockImplementationOnce(() => {});
  fileParser.getFunctionSignature = jest.fn().mockReturnValueOnce('(p1, p2)');
  ethereumContract.getFunctionInfo = jest.fn().mockReturnValue({
    developer: 'address',
  });

  expect(command.exec({
    function_name: 'foo',
    s: 'mockedSourceFile.js',
  })).resolves.not.toThrowError();
});

afterAll(() => {
  fs.unlinkSync('mockedSourceFile.js');
});
