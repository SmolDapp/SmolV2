import assert from 'assert';
import {SINGLETON_L2} from 'packages/smol/components/Multisafe/constants';
import {assertAddress} from '@builtbymom/web3/utils';
import {handleTx, type TTxResponse, type TWriteTransaction} from '@builtbymom/web3/utils/wagmi';
import GNOSIS_SAFE_PROXY_FACTORY from '@lib/utils/abi/gnosisSafeProxyFactory.abi';
import {MULTICALL_ABI} from '@lib/utils/abi/multicall3.abi';

import type {Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';

/* 🔵 - Smold App **************************************************************
 ** cloneSafe is a _WRITE_ function that clone an existing safe using the
 ** createProxyWithNonce method.
 **
 ** @param receivers - The addresses of the receivers.
 ** @param amounts - The amounts of ETH to send to each receiver.
 ******************************************************************************/
type TCloneSafe = TWriteTransaction & {
	initializers: Hex;
	salt: bigint;
};
export async function cloneSafe(props: TCloneSafe): Promise<TTxResponse> {
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: props.contractAddress,
		abi: GNOSIS_SAFE_PROXY_FACTORY,
		functionName: 'createProxyWithNonce',
		args: [SINGLETON_L2, props.initializers, props.salt]
	});
}

/* 🔵 - Yearn Finance **********************************************************
 ** multicall is a _WRITE_ function that can be used to cast a multicall
 **
 ** @app - common
 ** @param protocols - an array of protocols to vote for.
 ** @param amounts - an array of amounts to vote for each protocol.
 ******************************************************************************/
type TMulticall = TWriteTransaction & {
	multicallData: {
		target: TAddress;
		callData: Hex;
		value: bigint;
		allowFailure: boolean;
	}[];
};
export async function multicall(props: TMulticall): Promise<TTxResponse> {
	assert(props.connector, 'No connector');
	assert(props.multicallData.length > 0, 'Nothing to do');
	assertAddress(props.contractAddress, 'ContractAddress');

	const value = props.multicallData.reduce((a: bigint, b: {value: bigint}): bigint => a + b.value, 0n);
	return await handleTx(props, {
		address: props.contractAddress,
		abi: MULTICALL_ABI,
		functionName: 'aggregate3Value',
		args: [props.multicallData],
		value: value
	});
}
