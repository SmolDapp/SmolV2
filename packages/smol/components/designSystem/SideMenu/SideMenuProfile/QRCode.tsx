import {Fragment, type ReactElement, useState} from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import {useAccount} from 'wagmi';
import {IconQRCode} from 'packages/lib/icons/IconQRCode';
import {QRModal} from 'packages/lib/common/QRModal';

export const QRCodeElement = (): ReactElement | null => {
	const [qrcode, set_qrcode] = useState<string>('');
	const [isOpen, set_isOpen] = useState(false);

	const {address} = useAccount();
	const generate = (): void => {
		set_isOpen(true);
		QRCode.toDataURL(address?.toString() || '').then(set_qrcode);
	};

	if (!address) {
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
				title={'Scan QR-code'}
				content={'Just scan this QR-code to get your account address'}
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
