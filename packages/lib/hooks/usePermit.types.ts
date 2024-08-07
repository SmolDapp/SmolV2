import type {Hex} from 'viem';

export type TPermitSignature = {
	r: Hex;
	s: Hex;
	v: number;
	deadline: bigint;
	signature: Hex;
};

export type TSignPermitProps = {
	/** Address of the token to approve */
	contractAddress: Hex;
	/** Owner of the tokens. Usually the currently connected address. */
	ownerAddress: Hex;
	/** Address to grant allowance to */
	spenderAddress: Hex;
	/** Expiration of this approval, in SECONDS */
	deadline: bigint;
	/** Numerical chainId of the token contract */
	chainID: number;
	/** Name of the token to approve.
	 * Corresponds to the `name` method on the ERC-20 contract. Please note this must match exactly byte-for-byte */
	nameOverride?: string;
	/** Defaults to 1. Some tokens need a different version, check the [PERMIT INFORMATION](https://github.com/vacekj/wagmi-permit/blob/main/PERMIT.md) for more information */
	permitVersionOverride?: string;
	/** Permit nonce for the specific address and token contract. You can get the nonce from the `nonces` method on the token contract. */
	nonceOverride?: bigint;
};

export type TEip2612Props = TSignPermitProps & {
	/** Amount to approve */
	value: bigint;
};
