import type {ReactElement} from 'react';

export function LicenseInfo(): ReactElement {
	return (
		<div className={'flex grid-cols-11 flex-col place-items-end items-center justify-center gap-8 p-4 md:grid'}>
			<div
				className={
					'md:text-grey-700 text-grey-800 text-xxs w-full place-content-center text-center md:col-span-7 md:col-start-3 lg:col-span-7 lg:col-start-3'
				}>
				{
					'The gimme.mom web-based user interface is provided as a tool for users to interact with third party DeFi protocols on their own initiative, without any endorsement or recommendation of cryptoasset trading activities. In doing so, Gimme.Mom is not recommending that users or potential users engage in cryptoasset trading activity, and users or potential users of the web-based user interface should not regard this website or its contents as involving any form of recommendation, invitation or inductement to deal in cryptoassets.'
				}
			</div>
			<b className={'text-grey-800 -mt-4 block text-center text-xs md:hidden'}>
				{`©${new Date().getFullYear()} Built by MOM`}
			</b>
			<div
				className={
					'bg-primary bottom-4 right-4 col-start-11 hidden size-fit justify-self-end whitespace-nowrap rounded-[32px] px-3 py-2 align-bottom md:flex'
				}>
				<b className={'text-xs text-neutral-900'}>{`©${new Date().getFullYear()} Built by MOM`}</b>
			</div>
		</div>
	);
}
