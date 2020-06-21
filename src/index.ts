#!/usr/bin/env ts-node-script


import { getDefaultProvider } from 'ethers';

import Command from './Command/Command';
import CommandManager from './Command/CommandManager';

import SignupCommand from './Command/SignupCommand';
import LoginCommand from './Command/LoginCommand';
import LogoutCommand from './Command/LogoutCommand';
import InfoCommand from './Command/InfoCommand';
import ListCommand from './Command/ListCommand';
import WhoAmICommand from './Command/WhoamiCommand';
import RunCommand from './Command/RunCommand';
import SearchCommand from './Command/SearchCommand';
import DeleteCommand from './Command/DeleteCommand';
import DeployCommand from './Command/DeployCommand';


import EthereumUsesSession from './Session/EthereumUserSession';
import EthereumContract from './EtherlessContract/EthereumContract';

import IPFSFileManager from './IPFS/IPFSFileManager';
import FileParser from './FileParser/FileParser';
import JSFileParser from './FileParser/JSFileParser';
import FileManager from './IPFS/FileManager';

const ESmart = require('../contracts/EtherlessSmart.json');

const provider = getDefaultProvider('ropsten');

const ethSession : EthereumUsesSession = new EthereumUsesSession(provider);
const ethContract : EthereumContract = new EthereumContract(
  '0x7eAF55b6E2126f7931aeC056C7839716b804c767',
  ESmart.abi,
  provider,
);

const ipfsFileManager : FileManager = new IPFSFileManager();
const jsFileParser : FileParser = new JSFileParser();

const commands : Array<Command> = [
  new LoginCommand(ethSession),
  new SignupCommand(ethSession),
  new LogoutCommand(ethSession),
  new WhoAmICommand(ethSession),
  new InfoCommand(ethContract, ethSession),
  new ListCommand(ethContract, ethSession),
  new RunCommand(ethContract, ethSession),
  new SearchCommand(ethContract, ethSession),
  new DeleteCommand(ethContract, ethSession),
  new DeployCommand(jsFileParser, ipfsFileManager, ethContract, ethSession),
];

commands.forEach(
  (command) => CommandManager.addCommand(command),
);

CommandManager.init();
