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
					{'Built on the '}
					<Link
						href={'https://safe.global'}
						target={'_blank'}
						className={'text-[#00B460] underline'}>
						{'Safe protocol'}
					</Link>
					{
						", it's perfect for individuals, companies, and DAOs looking to manage their crypto treasuries efficiently. With easy setup and cost-effective deployment, MultiSafe ensures you have complete control over your cross-chain crypto assets."
					}
				</p>
				<p className={'text-sm'}>{'Smol charges a smol fee of $4.20 per deployment.'}</p>
			</div>
		</div>
	);
}

export {MultisafeAppInfo};
