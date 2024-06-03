import {fromHex, pad, toHex} from 'viem';
import XXH from 'xxhashjs';
import {toAddress, ZERO_ADDRESS} from '@builtbymom/web3/utils';
import {
	FALLBACK_HANDLER,
	SAFE_CREATION_SIGNATURE,
	SINGLETON_L1,
	SINGLETON_L2,
	SINGLETON_L2_DDP,
	ZERO
} from '@smolSections/Multisafe/constants';

import type {Hex} from 'viem';
import type {TAddress} from '@builtbymom/web3/types';

export function generateArgInitializers(owners: TAddress[], threshold: number): string {
	return (
		'b63e800d' + //Function signature
		'100'.padStart(64, '0') + // Version
		threshold.toString().padStart(64, '0') + // Threshold
		ZERO_ADDRESS.substring(2).padStart(64, '0') + // Address zero, TO
		pad(toHex(0x120 + 0x20 * owners.length))
			.substring(2)
			.padStart(64, '0') + // Data length
		FALLBACK_HANDLER.substring(2).padStart(64, '0') +
		ZERO_ADDRESS.substring(2).padStart(64, '0') + // paymentToken
		ZERO.padStart(64, '0') + // payment
		ZERO_ADDRESS.substring(2).padStart(64, '0') + // paymentReceiver
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
	const ownersLength = Number(parts[8]);
	const owners = parts.slice(9, 9 + ownersLength).map((owner): TAddress => toAddress(`0x${owner.substring(24)}`));

	let singleton = SINGLETON_L2;
	if (argsHex.toLowerCase().includes('3e5c63644e683549055b9be8653de26e0b4cd36e')) {
		singleton = SINGLETON_L2_DDP;
	} else if (argsHex.toLowerCase().includes('d9db270c1b5e3bd161e8c8503c55ceabee709552')) {
		singleton = SINGLETON_L1;
	}
	return {owners, threshold, salt: fromHex(salt, 'bigint'), singleton};
}
