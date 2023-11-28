import { ethers,Wallet,Contract } from "ethers";
import { sleep } from "../utils/program";
import Spinnies from "spinnies";
import { printer } from "../utils/log4js";
import { bnUtils } from "../utils/bn";
import { sayMinerLog } from "../utils/prompts";
import dayjs from "dayjs";
import {signTypedData, SignTypedDataVersion} from "@metamask/eth-sig-util";
import abi from "./abi.json";
import dotenv from "dotenv";
dotenv.config();


let unique = 0;
export const runMine = async (num) => {
  sayMinerLog();
  const to = process.env.to;
  const privateKey = process.env.PRIVATE_KEY as string;
  const RPC = process.env.RPC;
  const workc = "0x0";

  printer.trace(`Start mining to ${to}`);

  const provider = new ethers.providers.JsonRpcProvider(RPC);
  const mintOwner = new Wallet(privateKey, provider);
  var noncePowInscription = new Contract(process.env.contract as string,abi,mintOwner);
  const network = await provider.getNetwork();
  printer.trace(`network is ${network.name} (chainID: ${network.chainId})`);


  for(var i = 0;i<num;i++){
    await handle();
  }


  async function handle() {
    const currentGasPrice = await provider.getGasPrice();
    const targetGasFee = currentGasPrice.div(100).mul(110);
  
    printer.trace(`Current gas price usage ${bnUtils.fromWei(targetGasFee.toString(), 9)} gwei`);
    const nonce = (await noncePowInscription.getNonces(mintOwner.address)).toString();;
    printer.trace(`nonce is ${nonce}`);
    const balance = await mintOwner.getBalance();
    printer.trace(`balance is ${bnUtils.fromWei(balance.toString(), 18).dp(4).toString()}`);
    //
  
    const spinnies = new Spinnies();
    printer.trace(`The current mining difficulty is ${workc}`);
    printer.trace(`Expected to take 3-4 minutes to calculate...`);
    spinnies.add("mining", { text: "start mining...", color: "blue" });
    let timer = Date.now(),
      startTimer = timer;
      var computeNonce = 0;
      var sig;
  
    while (true) {
      computeNonce += 1;
      sig = makeSig(nonce,computeNonce);
      
      const now = Date.now();
      if (now - timer > 100) {
        await sleep(1);
        spinnies.update("mining", {
          text: `[${dayjs(now).format(
            "YYYY-MM-DD HH:mm:ss"
          )}] ${computeNonce} - ${sig}`,
          color: "red",
        });
        timer = now;
      }
      if(sig.substring(0, 3) == workc){
        spinnies.succeed("mining", {
          text: `${computeNonce} - ${sig}`,
          color: "green",
        });
        const mineTime = (Date.now() - startTimer) / 1000;
        printer.info(
          `Total time spent ${mineTime}s, average arithmetic ${Math.ceil(computeNonce / mineTime)} c/s`
        );
  
        var tx = await noncePowInscription.mint({
          computeNonce:computeNonce,
          signature:sig
          },to);
          printer.info(
            `Translation hash ${tx.hash}, Waiting for packaging...`
          );
          await tx.wait();
          printer.info(
            `The transaction ${tx.hash} has been packaged and completed`
          );
          break;
      }else{
          computeNonce++;
      }
      
    }
  }



  function makeSig(nonce,computeNonce){
    const tes1: any = {
        types: {
            EIP712Domain: [
                {name: 'name', type: 'string'},
                {name: 'version', type: 'string'},
                {name: 'chainId', type: 'uint256'},
                {name: 'verifyingContract', type: 'address'}
            ],
            Inscription: [
                {name: 'p', type: 'string'},
                {name: 'op', type: 'string'},
                 {name: 'tick', type: 'string'},
                 {name: 'amt', type: 'uint256'},
                {name: 'nonce', type: 'uint256'},
                {name: 'computeNonce', type: 'uint256'}
            ]
        },
        domain: {
            name: 'Nonce Pow Inscription',
            version: '1',
            chainId: 5,
            verifyingContract: process.env.contract,
        },
        primaryType: 'Inscription',
        message: {
             p: "npi-20",
            op: "mint",
             tick: "npis",
             amt: 1000,
            nonce: nonce,
            computeNonce:computeNonce
        }
    };

    var privateKeyHex = Buffer.from(process.env.PRIVATE_KEY as string, 'hex');
    const sig = signTypedData({privateKey: privateKeyHex, data: tes1, version: SignTypedDataVersion.V4});
    return sig;
   }
};
