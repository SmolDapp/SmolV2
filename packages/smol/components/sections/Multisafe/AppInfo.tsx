import Image from 'next/image';
import Link from 'next/link';

import type {ReactElement} from 'react';

function MultisafeAppInfo(): ReactElement {
	return (
		<div>
			<div className={'my-4 overflow-hidden rounded-lg bg-neutral-200'}>
				<Image
					alt={''}
					src={'/safe.png'}
					width={1500}
					height={260}
					className={'rounded-lg'}
				/>
			</div>
			<div>
				<p className={'text-sm font-medium text-neutral-700'}>
					{
						'MultiSafe streamlines and secures your digital assets by allowing you to deploy and handle multi-signature wallets effortlessly.'
					}
				</p>
				<p className={'py-4 text-sm'}>
					{'Multisafe is built on '}
					<Link
						href={'https://safe.global'}
						target={'_blank'}
						className={'text-[#00B460] underline'}>
						{'Safe protocol'}
					</Link>
					{' and Safe’s smart contracts to enable users to have the same Safe address on every chain.'}
				</p>
				<p className={'pb-4 text-sm'}>
					{'The same security you know and love from Safe, but now with a consistent address above chains.'}
				</p>
				<p className={'pb-4 text-sm'}>{'Smol charges a smol fee of $4.20 per deployment.'}</p>
				<p className={'text-sm'}>
					{
						'Please note, that some Safe’s that were deployed via Safe’s legacy contract cannot be cloned to new chains.'
					}
				</p>
			</div>
		</div>
	);
}

export {MultisafeAppInfo};
