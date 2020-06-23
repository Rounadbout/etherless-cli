"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const inquirer = __importStar(require("inquirer"));
const Command_1 = __importDefault(require("./Command"));
const fs = require('fs');
class RunCommand extends Command_1.default {
    constructor(fileParser, fileManager, contract, session) {
        super(session);
        this.command = 'deploy <function_name> <path> <description>';
        this.description = 'deploy a function ';
        this.contract = contract;
        this.fileParser = fileParser;
        this.fileManager = fileManager;
    }
    exec(args) {
        return __awaiter(this, void 0, void 0, function* () {
            const password = yield inquirer
                .prompt([{
                    type: 'password',
                    message: 'Enter the password to decrypt your wallet: ',
                    name: 'password',
                }]).then((answer) => answer.password);
            const wallet = yield this.session.restoreWallet(password);
            this.contract.connect(wallet);
            this.fileParser.parse(args.path);
            const signature = this.fileParser.getFunctionSignature(args.function_name);
            const sourceCode = fs.readFileSync(args.path);
            console.log('Uploading file in IPFS');
            const CID = yield this.fileManager.save(sourceCode);
            console.log(`File uploaded, cid: ${CID}`);
            const requestId = yield this.contract.sendDeployRequest(args.function_name, signature, args.description, CID);
            const result = yield this.contract.listenResponse(requestId);
            return JSON.parse(result).message;
        });
    }
    builder(yargs) {
        return yargs.positional('function_name', {
            describe: 'Name of the function to deploy',
            type: 'string',
        }).positional('path', {
            describe: 'relative path of the source file',
            type: 'string',
        }).positional('description', {
            describe: 'Description of the function to deploy',
            type: 'string',
        });
    }
}
exports.default = RunCommand;
