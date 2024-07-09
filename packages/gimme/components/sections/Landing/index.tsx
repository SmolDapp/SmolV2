import {type ReactElement} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {Alignment, Fit, Layout, useRive} from '@rive-app/react-canvas';
import {Button} from '@lib/primitives/Button';

const CARDS = [
	{
		title: 'DeFi Dumbed Down',
		description: 'Get access to the best yields in DeFi without needing a PhD to understand what you’re looking at.'
	},
	{
		title: 'Protocol Powered',
		description: 'Gimme is built on long running DeFi protocols with outstanding track records like Yearn.'
	},
	{
		title: 'Spend less, earn more',
		description: 'Gimme is built on L2s to save you expensive gas costs. Faster, cheaper, and more yield for you.'
	}
];

export function Landing(): ReactElement {
	const {RiveComponent} = useRive({
		src: 'gimme.riv',
		autoplay: true,
		layout: new Layout({
			fit: Fit.ScaleDown,
			alignment: Alignment.TopCenter
		})
	});

	return (
		<div className={'z-10 flex-col items-center justify-center'}>
			<div className={'relative mt-[84px] h-full max-h-[260px] md:max-h-[480px] lg:max-h-[660px]'}>
				<div className={'flex size-full flex-1'}>
					<RiveComponent />
				</div>
				<Link href={'/earn'}>
					<Button
						className={
							'!absolute !top-[68%] left-1/2 w-[206px] -translate-x-1/2 !rounded-[20px] md:!top-[72%]'
						}>
						{'Launch App'}
					</Button>
				</Link>
			</div>
			<div className={'mx-auto mt-[120px] flex w-full max-w-[800px] flex-col items-center gap-6'}>
				<Image
					src={'/landing-description.svg'}
					alt={'landing-description'}
					width={500}
					height={192}
				/>
				<p className={'text-wrap text-center text-lg text-white'}>
					{
						'DeFi offers some of the best yields available on the planet, but they’re often hidden behind complex'
					}
					{'UIs designed for whales. GIMME is here to fix that.'}
				</p>
			</div>
			<div
				className={
					'mb-[320px] mt-20 grid grid-rows-3 place-content-center gap-6 md:grid-cols-3 md:grid-rows-1'
				}>
				{CARDS.map(card => (
					<div className={'text-grey-800 max-w-[384px] rounded-[32px] bg-white p-8'}>
						<p className={'mb-2 text-[24px] font-bold'}>{card.title}</p>
						<p className={'text-grey-800 font-medium'}>{card.description}</p>
					</div>
				))}
			</div>
		</div>
	);
}
