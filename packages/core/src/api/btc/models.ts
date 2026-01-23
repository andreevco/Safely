import { z } from 'zod';

const tokenStandardEnum = z.enum([
    '',
    'XPUBAddress',
    'ERC20',
    'ERC721',
    'ERC1155',
    'BEP20',
    'BEP721',
    'BEP1155'
]);

/** Human-readable error message describing the issue. */
export const APIErrorSchema = z.looseObject({
    /** Human-readable error message describing the issue. */
    Text: z.string(),
    /** Whether the error message can safely be shown to the end user. */
    Public: z.boolean()
});

/** Type of alias, e.g., user-defined name or contract name. */
const AddressAliasSchema = z.looseObject({
    /** Type of alias, e.g., user-defined name or contract name. */
    Type: z.string(),
    /** Alias string for the address. */
    Alias: z.string()
});

/** Token ID (for ERC1155). */
const MultiTokenValueSchema = z.looseObject({
    /** Token ID (for ERC1155). */
    id: z.string().optional(),
    /** Amount of that specific token ID. */
    value: z.string().optional()
});

/** @deprecated: Use standard instead. */
const TokenTransferSchema = z.looseObject({
    /** @deprecated: Use standard instead. */
    type: tokenStandardEnum,
    standard: tokenStandardEnum,
    /** Source address of the token transfer. */
    from: z.string(),
    /** Destination address of the token transfer. */
    to: z.string(),
    /** Contract address of the token. */
    contract: z.string(),
    /** Token name. */
    name: z.string().optional(),
    /** Token symbol. */
    symbol: z.string().optional(),
    /** Number of decimals for this token (if applicable). */
    decimals: z.number(),
    /** Amount (in base units) of tokens transferred. */
    value: z.string().optional(),
    /** List of multiple ID-value pairs for ERC1155 transfers. */
    multiTokenValues: z.array(MultiTokenValueSchema).optional()
});

/** Amount (in satoshi or base units) of the output. */
const VoutSchema = z.looseObject({
    /** Amount (in satoshi or base units) of the output. */
    value: z.string().optional(),
    /** Relative index of this output within the transaction. */
    n: z.number(),
    /** Indicates whether this output has been spent. */
    spent: z.boolean().optional(),
    /** Transaction ID in which this output was spent. */
    spentTxId: z.string().optional(),
    /** Index of the input that spent this output. */
    spentIndex: z.number().optional(),
    /** Block height at which this output was spent. */
    spentHeight: z.number().optional(),
    /** Raw script hex data for this output - aka ScriptPubKey. */
    hex: z.string().optional(),
    /** Disassembled script for this output. */
    asm: z.string().optional(),
    /** List of addresses associated with this output. */
    addresses: z.array(z.string()),
    /** Indicates whether this output is owned by valid address. */
    isAddress: z.boolean(),
    /** Indicates if this output belongs to the wallet in context. */
    isOwn: z.boolean().optional(),
    /** Output script type (e.g., 'P2PKH', 'P2SH'). */
    type: z.string().optional()
});

/** ID/hash of the originating transaction (where the UTXO comes from). */
const VinSchema = z.looseObject({
    /** ID/hash of the originating transaction (where the UTXO comes from). */
    txid: z.string().optional(),
    /** Index of the output in the referenced transaction. */
    vout: z.number().optional(),
    /** Sequence number for this input (e.g. 4294967293). */
    sequence: z.number().optional(),
    /** Relative index of this input within the transaction. */
    n: z.number(),
    /** List of addresses associated with this input. */
    addresses: z.array(z.string()).optional(),
    /** Indicates if this input is from a known address. */
    isAddress: z.boolean(),
    /** Indicates if this input belongs to the wallet in context. */
    isOwn: z.boolean().optional(),
    /** Amount (in satoshi or base units) of the input. */
    value: z.string().optional(),
    /** Raw script hex data for this input. */
    hex: z.string().optional(),
    /** Disassembled script for this input. */
    asm: z.string().optional(),
    /** Data for coinbase inputs (when mining). */
    coinbase: z.string().optional()
});

