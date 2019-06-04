import Transaction from "../../../../models/Transaction";
import { configuration } from "../../../../Configuration";
import Block from "../../../../models/Block";

export default function createGenesisBlock() {
    const block = new Block({
        number: 1,
    });

    Object.keys(configuration.genesis.alloc).forEach((address) => {
        console.log('[] configuration.genesis.alloc[address].balance -> ', configuration.genesis.alloc[address].balance);

        const allocTransaction = new Transaction({
            to: address,
            value: configuration.genesis.alloc[address].balance,
            timestamp: 0,
            gasLimit: 0,
            gasPrice: 0,
            transIndex: 0,
            data: '0x0000000000000000000000000000000000000000000000000000000000000000',
            r: '0000000000000000000000000000000000000000000000000000000000000000',
            s: '0000000000000000000000000000000000000000000000000000000000000000',
            v: 1,
            milestoneIndex: 1,
        });

        allocTransaction.sign();

        block.addTransactions([allocTransaction]);
    });

    block.proofOfWork();

    return block;
}