import {getChains} from '@wagmi/core';
import axios from 'axios';
import {zora} from 'wagmi/chains';

import {EIP3770_PREFIX} from '@lib/utils/eip-3770';
import {formatAmount, toNormalizedBN, zeroNormalizedBN} from '@lib/utils/numbers';
import {truncateHex} from '@lib/utils/tools.addresses';

import type {TTokenAmountInputElement} from '@lib/components/SmolTokenAmountInput';
import type {TAddress} from '@lib/utils/tools.addresses';
import type {TERC20TokensWithBalance} from '@lib/utils/tools.erc20';
import type {Config} from '@wagmi/core';
import type {Hex} from 'viem';

const safeBaseURIForNetwork = (network: number): string => {
	if (network === zora.id) {
		return 'https://safe.optimism.io/transactions/tx?safe=';
	}
	return 'https://app.safe.global/transactions/tx?safe=';
};

export function notifyDisperse(props: {
	chainID: number;
	config: Config;
	tokenToDisperse: TERC20TokensWithBalance | undefined;
	receivers: TAddress[];
	amounts: bigint[];
	hash: Hex;
	from: TAddress;
	type: 'EOA' | 'SAFE';
}): void {
	if (!props.tokenToDisperse) {
		return;
	}
	const chains = getChains(props.config);
	const currentChain = chains.find(chain => chain.id === props.chainID);
	const explorerBaseURI = currentChain?.blockExplorers?.default?.url || 'https://etherscan.io';
	const decimals = props.tokenToDisperse.decimals || 18;
	const sumDispersed = props.amounts.reduce((sum, amount): bigint => sum + amount, 0n);
	const sumDispersedNormalized = formatAmount(toNormalizedBN(sumDispersed, decimals).normalized, 6, decimals);
	const getChainPrefix = EIP3770_PREFIX.find((item): boolean => item.chainId === props.chainID);
	const chainPrefix = getChainPrefix?.shortName || 'eth';

	axios.post('/api/notify', {
		messages: [
			'*🚀 DISPERSE*',
			`\t\t\t\t\t\t${sumDispersedNormalized} ${props.tokenToDisperse.symbol} dispersed by [${truncateHex(
				props.from,
				4
			)}](${explorerBaseURI}/address/${props.from}):`,
			...props.receivers.map(
				(receiver, index): string =>
					`\t\t\t\t\t\t\t- [${truncateHex(
						receiver,
						5
					)}](${explorerBaseURI}/address/${receiver}) received ${formatAmount(
						toNormalizedBN(props.amounts[index], decimals).normalized,
						6,
						decimals
					)} ${props.tokenToDisperse?.symbol}`
			),
			props.type === 'EOA'
				? `\t\t\t\t\t\t[View on Explorer](${explorerBaseURI}/tx/${props.hash})`
				: `\t\t\t\t\t\t[View on Safe](${safeBaseURIForNetwork(props.chainID)}${chainPrefix}:${props.from}/transactions/tx?safe=eth:${props.from}&id=multisig_${props.from}_${props.hash})`
		]
	});
}

export function notifySend(props: {
	chainID: number;
	config: Config;
	tokensMigrated: TTokenAmountInputElement[];
	hashes: Hex[];
	to: TAddress;
	from: TAddress;
	type: 'EOA' | 'SAFE';
}): void {
	const chains = getChains(props.config);
	const currentChain = chains.find(chain => chain.id === props.chainID);
	const explorerBaseURI = currentChain?.blockExplorers?.default?.url || 'https://etherscan.io';
	const getChainPrefix = EIP3770_PREFIX.find((item): boolean => item.chainId === props.chainID);
	const chainPrefix = getChainPrefix?.shortName || 'eth';

	axios.post('/api/notify', {
		messages: [
			'*🚀 SEND*',
			`\t\t\t\t\t\t[${truncateHex(props.from, 5)}](${explorerBaseURI}/address/${
				props.from
			}) is sending tokens to [${truncateHex(props.to, 5)}](${explorerBaseURI}/address/${props.to}):`,
			...props.tokensMigrated.map(({token, normalizedBigAmount}, index): string => {
				const {address, symbol, decimals} = token || {};
				const txHashLink =
					props.type === 'EOA'
						? `${explorerBaseURI}/tx/${props.hashes[index]}`
						: `${safeBaseURIForNetwork(props.chainID)}${chainPrefix}:${props.from}/transactions/tx?safe=eth:${props.from}&id=multisig_${props.from}_${props.hashes[index]}`;
				return `\t\t\t\t\t\t\t- ${formatAmount(
					(normalizedBigAmount || zeroNormalizedBN).normalized,
					6,
					decimals
				)} [${symbol}](${explorerBaseURI}/address/${address}) | [tx](${txHashLink})`;
			})
		]
	});
}
