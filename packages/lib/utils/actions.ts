import assert from 'assert';
import {encodeFunctionData, erc20Abi, maxUint256} from 'viem';
import {assertAddress, MAX_UINT_256, toAddress, toBigInt} from '@builtbymom/web3/utils';
import {handleTx, retrieveConfig, toWagmiProvider} from '@builtbymom/web3/utils/wagmi';
import {readContract} from '@wagmi/core';
import DISPERSE_ABI from '@lib/utils/abi/disperse.abi';
import {VAULT_ABI} from '@yearn-finance/web-lib/utils/abi/vault.abi';

import {VAULT_V3_ABI} from './abi/vaultV3.abi';
import {YEARN_4626_ROUTER_ABI} from './abi/yearn4626Router.abi';

import type {EncodeFunctionDataReturnType} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TTxResponse, TWriteTransaction} from '@builtbymom/web3/utils/wagmi';

/* 🔵 - Smold App **************************************************************
 ** disperseETH is a _WRITE_ function that disperses ETH to a list of addresses.
 **
 ** @param receivers - The addresses of the receivers.
 ** @param amounts - The amounts of ETH to send to each receiver.
 ************************************************************************************************/
type TDisperseETH = TWriteTransaction & {
	receivers: TAddress[];
	amounts: bigint[];
};
export async function disperseETH(props: TDisperseETH): Promise<TTxResponse> {
	assertAddress(props.contractAddress);
	for (const receiver of props.receivers) {
		assertAddress(receiver, receiver);
	}
	for (const amount of props.amounts) {
		assert(amount > 0n, 'amount must be greater than 0');
	}
	assert(props.receivers.length === props.amounts.length, 'receivers and amounts must be the same length');

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: DISPERSE_ABI,
		functionName: 'disperseEther',
		confirmation: process.env.NODE_ENV === 'development' ? 1 : undefined,
		args: [props.receivers, props.amounts],
		value: props.amounts.reduce((a, b): bigint => a + b, 0n)
	});
}

/* 🔵 - Smold App **************************************************************
 ** disperseERC20 is a _WRITE_ function that disperses ERC20 to a list of
 ** addresses.
 **
 ** @param receivers - The addresses of the receivers.
 ** @param amounts - The amounts of ETH to send to each receiver.
 ************************************************************************************************/
type TDisperseERC20 = TWriteTransaction & {
	tokenToDisperse: TAddress | undefined;
	receivers: TAddress[];
	amounts: bigint[];
};
export async function disperseERC20(props: TDisperseERC20): Promise<TTxResponse> {
	assertAddress(props.tokenToDisperse, 'The tokenToDisperse');
	assertAddress(props.contractAddress);
	for (const receiver of props.receivers) {
		assertAddress(receiver, receiver);
	}
	for (const amount of props.amounts) {
		assert(amount > 0n, 'amount must be greater than 0');
	}
	assert(props.receivers.length === props.amounts.length, 'receivers and amounts must be the same length');

	return await handleTx(props, {
		address: toAddress(props.contractAddress),
		abi: DISPERSE_ABI,
		confirmation: process.env.NODE_ENV === 'development' ? 1 : undefined,
		functionName: 'disperseToken',
		args: [props.tokenToDisperse, props.receivers, props.amounts]
	});
}

/**************************************************************************************************
 ** deposit is a _WRITE_ function that deposits a collateral into a vault using
 ** the vanilla direct deposit function.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to deposit.
 ************************************************************************************************/
type TApproveViaRouter = TWriteTransaction & {
	amount: bigint;
	tokenAddress: TAddress;
	vault: TAddress;
};
export async function approveViaRouter(props: TApproveViaRouter): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		chainId: props.chainID,
		abi: YEARN_4626_ROUTER_ABI,
		functionName: 'approve',
		args: [props.tokenAddress, props.vault, maxUint256]
	});
}

//TODO: move to web3 lib
/**************************************************************************************************
 ** deposit is a _WRITE_ function that deposits a collateral into a vault using
 ** the vanilla direct deposit function.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to deposit.
 ************************************************************************************************/
type TDeposit = TWriteTransaction & {
	amount: bigint;
};
export async function deposit(props: TDeposit): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_ABI,
		functionName: 'deposit',
		args: [props.amount, wagmiProvider.address]
	});
}