/** Transaction ID (hash). */
const TxSchema = z.looseObject({
    /** Transaction ID (hash). */
    txid: z.string(),
    /** Version of the transaction (if applicable). */
    version: z.number().optional(),
    /** Locktime indicating earliest time/height transaction can be mined. */
    lockTime: z.number().optional(),
    /** Array of inputs for this transaction. */
    vin: z.array(VinSchema),
    /** Array of outputs for this transaction. */
    vout: z.array(VoutSchema),
    /** Hash of the block containing this transaction. */
    blockHash: z.string().optional(),
    /** Block height in which this transaction was included. */
    blockHeight: z.number(),
    /** Number of confirmations (blocks mined after this tx's block). */
    confirmations: z.number(),
    /** Estimated blocks remaining until confirmation (if unconfirmed). */
    confirmationETABlocks: z.number().optional(),
    /** Estimated seconds remaining until confirmation (if unconfirmed). */
    confirmationETASeconds: z.number().optional(),
    /** Unix timestamp of the block in which this transaction was included. 0 if unconfirmed. */
    blockTime: z.number(),
    /** Transaction size in bytes. */
    size: z.number().optional(),
    /** Virtual size in bytes, for SegWit-enabled chains. */
    vsize: z.number().optional(),
    /** Total value of all outputs (in satoshi or base units). */
    value: z.string(),
    /** Total value of all inputs (in satoshi or base units). */
    valueIn: z.string().optional(),
    /** Transaction fee (inputs - outputs). */
    fees: z.string().optional(),
    /** Raw hex-encoded transaction data. */
    hex: z.string().optional(),
    /** Indicates if this transaction is replace-by-fee (RBF) enabled. */
    rbf: z.boolean().optional(),
    /** Blockchain-specific extended data. */
    coinSpecificData: z.any().optional(),
    /** List of token transfers that occurred in this transaction. */
    tokenTransfers: z.array(TokenTransferSchema).optional(),
    /** Aliases for addresses involved in this transaction. */
    addressAliases: z.record(z.string(), AddressAliasSchema).optional()
});

/** Staking pool contract address on-chain. */
const StakingPoolSchema = z.looseObject({
    /** Staking pool contract address on-chain. */
    contract: z.string(),
    /** Name of the staking pool contract. */
    name: z.string(),
    /** Balance pending deposit or withdrawal, if any. */
    pendingBalance: z.string(),
    /** Any pending deposit that is not yet finalized. */
    pendingDepositedBalance: z.string(),
    /** Currently deposited/staked balance. */
    depositedBalance: z.string(),
    /** Total amount withdrawn from this pool by the address. */
    withdrawTotalAmount: z.string(),
    /** Rewards or principal currently claimable by the address. */
    claimableAmount: z.string(),
    /** Total rewards that have been restaked automatically. */
    restakedReward: z.string(),
    /** Any balance automatically reinvested into the pool. */
    autocompoundBalance: z.string()
});

/** @deprecated: Use standard instead. */
const ContractInfoSchema = z.looseObject({
    /** @deprecated: Use standard instead. */
    type: tokenStandardEnum,
    standard: tokenStandardEnum,
    /** Smart contract address. */
    contract: z.string(),
    /** Readable name of the contract. */
    name: z.string(),
    /** Symbol for tokens under this contract, if applicable. */
    symbol: z.string(),
    /** Number of decimal places, if applicable. */
    decimals: z.number(),
    /** Block height where contract was first created. */
    createdInBlock: z.number().optional(),
    /** Block height where contract was destroyed (if any). */
    destructedInBlock: z.number().optional()
});

/** @deprecated: Use standard instead. */
const TokenSchema = z.looseObject({
    /** @deprecated: Use standard instead. */
    type: tokenStandardEnum,
    standard: tokenStandardEnum,
    /** Readable name of the token. */
    name: z.string(),
    /** Derivation path if this token is derived from an XPUB-based address. */
    path: z.string().optional(),
    /** Contract address on-chain. */
    contract: z.string().optional(),
    /** Total number of token transfers for this address. */
    transfers: z.number(),
    /** Symbol for the token (e.g., 'ETH', 'USDT'). */
    symbol: z.string().optional(),
    /** Number of decimals for this token. */
    decimals: z.number(),
    /** Current token balance (in minimal base units). */
    balance: z.string().optional(),
    /** Value in the base currency (e.g. ETH for ERC20 tokens). */
    baseValue: z.number().optional(),
    /** Value in a secondary currency (e.g. fiat), if available. */
    secondaryValue: z.number().optional(),
    /** List of token IDs (for ERC721, each ID is a unique collectible). */
    ids: z.array(z.string()).optional(),
    /** Multiple ERC1155 token balances (id + value). */
    multiTokenValues: z.array(MultiTokenValueSchema).optional(),
    /** Total amount of tokens received. */
    totalReceived: z.string().optional(),
    /** Total amount of tokens sent. */
    totalSent: z.string().optional()
});

