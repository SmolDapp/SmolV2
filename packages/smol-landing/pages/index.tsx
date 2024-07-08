import Link from 'next/link';
import {Alignment, Fit, Layout, useRive} from '@rive-app/react-canvas';
import {Cutaway} from '@smolLandingDesignSystem/CutAway';
import {IconAppAddressBook, IconAppDisperse, IconAppSwap} from '@lib/icons/IconApps';
import {Button} from '@lib/primitives/Button';

import type {ReactElement} from 'react';

export default function Index(): ReactElement {
	const {RiveComponent} = useRive({
		src: 'smol-lp.riv',
		autoplay: true,
		layout: new Layout({
			fit: Fit.Cover,
			alignment: Alignment.Center
		})
	});
	return (
		<div className={'calc(h-screen-74px) flex flex-col justify-between'}>
			<div className={'mb-16 flex flex-col items-center justify-between md:flex-row'}>
				<div className={'mb-10 w-full md:mb-0 md:w-1/2'}>
					<span
						className={
							'mb-4 w-full font-[Monument] text-[40px] font-extrabold leading-[40px] md:text-[54px] md:leading-[64px]'
						}>
						{'MAKING CRYPTO SIMPLER'}
					</span>
					<p className={'mb-10 text-base text-neutral-700'}>
						{
							'MOM HUB adds super powers to your wallet, to make your crypto journey faster, simpler and maybe even a little bit sexier.'
						}
					</p>

					<Link
						href={'https://smold.app/'}
						className={'flex max-w-min whitespace-nowrap'}>
						<Button className={'!h-14 !px-8 text-base !font-bold leading-6 text-neutral-900 md:!px-12'}>
							{'Launch App'}
						</Button>
					</Link>
				</div>
				<div className={'mt-6 size-[300px] md:mt-0 md:size-[420px]'}>
					<RiveComponent />
				</div>
			</div>

			<div
				className={
					'mb-3 grid grid-cols-1 grid-rows-3 place-content-center gap-y-6 md:grid-cols-3 md:grid-rows-1 md:items-center md:gap-x-6'
				}>
				<Cutaway
					title={
						<span className={'font-[Monument] font-extrabold'}>
							{'NATIVE'}
							<br />
							{'ADDRESS BOOK'}
						</span>
					}
					description={'Never forget and address or fail for an injected address scam again!'}
					link={'https://smold.app/apps/address-book'}
					buttonTitle={'Add Contact'}
					icon={<IconAppAddressBook className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span className={'font-[Monument] font-extrabold'}>
							{'SWAP'}
							<br />
							{'AND BRIDGE'}
						</span>
					}
					description={'Enjoy crosschain swaps lightening fast with Smol Swap'}
					link={'https://smold.app/apps/swap'}
					buttonTitle={'Make a swap'}
					icon={<IconAppSwap className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span className={'font-[Monument] font-extrabold'}>
							{'DID YOU SAY'}
							<br /> {'"DISPERSE?"'}
						</span>
					}
					description={
						'Beloved by projects and individuals, send tokens to multiple addresses at the same time with disperse'
					}
					link={'https://smold.app/apps/disperse'}
					buttonTitle={'Disperse tokens'}
					icon={<IconAppDisperse className={'size-4'} />}
				/>
			</div>
		</div>
	);
}
