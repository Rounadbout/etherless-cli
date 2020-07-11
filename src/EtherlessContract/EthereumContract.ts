import {
  ethers,
  Contract,
  Wallet,
  EventFilter,
} from 'ethers';

import { Provider } from 'ethers/providers';

import {
  BigNumber,
  bigNumberify,
  getAddress,
  parseEther,
} from 'ethers/utils';

import EtherlessContract from './EtherlessContract';
import BriefFunction from './BriefFunction';
import Function from './Function';
import HistoryItem from './HistoryItem';

class EthereumContract implements EtherlessContract {
  private contract: Contract;

  constructor(contract : Contract) {
    this.contract = contract;
  }

  async getAllFunctions() : Promise<Array<BriefFunction>> {
    return JSON.parse(await this.contract.getFuncList()).functionArray;
  }

  async getMyFunctions(address : string) : Promise<Array<BriefFunction>> {
    return JSON.parse(
      await this.contract.getOwnedList(getAddress(address)),
    ).functionArray;
  }

  async getFunctionInfo(name : string) : Promise<Function> {
    return JSON.parse(await this.contract.getInfo(name));
  }

  connect(wallet : Wallet) : void {
    this.contract = this.contract.connect(wallet);
  }

  private async getEvents(filter : any) : Promise<Array<any>> {
    filter.fromBlock = 0;
    filter.toBlock = 'latest';
    return this.contract.provider.getLogs(filter);
  }

  private parseLogs(logs : Array<any>) : Array<any> {
    return logs.map((log : any) => this.contract.interface.parseLog(log));
  }

  async getExecHistory(address : string) : Promise<Array<HistoryItem>> {
    const pastRequest = await this.getEvents(
      this.contract.filters.runRequest(null, null, address, null),
    );

    const parsedOk = this.parseLogs(await this.getEvents(this.contract.filters.resultOk()));
    const parsedError = this.parseLogs(await this.getEvents(this.contract.filters.resultError()));
    Array.prototype.push.apply(parsedOk, parsedError);

    return Promise.all(pastRequest.map((async (request : any) => {
      const { timestamp } = await this.contract.provider.getBlock(request.blockHash as string);
      const parsedRequest = this.contract.interface.parseLog(request);
      const result = parsedOk.find(
        (item : any) => item.values.id.eq(parsedRequest.values.id),
      )?.values;

      return {
        id: result.id,
        date: new Date(timestamp * 1000).toLocaleString(),
        name: parsedRequest.values.funcname,
        params: parsedRequest.values.param,
        result: JSON.parse(result.result).message,
      };
    })));
  }

  private async existsFunction(name : string) : Promise<boolean> {
    try {
      const listInfo : Function = await this.getFunctionInfo(name);
      return true;
    } catch (error) {
      return false;
    }
  }

  async sendRunRequest(name : string, params: string) : Promise<BigNumber> {
    let listInfo : Function;
    try {
      listInfo = await this.getFunctionInfo(name);
    } catch (error) {
      throw new Error("The function you're looking for does not exist! :'(");
    }

    // NUMBER OF PARAMETERS
    if (listInfo.signature.split(',').length !== params.split(',').length) {
      throw new Error('The number of parameters is not correct!');
    }

    console.log('Creating request to execute function..');
    const tx = await this.contract.runFunction(name, params, { value: bigNumberify('10') });

    console.log(`Sending request, transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log('Request done.');
    const requestId : BigNumber = this.contract.interface.parseLog(receipt.events[0]).values.id;
    return requestId;
  }

  async sendDeleteRequest(name: string) : Promise<BigNumber> {
    let listInfo : Function;
    try {
      listInfo = await this.getFunctionInfo(name);
    } catch (error) {
      throw new Error("The function you're looking for does not exist! :'(");
    }

    if (await this.contract.signer.getAddress() !== listInfo.developer) {
      throw new Error('You are not the owner of the function!');
    }

    console.log('Creating request to delete function..');
    const tx = await this.contract.deleteFunction(name, { value: bigNumberify('10') });

    console.log(`Sending request, transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log('Request done.');
    const requestId : BigNumber = this.contract.interface.parseLog(receipt.events[0]).values.id;
    return requestId;
  }

  async sendCodeUpdateRequest(name: string, signature: string, cid: string) : Promise<BigNumber> {
    let listInfo : Function;
    try {
      listInfo = await this.getFunctionInfo(name);
    } catch (error) {
      throw new Error("The function you're looking for does not exist! :'(");
    }

    if (await this.contract.signer.getAddress() !== listInfo.developer) {
      throw new Error('You are not the owner of the function!');
    }

    console.log('Creating request to edit function..');
    const tx = await this.contract.editFunction(name, signature, cid, { value: bigNumberify('10') });

    console.log(`Sending request, transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log('Request done.');
    const requestId : BigNumber = this.contract.interface.parseLog(receipt.events[0]).values.id;
    return requestId;
  }

  async updateDesc(name: string, newDesc : string) : Promise<void> {
    let listInfo : Function;
    try {
      listInfo = await this.getFunctionInfo(name);
    } catch (error) {
      throw new Error("The function you're looking for does not exist! :'(");
    }

    if (await this.contract.signer.getAddress() !== listInfo.developer) {
      throw new Error('You are not the owner of the function!');
    }

    if (newDesc.length > 150) {
      throw new Error('The new description must be at most 150 characters long');
    }

    const tx = await this.contract.editFunctionDescr(name, newDesc, { value: bigNumberify('10') });
    await tx.wait();
  }

  async sendDeployRequest(name: string, signature: string, desc : string, cid: string)
      : Promise<BigNumber> {
    if (await this.existsFunction(name)) {
      throw new Error('The name of the function is already used!');
    }

    if (name.length > 30) {
      throw new Error('The name must be at most 30 characters long!');
    }

    if (desc.length > 150) {
      throw new Error('The description must be at most 150 characters long!');
    }

    console.log('Creating request to deploy function..');
    const tx = await this.contract.deployFunction(name, signature, desc, cid, { value: bigNumberify('10') });

    console.log(`Sending request, transaction hash: ${tx.hash}`);
    const receipt = await tx.wait();

    console.log('Request done.');
    const requestId : BigNumber = this.contract.interface.parseLog(receipt.events[0]).values.id;
    return requestId;
  }

  listenResponse(requestId : BigNumber) : Promise<string> {
    console.log('Waiting for the response...');

    const successFilter : EventFilter = this.contract.filters.resultOk(null, requestId);
    const errorFilter : EventFilter = this.contract.filters.resultError(null, requestId);

    return new Promise<string>((resolve, reject) => {
      // ascolto per eventi di successo
      this.contract.on(successFilter, (result, id, event) => {
        resolve(result);
        this.contract.removeAllListeners(successFilter);
        this.contract.removeAllListeners(errorFilter);
      });

      // asolto per eventi di errore
      this.contract.on(errorFilter, (result, id, event) => {
        reject(JSON.parse(result));
        this.contract.removeAllListeners(successFilter);
        this.contract.removeAllListeners(errorFilter);
      });
    });
  }
}

export default EthereumContract;
