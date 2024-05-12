import {pad, toHex} from 'viem';
import XXH from 'xxhashjs';
import {ZERO_ADDRESS} from '@builtbymom/web3/utils';
import {FALLBACK_HANDLER, ZERO} from '@multisafeUtils/constants';

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
