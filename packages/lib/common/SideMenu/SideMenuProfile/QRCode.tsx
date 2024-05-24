import {Fragment, type ReactElement, useState} from 'react';
import Image from 'next/image';
import {QRModal} from 'packages/lib/common/QRModal';
import {IconQRCode} from 'packages/lib/icons/IconQRCode';
import QRCode from 'qrcode';
import {useWeb3} from '@builtbymom/web3/contexts/useWeb3';
import {isZeroAddress} from '@builtbymom/web3/utils';

export const QRCodeElement = (): ReactElement | null => {
	const [qrcode, set_qrcode] = useState<string>('');
	const [isOpen, set_isOpen] = useState(false);

	const {address} = useWeb3();
	const generate = (): void => {
		set_isOpen(true);
		QRCode.toDataURL(address?.toString() || '').then(set_qrcode);
	};

	if (!isZeroAddress(address) || !address) {
		return null;
	}

	return (
		<Fragment>
			<div
				className={'flex items-center justify-center'}
				role={'button'}
				onClick={generate}>
				<IconQRCode className={'size-6'} />
			</div>

			<QRModal
				title={'Get your address'}
				content={'Scan the QR code to get your wallet address'}
				isOpen={isOpen}
				onClose={(): void => set_isOpen(false)}
				address={address}>
				<Image
					src={qrcode}
					alt={'qr-code'}
					width={256}
					height={256}
				/>
			</QRModal>
		</Fragment>
	);
};
