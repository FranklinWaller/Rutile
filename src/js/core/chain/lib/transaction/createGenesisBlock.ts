import Transaction from "../../../../models/Transaction";
import { configuration } from "../../../../Configuration";
import Block from "../../../../models/Block";
import { VM_ERROR } from "../../../rvm/lib/exceptions";
import * as Logger from 'js-logger';
const BN = require('bn.js');

export default async function createGenesisBlock(): Promise<Block> {
    const allTransactions: Transaction[] = [];

    // Creation of all RUT tokens
    for (const address of Object.keys(configuration.genesis.alloc)) {
        const allocTransaction = new Transaction({
            to: address,
            nonce: new BN(0),
            value: configuration.genesis.alloc[address].balance,
            timestamp: 0,
            gasLimit: 0,
            gasPrice: 0,
            transIndex: 0,
            data: '0x0000000000000000000000000000000000000000000000000000000000000000',
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            v: 1,
        });

        allocTransaction.sign();
        allTransactions.push(allocTransaction);
    }

    // Validators creation
    for (const address of Object.keys(configuration.genesis.stakes)) {
        const data = '0x00000001' + address.slice(2);

        const transaction = new Transaction({
            to: '0x0200000000000000000000000000000000000000',
            value: configuration.genesis.stakes[address].value,
            timestamp: 0,
            gasLimit: 0,
            gasPrice: 0,
            transIndex: 0,
            nonce: new BN(0),
            data,
            r: '0x0000000000000000000000000000000000000000000000000000000000000000',
            s: '0x0000000000000000000000000000000000000000000000000000000000000000',
            v: 1,
        });

        transaction.sign();
        allTransactions.push(transaction);
    }

    // We have to create an account for some internal contracts
    // This way we can save the merkle root
    // for (const internalContract of internalAddressTransactionIds) {
    //     await Account.create(internalContract[0], '', internalContract[1]);
    // }

    // And now for the milestone transaction that connects all transactions together
    const block = new Block({
        number: 1,
        timestamp: 0,
        gasLimit: 80000000000,
    });

    await block.addTransactions(allTransactions);
    block.proofOfWork();

    const results = await block.execute();

    let failedTransactionIndex = 0;

    const didGenesisTxFail = !!results.find((txResult, index) => {
        if (txResult.exceptionError === VM_ERROR.REVERT) {
            failedTransactionIndex = index;
            return true;
        }

        return false;
    });

    if (didGenesisTxFail) {
        Logger.error(`🚀 Failed transaction results:`, results[failedTransactionIndex], ` at transaction `, block.transactions[failedTransactionIndex]);
        throw new Error(`Genesis block creation failed with transaction index of ${failedTransactionIndex}`);
    }

    return block;
}
