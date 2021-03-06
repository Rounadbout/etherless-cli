import { Wallet } from 'ethers';
import { BigNumber } from 'ethers/utils';
import Function from './Function';
import BriefFunction from './BriefFunction';
import HistoryItem from './HistoryItem';

export default interface EtherlessContract {
  getAllFunctions() : Promise<Array<BriefFunction>>;
  getMyFunctions(address : string) : Promise<Array<BriefFunction>>;
  getFunctionInfo(name : string) : Promise<Function>;
  getExecHistory(address : string) : Promise<Array<HistoryItem>>;

  updateDesc(name: string, newDesc: string) : Promise<void>;
  connect(wallet : Wallet) : void;

  existsFunction(name : string) : Promise<boolean>;

  sendRunRequest(name : string, params: string) : Promise<BigNumber>;
  sendDeleteRequest(name: string) : Promise<BigNumber>;
  sendCodeUpdateRequest(name: string, signature: string, cid: string) : Promise<BigNumber>;
  sendDeployRequest(name: string, signature: string, desc : string, cid: string)
    : Promise<BigNumber>;

  listenResponse(requestId : BigNumber) : Promise<string>;
}
