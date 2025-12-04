'use client';

import {useAccountModal} from '@rainbow-me/rainbowkit';
import {useUpdateEffect} from '@react-hookz/web';
import Identicon from 'identicon.js';
import Image from 'next/image';
import {useMemo, useState} from 'react';
import {mainnet} from 'viem/chains';
import {useEnsAvatar, useEnsName} from 'wagmi';

import {cl} from '@lib/utils/helpers';
import {isAddress, toAddress} from '@lib/utils/tools.addresses';

import type {TAddress} from '@lib/utils/tools.addresses';
import type {ReactElement} from 'react';

/******************************************************************************
 ** The Avatar component is used to display the avater linked to an address. It
 ** can take different forms depending on the props passed to it.
 ** - If the isLoading prop is set to true, it will display a skeleton.
 ** - If no src is provided or if the provided address isn't an address, an
 **   empty placeholder will be displayed.
 ** - If no src is provided but the address is an address, an identicon will be
 **   displayed, based on this address.
 ** - If a src is provided, it will be displayed (ex: an ENS avatar).
 *****************************************************************************/
export function Avatar(props: {
	src: string | null | undefined;
	address: TAddress | undefined;
	isLoading: boolean;
	label?: string;
	sizeClassname?: string;
	isClickable?: boolean;
}): ReactElement {
	const [imageSrc, setImageSrc] = useState(props.src);
	const hasAvatar = useMemo(() => imageSrc !== undefined, [imageSrc]);
	const sizeClassname = props.sizeClassname || 'h-8 w-8 min-w-[32px]';
	const {openAccountModal} = useAccountModal();

	useUpdateEffect((): void => {
		setImageSrc(props.src);
	}, [props.src]);

	if (props.isLoading) {
		return <div className={cl('skeleton-full', sizeClassname)} />;
	}
	if (!hasAvatar && !isAddress(props.address)) {
		return <div className={cl('rounded-full bg-neutral-200', sizeClassname)} />;
	}
	if (!hasAvatar || !imageSrc) {
		const data = new Identicon(toAddress(props.address), {
			background: [255, 255, 255, 0],
			size: 128,
			margin: 0.2
		}).toString();
		return (
			<div
				className={cl(
					'rounded-full flex justify-center items-center border border-neutral-400',
					sizeClassname
				)}>
				<Image
					src={`data:image/png;base64,${data}`}
					className={'size-full cursor-pointer rounded-full'}
					width={128}
					onClick={openAccountModal}
					height={128}
					alt={''}
				/>
			</div>
		);
	}
	return (
		<div className={cl('rounded-full bg-neutral-200/40', sizeClassname)}>
			<Image
				key={imageSrc}
				className={'cursor-pointer rounded-full'}
				unoptimized
				onClick={props.isClickable ? openAccountModal : undefined}
				src={imageSrc || ''}
				width={128}
				height={128}
				alt={''}
				onError={() => setImageSrc(undefined)}
			/>
		</div>
	);
}

/******************************************************************************
 ** The AvatarWrapper component is a wrapper around the Avatar component. It's
 ** used to abstract the logic of fetching the avatar from the ENS name from
 ** the component that uses it.
 *****************************************************************************/
export function AvatarWrapper(props: {address: TAddress; sizeClassname?: string; isClickable?: boolean}): ReactElement {
	const sizeClassname = props.sizeClassname || 'h-32 w-32 min-w-[128px]';
	const {
		data: ensName,
		isLoading: isLoadingENS,
		isFetched: isFetchedENS,
		isError: isErrorENS
	} = useEnsName({
		chainId: mainnet.id,
		address: toAddress(props.address),
		query: {
			staleTime: Infinity
		}
	});
	const {
		data: avatar,
		isLoading: isLoadingAvatar,
		isFetched: isFetchedAvatar,
		isError: isErrorAvatar
	} = useEnsAvatar({
		chainId: mainnet.id,
		name: ensName || undefined,
		query: {
			enabled: Boolean(ensName),
			staleTime: Infinity
		}
	});
	const hasENS = isFetchedENS || isErrorENS;
	const hasAvatar = isFetchedAvatar || isErrorAvatar;

	return (
		<Avatar
			isLoading={isLoadingENS || isLoadingAvatar || (hasENS && Boolean(ensName) && !hasAvatar)}
			address={toAddress(props.address)}
			label={ensName || undefined}
			src={avatar}
			sizeClassname={sizeClassname}
			isClickable={props.isClickable}
		/>
	);
}
