'use client';

import {Alignment, Fit, Layout, useRive} from '@rive-app/react-canvas';
import Link from 'next/link';
import React from 'react';

import {
	IconAppAddressBook,
	IconAppDisperse,
	IconAppRevoke,
	IconAppStream,
	IconAppSwap
} from '@lib/components/icons/IconApps';
import IconMultisafe from '@lib/icons/IconMultisafe';
import {cl} from '@lib/utils/helpers';

import type {ReactElement} from 'react';

type TCutaway = {
	title: ReactElement;
	description: string;
	link: string;
	buttonTitle: string;
	icon: ReactElement;
};

function Cutaway({title, description, link, buttonTitle, icon}: TCutaway): ReactElement {
	return (
		<div className={'flex flex-col justify-between rounded-2xl bg-neutral-200 px-6 py-8 md:h-full'}>
			<div className={'mb-6'}>
				<div className={'mb-3 text-[18px] font-semibold leading-[24px] text-neutral-900'}>{title}</div>
				<div className={'text-sm text-[#ADB1BD]'}>{description}</div>
			</div>
			<Link href={link}>
				<button
					data-variant={'filled'}
					className={cl('button', '!h-10 w-full')}>
					<span className={'mr-2 text-sm'}>{buttonTitle}</span>
					{icon}
				</button>
			</Link>
		</div>
	);
}

export default function Page(): ReactElement {
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
			<div className={'mb-6 flex flex-col items-center justify-between gap-10 rounded-2xl bg-primary p-6 md:flex-row md:px-20 md:pb-8 md:pt-[72px]'}>
				<div className={'w-full md:mb-0 md:w-2/3'}>
					<h1 className={'w-full font-[Monument] text-[22px] font-extrabold leading-[40px] md:mb-4 md:text-[32px]'}>
						{'MAKING CRYPTO SIMPLER'}
					</h1>
					<p className={'mt-6 w-full text-sm text-[#060B11] md:mb-10 md:w-11/12 md:text-base'}>
						{
							'Smol adds super powers to your wallet, to make your crypto journey faster, simpler and maybe even a little bit sexier.'
						}
					</p>

					<Link
						href={'/wallet'}
						className={'hidden max-w-min whitespace-nowrap'}>
						<button
							data-variant={'filled'}
							className={cl(
								'button',
								'!h-14 !px-8 text-base !font-bold leading-6 text-neutral-900 md:!px-12'
							)}>
							{'Launch App'}
						</button>
					</Link>
				</div>
				<div className={'-mt-6 hidden size-[240px] min-w-[240px] md:block'}>
					<RiveComponent />
				</div>
			</div>

			<div
				className={
					'mb-3 grid grid-cols-1 place-content-center gap-y-6 md:grid-cols-2 md:items-center md:gap-x-6 lg:grid-cols-3'
				}>
				<Cutaway
					title={
						<span>
							{'ONE SAFE,'}
							<br />
							{'ALL CHAINS'}
						</span>
					}
					description={'Click and clone your Safe on any chain. Easy peasy.'}
					link={'/multisafe'}
					buttonTitle={'Clone my safe'}
					icon={<IconMultisafe className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span>
							{'SWAP'}
							<br />
							{'AND BRIDGE'}
						</span>
					}
					description={'Enjoy crosschain swaps lightening fast with Smol Swap'}
					link={'/swap'}
					buttonTitle={'Make a swap'}
					icon={<IconAppSwap className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span>
							{'DID YOU SAY'}
							<br /> {'"DISPERSE?"'}
						</span>
					}
					description={
						'Beloved by projects and individuals, send tokens to multiple addresses at the same time with disperse'
					}
					link={'/disperse'}
					buttonTitle={'Disperse tokens'}
					icon={<IconAppDisperse className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span>
							{'CLAIM YOUR'}
							<br />
							{'STREAM'}
						</span>
					}
					description={"Whether it's a salary, a grant or something else, Smol will help you claim it."}
					link={'https://v1.smold.app/stream'}
					buttonTitle={'Claim your stream'}
					icon={<IconAppStream className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span>
							{'NATIVE ADDRESS'}
							<br />
							{'BOOK'}
						</span>
					}
					description={'Never forget and address or fail for an injected address scam again!'}
					link={'/address-book'}
					buttonTitle={'Add Contact'}
					icon={<IconAppAddressBook className={'size-4'} />}
				/>
				<Cutaway
					title={
						<span>
							{'STAY SAFE,'}
							<br /> {'REVOKE!'}
						</span>
					}
					description={'Take control of your contract approvals and check who can spend your tokens'}
					link={'/revoke'}
					buttonTitle={'Revoke allowances'}
					icon={<IconAppRevoke className={'size-4'} />}
				/>
			</div>
		</div>
	);
}
