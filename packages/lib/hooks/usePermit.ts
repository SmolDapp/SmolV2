import {hexToNumber, pad, parseAbi, slice, toHex} from 'viem';
import {decodeAsBigInt, decodeAsString, toAddress} from '@builtbymom/web3/utils';
import {retrieveConfig} from '@builtbymom/web3/utils/wagmi';
import {readContract, readContracts, signTypedData} from '@wagmi/core';

import type {TypedDataDomain} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';
import type {TEip2612Props, TPermitSignature, TSignPermitProps} from './usePermit.types';

export const PERMIT_ABI = [
	{
		inputs: [],
		stateMutability: 'view',
		type: 'function',
		name: 'name',
		outputs: [
			{
				internalType: 'string',
				name: '',
				type: 'string'
			}
		]
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: 'owner',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function',
		name: 'nonces',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		]
	},
	{
		inputs: [],
		name: 'version',
		outputs: [{internalType: 'string', name: '', type: 'string'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'apiVersion',
		outputs: [{internalType: 'string', name: '', type: 'string'}],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'EIP712_VERSION',
		outputs: [{internalType: 'string', name: '', type: 'string'}],
		stateMutability: 'view',
		type: 'function'
	}
] as const;

/**************************************************************************************************
 ** Signs a permit for a given ERC-2612 ERC20 token using the specified parameters.
 **
 ** @param {SignPermitProps} props - The properties required to sign the permit.
 ** @param {string} props.contractAddress - The address of the ERC20 token contract.
 ** @param {string} props.nameOverride - The name of the ERC20 token.
 ** @param {number} props.value - The amount of the ERC20 to approve.
 ** @param {string} props.ownerAddress - The address of the token holder.
 ** @param {string} props.spenderAddress - The address of the token spender.
 ** @param {number} props.deadline - The permit expiration timestamp in seconds.
 ** @param {number} props.nonceOverride - The nonce of the address on the specified ERC20.
 ** @param {number} props.chainID - The chain ID for which the permit will be valid.
 ** @param {number} props.permitVersionOverride - The version of the permit (defaults to "1").
 **************************************************************************************************/
export const signPermit = async ({
	contractAddress,
	nameOverride,
	ownerAddress,
	spenderAddress,
	value,
	deadline,
	nonceOverride,
	chainID,
	permitVersionOverride
}: TEip2612Props): Promise<TPermitSignature | undefined> => {
	const data = await readContracts(retrieveConfig(), {
		contracts: [
			{
				chainId: chainID,
				address: contractAddress,
				abi: PERMIT_ABI,
				functionName: 'nonces',
				args: [ownerAddress]
			},
			{
				chainId: chainID,
				address: contractAddress,
				abi: PERMIT_ABI,
				functionName: 'name'
			},
			{
				chainId: chainID,
				address: contractAddress,
				abi: PERMIT_ABI,
				functionName: 'version'
			},
			{
				chainId: chainID,
				address: contractAddress,
				abi: PERMIT_ABI,
				functionName: 'apiVersion'
			},
			{
				chainId: chainID,
				address: contractAddress,
				abi: PERMIT_ABI,
				functionName: 'EIP712_VERSION'
			}
		]
	});
	const nonceToUse = nonceOverride || decodeAsBigInt(data[0]);
	const nameToUse = nameOverride || decodeAsString(data[1]);
	const versionToUse =
		permitVersionOverride || decodeAsString(data[2]) || decodeAsString(data[3]) || decodeAsString(data[4]);

	if (
		(chainID === 1 && toAddress(contractAddress) === toAddress('0x6b175474e89094c44da98b954eedeac495271d0f')) ||
		(chainID === 137 && toAddress(contractAddress) === toAddress('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'))
	) {
		return signPermitDAI({
			contractAddress,
			ownerAddress,
			spenderAddress,
			deadline,
			chainID,
			nonceOverride: nonceToUse,
			nameOverride: nameToUse,
			permitVersionOverride: versionToUse
		});
	}

	const types = {
		Permit: [
			{name: 'owner', type: 'address'},
			{name: 'spender', type: 'address'},
			{name: 'value', type: 'uint256'},
			{name: 'nonce', type: 'uint256'},
			{name: 'deadline', type: 'uint256'}
		]
	};

	let domainData: TypedDataDomain = {
		name: nameToUse,
		version: versionToUse ?? '1',
		chainId: chainID,
		verifyingContract: contractAddress
	};
	if (chainID === 137 && toAddress(contractAddress) === toAddress('0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174')) {
		domainData = {
			name: nameToUse,
			version: permitVersionOverride ?? '1',
			verifyingContract: contractAddress,
			salt: pad(toHex(137), {size: 32})
		};
	}

	const message = {
		owner: ownerAddress,
		spender: spenderAddress,
		value,
		nonce: nonceToUse,
		deadline
	};

	try {
		const signature = await signTypedData(retrieveConfig(), {
			account: ownerAddress,
			message,
			domain: domainData,
			primaryType: 'Permit',
			types
		});
		const [r, s, v] = [slice(signature, 0, 32), slice(signature, 32, 64), slice(signature, 64, 65)];
		return {r, s, v: hexToNumber(v), deadline, signature};
	} catch (error) {
		return undefined;
	}
};

/**************************************************************************************************
 ** Signs a permit for a given ERC20 token using the specified parameters.
 **
 ** @param {SignPermitProps} props - The properties required to sign the permit.
 ** @param {string} props.contractAddress - The address of the ERC20 token contract.
 ** @param {string} props.nameOverride - The name of the ERC20 token.
 ** @param {string} props.ownerAddress - The address of the token holder.
 ** @param {string} props.spenderAddress - The address of the token spender.
 ** @param {number} props.deadline - The permit expiration timestamp in seconds.
 ** @param {number} props.nonce - The nonce of the address on the specified ERC20.
 ** @param {number} props.chainId - The chain ID for which the permit will be valid.
 ** @param {number} props.permitVersionOverride - The version of the permit (defaults to "1").
 **************************************************************************************************/
export const signPermitDAI = async ({
	contractAddress,
	nameOverride,
	ownerAddress,
	spenderAddress,
	deadline,
	nonceOverride,
	chainID,
	permitVersionOverride
}: TSignPermitProps): Promise<TPermitSignature | undefined> => {
	const types = {
		Permit: [
			{name: 'holder', type: 'address'},
			{name: 'spender', type: 'address'},
			{name: 'nonce', type: 'uint256'},
			{name: 'expiry', type: 'uint256'},
			{name: 'allowed', type: 'bool'}
		]
	};

	let domainData: TypedDataDomain = {
		name: nameOverride,
		/** There are no known Dai deployments with Dai permit and version other than or unspecified */
		version: permitVersionOverride ?? '1',
		chainId: chainID,
		verifyingContract: contractAddress
	};

	/** USDC on Polygon is a special case */
	if (chainID === 137 && nameOverride === 'USD Coin (PoS)') {
		domainData = {
			name: nameOverride,
			version: permitVersionOverride ?? '1',
			verifyingContract: contractAddress,
			salt: pad(toHex(137), {size: 32})
		};
	}

	const message = {
		holder: ownerAddress,
		spender: spenderAddress,
		nonce: nonceOverride,
		expiry: deadline,
		/** true == infinite allowance, false == 0 allowance*/
		allowed: true
	};

	try {
		const signature = await signTypedData(retrieveConfig(), {
			account: ownerAddress,
			domain: domainData,
			primaryType: 'Permit',
			types,
			message
		});
		const [r, s, v] = [slice(signature, 0, 32), slice(signature, 32, 64), slice(signature, 64, 65)];
		return {r, s, v: hexToNumber(v), deadline, signature};
	} catch (error) {
		return undefined;
	}
};

/**************************************************************************************************
 ** Checks if the given contract address supports permit.
 **************************************************************************************************/
export async function isPermitSupported(props: {
	contractAddress: TAddress;
	chainID: number;
	permitVersion?: 1 | 2;
	options?: {disableExceptions?: boolean};
}): Promise<boolean> {
	let {permitVersion} = props;
	if (!permitVersion) {
		permitVersion = 2;
	}

	/**************************************************************************************************
	 ** DAI on mainnet & polygon use a different permit version (Aka the DAI one), which is not
	 ** compatible with the Yearn Router. As this is the one we are using right now, we need to say it
	 ** does not support permit.
	 **************************************************************************************************/
	if (permitVersion === 2) {
		if (
			(props.chainID === 1 &&
				toAddress(props.contractAddress) === toAddress('0x6b175474e89094c44da98b954eedeac495271d0f')) ||
			(props.chainID === 137 &&
				toAddress(props.contractAddress) === toAddress('0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063'))
		) {
			return !props?.options?.disableExceptions;
		}
	}

	/**************************************************************************************************
	 ** As there is no proper way to check if a contract supports permit, we need to check if one of
	 ** three functions from the ERC-2612 permit standard is available.
	 ** We are checking the DOMAIN_SEPARATOR function, as it is the most common one.
	 **************************************************************************************************/
	try {
		const data = await readContract(retrieveConfig(), {
			address: props.contractAddress,
			abi: parseAbi(['function DOMAIN_SEPARATOR() external view returns (bytes32)']),
			functionName: 'DOMAIN_SEPARATOR',
			chainId: props.chainID
		});
		return Boolean(data);
	} catch (error) {
		return false;
	}
}
