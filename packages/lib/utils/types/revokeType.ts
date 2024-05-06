import type {TAddress} from '@builtbymom/web3/types/address';

export type TAllowances = TAllowance[];

export type TAllowance = {
	address: TAddress;
	args: {
		owner: TAddress;
		sender: TAddress;
		value: string | number | bigint | undefined;
	};
	blockHash: TAddress;
	blockNumber: bigint;
	data: TAddress;
	eventName: 'Approval';
	logIndex: number;
	removed: boolean;
	topics: TAddress[];
	transactionHash: TAddress;
	transactionIndex: number;
};
