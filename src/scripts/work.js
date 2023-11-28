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
import cluster from 'cluster';
import os  from 'os';
import { Mutex } from 'async-mutex';

( async function init() {

    const initialData  = process.env;
    var  computeNonce  = parseInt(initialData.computeNonce);
    var nonce = initialData.nonce;
    var sig;
    var workc = initialData.workc;
    var startTimer = parseInt(initialData.startTimer);
    var timer = startTimer;
    const privateKey = process.env.PRIVATE_KEY;
    const RPC = process.env.RPC;
    const provider = new ethers.providers.JsonRpcProvider(RPC);
    const mintOwner = new Wallet(privateKey, provider);
    var noncePowInscription = new Contract(process.env.contract,abi,mintOwner);
    var to = initialData.to;
    const spinnies = new Spinnies();
    // var process = process;
    spinnies.add("mining", { text: "start mining...", color: "blue" });

    function repeatable() {
      
        computeNonce++;
        sig = makeSig(nonce,computeNonce);
        const now = Date.now();
        // if (now - timer > 100) {
        //   await sleep(1);
        //   spinnies.update("mining", {
        //     text: `[${dayjs(now).format(
        //       "YYYY-MM-DD HH:mm:ss"
        //     )}] ${computeNonce} - ${sig}`,
        //     color: "red",
        //   });
        //   timer = now;
        // }
      
        if(sig.substring(0, 3) == workc){
          
           
                process.send('Hello from child process!');
                console.log(2222);
        //   spinnies.succeed("mining", {
        //     text: `${computeNonce} - ${sig}`,
        //     color: "green",
        //   });
        //   const mineTime = (Date.now() - startTimer) / 1000;
        //   printer.info(
        //     `Total time spent ${mineTime}s, average arithmetic ${Math.ceil(computeNonce / mineTime)} c/s`
        //   );
    
        //   var tx = await noncePowInscription.mint({
        //     computeNonce:computeNonce,
        //     signature:sig
        //     },to);
        //     printer.info(
        //       `Translation hash ${tx.hash}, Waiting for packaging...`
        //     );
        //     await tx.wait();
        //     printer.info(
        //       `The transaction ${tx.hash} has been packaged and completed`
        //     );
            return;
        }else{
            computeNonce++;
        }

        setTimeout(function() {
          repeatable();
        }, 1);
    }
        repeatable();
      function makeSig(nonce,computeNonce){
        const tes1 = {
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
    
        var privateKeyHex = Buffer.from(process.env.PRIVATE_KEY, 'hex');
        const sig = signTypedData({privateKey: privateKeyHex, data: tes1, version: SignTypedDataVersion.V4});
        return sig;
       }


})()

