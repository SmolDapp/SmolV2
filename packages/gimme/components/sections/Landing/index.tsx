import {type ReactElement} from 'react';
import Image from 'next/image';
import {Alignment, Fit, Layout, useRive} from '@rive-app/react-canvas';

export function Landing(): ReactElement {
	const {RiveComponent} = useRive({
		src: 'gimme_hero.riv',
		autoplay: true,
		stateMachines: 'State Machine 1',
		layout: new Layout({
			fit: Fit.Contain,
			alignment: Alignment.TopCenter
		})
	});
	const {RiveComponent: Card1} = useRive({
		src: 'gimme_img-1.riv',
		autoplay: true,
		stateMachines: 'State Machine 1',
		layout: new Layout({
			fit: Fit.Contain,
			alignment: Alignment.TopCenter
		})
	});
	const {RiveComponent: Card2} = useRive({
		src: 'gimme_img-2.riv',
		autoplay: true,
		stateMachines: 'State Machine 1',
		layout: new Layout({
			fit: Fit.Contain,
			alignment: Alignment.TopCenter
		})
	});
	const {RiveComponent: Card3} = useRive({
		src: 'gimme_img-3.riv',
		autoplay: true,
		stateMachines: 'State Machine 1',
		layout: new Layout({
			fit: Fit.Contain,
			alignment: Alignment.TopCenter
		})
	});

	const CARDS = [
		{
			title: 'DeFi Dumbed Down',
			description:
				'Get access to the best yields in DeFi without needing a PhD to understand what you’re looking at.',
			Animation: Card1
		},
		{
			title: 'Protocol Powered',
			description: 'Gimme is built on long running DeFi protocols with outstanding track records like Yearn.',
			Animation: Card2
		},
		{
			title: 'Spend less, earn more',
			description:
				'Gimme is built on L2s to save you expensive gas costs. Faster, cheaper, and more yield for you.',
			Animation: Card3
		}
	];

	return (
		<div className={'scrollbar-hide z-10 min-h-[150vh] flex-col items-center justify-center'}>
			<div className={'relative mt-[84px] h-full max-h-[260px] md:max-h-[480px] lg:max-h-[660px]'}>
				<div className={'flex size-full flex-1'}>
					<RiveComponent />
				</div>
			</div>
			<div className={'mx-auto mt-16 flex w-full max-w-[800px] flex-col items-center gap-6 md:mt-[120px]'}>
				<Image
					src={'/landing-description.svg'}
					alt={'landing-description'}
					width={500}
					height={192}
				/>
				<p className={'text-wrap text-center text-lg text-white'}>
					{
						'DeFi offers some of the best yields available on the planet, but they’re often hidden behind complex '
					}
					{'UIs designed for whales. GIMME is here to fix that.'}
				</p>
			</div>
			<div
				className={
					'mb-[320px] mt-20 grid grid-rows-3 place-content-center gap-6 md:grid-cols-3 md:grid-rows-1'
				}>
				{CARDS.map(({title, description, Animation}) => (
					<div
						className={
							'text-grey-800 border-grey-200 max-w-[384px] rounded-[32px] border bg-white px-8 pb-8 pt-2'
						}>
						<div className={'h-full max-h-[180px] md:max-h-[120px] lg:max-h-[180px]'}>
							<Animation />
						</div>
						<p className={'mb-2 text-[24px] font-bold'}>{title}</p>
						<p className={'text-grey-800 font-medium'}>{description}</p>
					</div>
				))}
			</div>
			<div className={'absolute inset-x-0 bottom-[180px] flex flex-col gap-8 p-4 md:bottom-0 md:flex-row'}>
				<div className={'text-grey-800 text-xxs text-center font-medium md:text-left'}>
					{
						'The gimme.mom web-based user interface is provided as a tool for users to interact with third party DeFi protocols on their own initiative, without any endorsement or recommendation of cryptoasset trading activities. In doing so, Gimme.Mom is not recommending that users or potential users engage in cryptoasset trading activity, and users or potential users of the web-based user interface should not regard this website or its contents as involving any form of recommendation, invitation or inductement to deal in cryptoassets.'
					}
				</div>
				<b className={'text-grey-800 -mt-4 block text-center text-xs md:hidden'}>
					{`©${new Date().getFullYear()} Built by MOM`}
				</b>
				<div className={'bg-primary hidden size-fit whitespace-nowrap rounded-[32px] px-3 py-2 md:flex'}>
					<b className={'text-xs text-neutral-900'}>{`©${new Date().getFullYear()} Built by MOM`}</b>
				</div>
			</div>
		</div>
	);
}
