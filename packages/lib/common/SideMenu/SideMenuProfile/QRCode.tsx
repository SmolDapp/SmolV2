import {type ReactElement, useCallback, useState} from 'react';
import Image from 'next/image';
import {QRModal} from 'packages/lib/common/QRModal';
import {IconQRCode} from 'packages/lib/icons/IconQRCode';
import QRCode from 'qrcode';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isAddress} from '@builtbymom/web3/utils';

export const QRCodeElement = (): ReactElement | null => {
	const {address} = useWeb3();
	const [qrcode, set_qrcode] = useState<string>('');
	const [isOpen, set_isOpen] = useState(false);

	/**********************************************************************************************
	 ** Generate the QR code for the current address
	 *********************************************************************************************/
	const generate = useCallback((): void => {
		set_isOpen(true);
		QRCode.toDataURL(address?.toString() || '').then(set_qrcode);
	}, [address]);

	/**********************************************************************************************
	 ** Close the QR code modal
	 *********************************************************************************************/
	const onClose = useCallback((): void => {
		set_isOpen(false);
	}, []);

	if (!isAddress(address)) {
		return null;
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
				address={address}>
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