/**************************************************************************************************
 ** depositViaRouter is a _WRITE_ function that deposits the chain Coin (eth/matic/etc.) to a vault
 ** via a set of specific operations.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to deposit.
 ** @param vault - The address of the vault to deposit into.
 ** @param token - The address of the token to deposit.
 ** @param permitCalldata - The calldata for the permit
 ************************************************************************************************/
type TDepositViaRouter = TWriteTransaction & {
	amount: bigint;
	vault: TAddress;
	token: TAddress;
	permitCalldata?: EncodeFunctionDataReturnType;
};
export async function depositViaRouter(props: TDepositViaRouter): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');
	const multicalls = [];

	/**********************************************************************************************
	 ** The depositToVault function requires a min share out. In our app, we will just use 99.99%
	 ** of the preview deposit. This is a common practice in the Yearn ecosystem
	 *********************************************************************************************/
	const previewDeposit = await readContract(retrieveConfig(), {
		address: props.vault,
		chainId: props.chainID,
		abi: VAULT_V3_ABI,
		functionName: 'previewDeposit',
		args: [props.amount]
	});
	const minShareOut = (previewDeposit * 9999n) / 10000n;

	/**********************************************************************************************
	 ** We need to make sure that the Vault can spend the Underlying Token owned by the Yearn
	 ** Router. This is a bit weird and only need to be done once, but hey, this is required.
	 *********************************************************************************************/
	const allowance = await readContract(retrieveConfig(), {
		address: props.token,
		chainId: props.chainID,
		abi: erc20Abi,
		functionName: 'allowance',
		args: [props.contractAddress, props.vault]
	});
	if (toBigInt(allowance) < MAX_UINT_256) {
		multicalls.push(
			encodeFunctionData({
				abi: YEARN_4626_ROUTER_ABI,
				functionName: 'approve',
				args: [props.token, props.vault, MAX_UINT_256]
			})
		);
	}

	/**********************************************************************************************
	 ** Then we can prepare our multicall
	 *********************************************************************************************/
	if (props.permitCalldata) {
		multicalls.push(props.permitCalldata);
	}
	multicalls.push(
		encodeFunctionData({
			abi: YEARN_4626_ROUTER_ABI,
			functionName: 'depositToVault',
			args: [props.vault, props.amount, wagmiProvider.address, minShareOut]
		})
	);
	return await handleTx(props, {
		address: props.contractAddress,
		chainId: props.chainID,
		abi: YEARN_4626_ROUTER_ABI,
		functionName: 'multicall',
		value: 0n,
		args: [multicalls]
	});
}
//TODO: move to web3 lib
/**************************************************************************************************
 ** redeemV3Shares is a _WRITE_ function that withdraws a share of underlying
 ** collateral from a v3 vault.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to withdraw.
 ************************************************************************************************/
type TRedeemV3Shares = TWriteTransaction & {
	amount: bigint;
	maxLoss: bigint;
};
export async function redeemV3Shares(props: TRedeemV3Shares): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assert(props.maxLoss > 0n && props.maxLoss <= 10000n, 'Max loss is invalid');
	assertAddress(props.contractAddress);
	const wagmiProvider = await toWagmiProvider(props.connector);
	assertAddress(wagmiProvider.address, 'wagmiProvider.address');

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_V3_ABI,
		functionName: 'redeem',
		args: [props.amount, wagmiProvider.address, wagmiProvider.address, props.maxLoss]
	});
}

/**************************************************************************************************
 ** withdrawShares is a _WRITE_ function that withdraws a share of underlying
 ** collateral from a vault.
 **
 ** @app - Vaults
 ** @param amount - The amount of ETH to withdraw.
 ************************************************************************************************/
type TWithdrawShares = TWriteTransaction & {
	amount: bigint;
};
export async function withdrawShares(props: TWithdrawShares): Promise<TTxResponse> {
	assert(props.amount > 0n, 'Amount is 0');
	assertAddress(props.contractAddress);

	return await handleTx(props, {
		address: props.contractAddress,
		abi: VAULT_ABI,
		functionName: 'withdraw',
		args: [props.amount]
	});
}
