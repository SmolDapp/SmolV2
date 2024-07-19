import type {ReactElement} from 'react';

export function LicenseInfo(): ReactElement {
	return (
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
	);
}
