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
import {IconSpinner} from '@lib/components/icons/IconSpinner';
import IconMultisafe from '@lib/icons/IconMultisafe';
import {cl} from '@lib/utils/helpers';

import type {ComponentPropsWithoutRef, MouseEvent, ReactElement} from 'react';

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
				<div className={'mb-3 text-[18px] font-extrabold leading-[24px] text-neutral-900'}>{title}</div>
				<div className={'text-sm text-neutral-700'}>{description}</div>
			</div>
			<Link href={link}>
				<Button className={'!h-10 w-full'}>
					<span className={'mr-2 text-sm'}>{buttonTitle}</span>
					{icon}
				</Button>
			</Link>
		</div>
	);
}

type TButtonVariant = 'filled' | 'outlined' | 'light' | 'inherit' | string;

type TButton = {
	variant?: TButtonVariant;
	shouldStopPropagation?: boolean;
	isBusy?: boolean;
	isDisabled?: boolean;
} & ComponentPropsWithoutRef<'button'>;

type TMouseEvent = MouseEvent<HTMLButtonElement> & MouseEvent<HTMLAnchorElement>;

function Button(props: TButton): ReactElement {
	const {
		children,
		variant = 'filled',
		shouldStopPropagation = false,
		isBusy = false,
		isDisabled = false,
		...rest
	} = props;

	return (
		<button
			{...(rest as ComponentPropsWithoutRef<'button'>)}
			data-variant={variant}
			className={cl('button', rest.className)}
			aria-busy={isBusy}
			disabled={isDisabled || (rest as ComponentPropsWithoutRef<'button'>).disabled}
			onClick={(event: TMouseEvent): void => {
				if (shouldStopPropagation) {
					event.stopPropagation();
				}
				if (!isBusy && rest.onClick) {
					rest.onClick(event);
				}
			}}>
			{children}
			{isBusy ? (
				<span className={'absolute inset-0 flex items-center justify-center'}>
					<IconSpinner className={'size-6 animate-spin text-neutral-900'} />
				</span>
			) : null}
		</button>
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
			<div className={'mb-16 flex flex-col items-center justify-between gap-10 md:flex-row'}>
				<div className={'mb-10 w-2/3 md:mb-0'}>
					<h1 className={'mb-4 w-full font-[Monument] text-[40px] font-extrabold leading-[40px] md:text-4xl'}>
						{'MAKING CRYPTO SIMPLER'}
					</h1>
					<p className={'mb-10 mt-6 w-11/12 text-lg text-neutral-600'}>
						{
							'Smol adds super powers to your wallet, to make your crypto journey faster, simpler and maybe even a little bit sexier.'
						}
					</p>

					<Link
						href={'/wallet'}
						className={'hidden max-w-min whitespace-nowrap'}>
						<Button className={'!h-14 !px-8 text-base !font-bold leading-6 text-neutral-900 md:!px-12'}>
							{'Launch App'}
						</Button>
					</Link>
				</div>
				<div className={'mt-6 size-[300px] min-w-[300px] md:mt-0'}>
					<RiveComponent />
				</div>
			</div>

			<div
				className={
					'mb-3 grid grid-cols-1 place-content-center gap-y-6 md:grid-cols-2 md:items-center md:gap-x-6 lg:grid-cols-3'
				}>
				<Cutaway
					title={
						<span className={'font-[Monument] font-extrabold'}>
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
						<span className={'font-[Monument] font-extrabold'}>
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
						<span className={'font-[Monument] font-extrabold'}>
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
						<span className={'font-[Monument] font-extrabold'}>
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
						<span className={'font-[Monument] font-extrabold'}>
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
						<span className={'font-[Monument] font-extrabold'}>
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
