import Network from './core/network/Network';
import Ipfs from './services/wrappers/Ipfs';
import { configuration, setConfig } from './Configuration';
import Transaction from './models/Transaction';
import Chain from './core/chain/Chain';
import EventHandler from './services/EventHandler';
import KeyPair from './models/KeyPair';
import Account from './models/Account';
import byteArrayToString from './utils/byteArrayToString';
import Wallet from './models/Wallet';
import * as Database from './services/DatabaseService';
import * as Logger from 'js-logger';
import IConfig, { NodeType } from './models/interfaces/IConfig';
import Validator from './core/milestone/Validator';

/**
 * Glue between all core modules.
 * Coordinates the core modules and exposes an API to the user.
 *
 * @class Rutile
 */
class Rutile {
    private network: Network;
    public ipfs: Ipfs;
    public chain: Chain;
    public eventHandler: EventHandler;
    public validator: Validator;

    static get Database() {
        return Database;
    }

    static get Transaction() {
        return Transaction;
    }

    static get KeyPair() {
        return KeyPair;
    }

    static get Wallet() {
        return Wallet;
    }

    static get Account() {
        return Account;
    }

    get Ipfs(){
        return this.ipfs;
    }

    constructor(options?: IConfig) {
        if (options) {
            setConfig(options);
        }

        this.ipfs = Ipfs.getInstance(configuration.ipfs);
        this.eventHandler = new EventHandler();
    }

    async start() {
        try {
            Logger.info('Starting Rutile');
            // Boot up our peer to peer network
            this.network = new Network();
            await this.network.open();
        } catch (error) {
            console.error('Could not connect to peers: ', error);
        }

        this.chain = new Chain(this.network);

        // if (configuration.nodeType !== NodeType.CLIENT) {
            await this.chain.synchronise();
        // }

        if (configuration.nodeType === NodeType.FULL) {
            this.validator = new Validator(this.chain);
            this.validator.start();
        }
    }

    /**
     * Deploys a WASM contract to the network
     *
     * @param {Uint8Array} binary
     * @returns {Promise<string>}
     * @memberof Rutile
     */
    async deploy(binary: Uint8Array): Promise<string> {
        return this.ipfs.add(byteArrayToString(binary));
    }

    /**
     * Sends a transaction to the chain
     *
     * @param {Transaction} transaction
     * @param {KeyPair} keyPair
     * @returns
     * @memberof Rutile
     */
    async sendTransaction(transaction: Transaction, keyPair: KeyPair) {
        return this.chain.submitTransaction(transaction, keyPair);
    }

    /**
     * Gets the current balance of a given address
     *
     * @param {string} address
     * @returns
     * @memberof Rutile
     */
    async getAccountBalance(address: string) {
        if (!this.chain) {
            throw new Error('Rutile should be started first');
        }

        const account = await Account.findOrCreate(address);
        return account.balance;
    }
}

export default Rutile;


