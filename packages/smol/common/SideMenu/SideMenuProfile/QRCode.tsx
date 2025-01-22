'use client';

import {toAddress} from 'lib/utils/tools.addresses';
import Image from 'next/image';
import {IconQRCode} from 'packages/lib/icons/IconQRCode';
import * as QRCode from 'qrcode';
import {useCallback, useState} from 'react';
import {useAccount} from 'wagmi';

import {QRModal} from 'packages/smol/common/QRModal';

import type {ReactElement} from 'react';

export const QRCodeElement = (): ReactElement | null => {
	const {address, isConnected} = useAccount();
	const [qrcode, setQRcode] = useState<string>('');
	const [isOpen, setIsOpen] = useState(false);

	/**********************************************************************************************
	 ** Generate the QR code for the current address
	 *********************************************************************************************/
	const generate = useCallback((): void => {
		setIsOpen(true);
		QRCode.toDataURL(address?.toString() || '').then(setQRcode);
	}, [address]);

	/**********************************************************************************************
	 ** Close the QR code modal
	 *********************************************************************************************/
	const onClose = useCallback((): void => {
		setIsOpen(false);
	}, []);

	if (!isConnected) {
		return (
			<div
				className={'flex items-center justify-center'}
				role={'button'}>
				<div className={'skeleton-md size-5'} />
			</div>
		);
	}

	return (
		<>
			<div
				className={'flex items-center justify-center'}
				role={'button'}
				onClick={generate}>
				<IconQRCode className={'size-5 text-neutral-500 transition-colors hover:text-neutral-900'} />
			</div>

			<QRModal
				title={'Get your address'}
				content={'Scan the QR code to get your wallet address'}
				isOpen={isOpen}
				onClose={onClose}
				address={toAddress(address)}>
				<Image
					src={qrcode}
					alt={'qr-code'}
					width={256}
					height={256}
				/>
			</QRModal>
		</>
	);
};