/** Current page index. */
export const AddressSchema = z.looseObject({
    /** Current page index. */
    page: z.number().optional(),
    /** Total number of pages available. */
    totalPages: z.number().optional(),
    /** Number of items returned on this page. */
    itemsOnPage: z.number().optional(),
    /** The address string in standard format. */
    address: z.string(),
    /** Current confirmed balance (in satoshi or base units). */
    balance: z.string(),
    /** Total amount ever received by this address. */
    totalReceived: z.string().optional(),
    /** Total amount ever sent by this address. */
    totalSent: z.string().optional(),
    /** Unconfirmed balance for this address. */
    unconfirmedBalance: z.string(),
    /** Number of unconfirmed transactions for this address. */
    unconfirmedTxs: z.number(),
    /** Unconfirmed outgoing balance for this address. */
    unconfirmedSending: z.string().optional(),
    /** Unconfirmed incoming balance for this address. */
    unconfirmedReceiving: z.string().optional(),
    /** Number of transactions for this address (including confirmed). */
    txs: z.number(),
    /** Historical total count of transactions, if known. */
    addrTxCount: z.number().optional(),
    /** Number of transactions not involving tokens (pure coin transfers). */
    nonTokenTxs: z.number().optional(),
    /** Number of internal transactions (e.g., Ethereum calls). */
    internalTxs: z.number().optional(),
    /** List of transaction details (if requested). */
    transactions: z.array(TxSchema).optional(),
    /** List of transaction IDs (if detailed data is not requested). */
    txids: z.array(z.string()).optional(),
    /** Current transaction nonce for Ethereum-like addresses. */
    nonce: z.string().optional(),
    /** Number of tokens with any historical usage at this address. */
    usedTokens: z.number().optional(),
    /** List of tokens associated with this address. */
    tokens: z.array(TokenSchema).optional(),
    /** Total value of the address in secondary currency (e.g. fiat). */
    secondaryValue: z.number().optional(),
    /** Sum of token values in base currency. */
    tokensBaseValue: z.number().optional(),
    /** Sum of token values in secondary currency (fiat). */
    tokensSecondaryValue: z.number().optional(),
    /** Address's entire value in base currency, including tokens. */
    totalBaseValue: z.number().optional(),
    /** Address's entire value in secondary currency, including tokens. */
    totalSecondaryValue: z.number().optional(),
    /** Extra info if the address is a contract (ABI, type). */
    contractInfo: ContractInfoSchema.optional(),
    /** @deprecated: replaced by contractInfo */
    erc20Contract: ContractInfoSchema.optional(),
    /** Aliases assigned to this address. */
    addressAliases: z.record(z.string(), AddressAliasSchema).optional(),
    /** List of staking pool data if address interacts with staking. */
    stakingPools: z.array(StakingPoolSchema).optional()
});

/** Transaction ID in which this UTXO was created. */
export const UtxoSchema = z.looseObject({
    /** Transaction ID in which this UTXO was created. */
    txid: z.string(),
    /** Index of the output in that transaction. */
    vout: z.number(),
    /** Value of this UTXO (in satoshi or base units). */
    value: z.string(),
    /** Block height in which the UTXO was confirmed. */
    height: z.number().optional(),
    /** Number of confirmations for this UTXO. */
    confirmations: z.number(),
    /** Address to which this UTXO belongs. */
    address: z.string().optional(),
    /** Derivation path for XPUB-based wallets, if applicable. */
    path: z.string().optional(),
    /** If non-zero, locktime required before spending this UTXO. */
    lockTime: z.number().optional(),
    /** Indicates if this UTXO originated from a coinbase transaction. */
    coinbase: z.boolean().optional()
});

export const GasPriceSchema = z.record(z.string(), z.number());

export type BtcApiAddress = typeof AddressSchema;
export type BtcApiUtxo = typeof UtxoSchema;
export type BtcApiGasPrice = typeof GasPriceSchema;
