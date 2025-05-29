/* eslint-disable prefer-destructuring */
import {fromHex, pad, toHex, zeroAddress} from 'viem';
import XXH from 'xxhashjs';

import {toAddress} from '@lib/utils/tools.addresses';
import {
	ALTERNATE_FALLBACK_HANDLER,
	FALLBACK_HANDLER,
	FALLBACK_HANDLER_1_4_1,
	PROXY_FACTORY_1_4_1,
	PROXY_FACTORY_L1,
	PROXY_FACTORY_L2,
	PROXY_FACTORY_L2_DDP,
	SAFE_CREATION_SIGNATURE,
	SINGLETON_1_4_1,
	SINGLETON_L1,
	SINGLETON_L2,
	SINGLETON_L2_DDP,
	ZERO
} from 'app/(apps)/multisafe/constants';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {Hex} from 'viem';

export function getProxyFromSingleton(singleton: TAddress): TAddress {
	if (singleton === SINGLETON_L2) {
		return PROXY_FACTORY_L2;
	}
	if (singleton === SINGLETON_L2_DDP) {
		return PROXY_FACTORY_L2_DDP;
	}
	if (singleton === SINGLETON_L1) {
		return PROXY_FACTORY_L1;
	}
	if (singleton === SINGLETON_1_4_1) {
		return PROXY_FACTORY_1_4_1;
	}
	return PROXY_FACTORY_L2;
}

export function getFallbackHandler(singleton: TAddress, useAlternateFallbackHandler: boolean): TAddress {
	if (singleton === SINGLETON_1_4_1) {
		return FALLBACK_HANDLER_1_4_1;
	}
	return useAlternateFallbackHandler ? ALTERNATE_FALLBACK_HANDLER : FALLBACK_HANDLER;
}

export function generateArgInitializers(
	owners: TAddress[],
	threshold: number,
	paymentReceiver: TAddress,
	fallbackHandler: TAddress,
	singleton: TAddress
): string {
	if (singleton === SINGLETON_1_4_1) {
		const safeToL2SetupAddress = toAddress('0xBD89A1CE4DDe368FFAB0eC35506eEcE0b1fFdc54');
		const safeL2Address = toAddress('0x29fcB43b46531BcA003ddC8FCB67FFE91900C762');

		return (
			'b63e800d' + //Function signature
			'100'.padStart(64, '0') + // Version
			threshold.toString().padStart(64, '0') + // Threshold
			safeToL2SetupAddress.substring(2).padStart(64, '0') + // SafeToL2Address
			pad(toHex(0x120 + 0x20 * owners.length))
				.substring(2)
				.padStart(64, '0') + // Data length
			fallbackHandler
				.substring(2)
				.padStart(64, '0') +
			zeroAddress.substring(2).padStart(64, '0') + // paymentToken
			ZERO.padStart(64, '0') + // payment
			(paymentReceiver || zeroAddress).substring(2).padStart(64, '0') + // paymentReceiver
			owners.length.toString().padStart(64, '0') + // owners.length
			owners.map((owner): string => owner.substring(2).padStart(64, '0')).join('') + // owners
			'24'.padStart(64, '0') + // Extra data length
			// Safe optional multi-chain setup using the `SafeToL2Setup` contract
			'fe51f643' + // Signature for call to safeToL2Setup
			safeL2Address.substring(2).padStart(64, '0') + // SafeL2Address
			ZERO.padStart(56, '0') // Data length, 64 - 8 = 56
		);
	}
	return (
		'b63e800d' + //Function signature
		'100'.padStart(64, '0') + // Version
		threshold.toString().padStart(64, '0') + // Threshold
		zeroAddress.substring(2).padStart(64, '0') + // Address zero, TO
		pad(toHex(0x120 + 0x20 * owners.length))
			.substring(2)
			.padStart(64, '0') + // Data length
		fallbackHandler
			.substring(2)
			.padStart(64, '0') +
		zeroAddress.substring(2).padStart(64, '0') + // paymentToken
		ZERO.padStart(64, '0') + // payment
		(paymentReceiver || zeroAddress).substring(2).padStart(64, '0') + // paymentReceiver
		owners.length.toString().padStart(64, '0') + // owners.length
		owners.map((owner): string => owner.substring(2).padStart(64, '0')).join('') + // owners
		ZERO.padStart(64, '0') // data.length
	);
}

export function createUniqueID(msg: string): string {
	const hash = XXH.h32(0x536d6f6c).update(msg).digest().toString(16);
	return hash;
}

export function decodeArgInitializers(argsHex: Hex): {
	owners: TAddress[];
	threshold: number;
	salt: bigint;
	singleton: TAddress;
	paymentReceiver: TAddress;
} {
	const allParts = argsHex.substring(10).match(/.{1,64}/g);
	if (!allParts) {
		throw new Error('Invalid args');
	}
	const salt = `0x${allParts[2]}` as Hex;
	const args = argsHex.substring(argsHex.indexOf(SAFE_CREATION_SIGNATURE) + SAFE_CREATION_SIGNATURE.length);
	const parts = args.match(/.{1,64}/g);
	if (!parts) {
		throw new Error('Invalid args');
	}
	const threshold = Number(parts[1]);
	// const somethingNotIdentified = parts[2];
	// const somethingNotIdentified2 = parts[3];
	// const probablyFallbackHandler = parts[4];
	// const probablyPaymentToken = parts[5];
	// const probablyPayment = parts[6];
	const probablyPaymentReceiver = toAddress(`0x${parts[7].substring(24)}`);
	const ownersLength = Number(parts[8]);
	const owners = parts.slice(9, 9 + ownersLength).map((owner): TAddress => toAddress(`0x${owner.substring(24)}`));

	let singleton = SINGLETON_L2;
	if (argsHex.toLowerCase().includes('3e5c63644e683549055b9be8653de26e0b4cd36e')) {
		singleton = SINGLETON_L2_DDP;
	} else if (argsHex.toLowerCase().includes('d9db270c1b5e3bd161e8c8503c55ceabee709552')) {
		singleton = SINGLETON_L1;
	} else if (argsHex.toLowerCase().includes('41675c099f32341bf84bfc5382af534df5c7461a')) {
		singleton = SINGLETON_1_4_1;
	}

	return {owners, threshold, salt: fromHex(salt, 'bigint'), singleton, paymentReceiver: probablyPaymentReceiver};
}
