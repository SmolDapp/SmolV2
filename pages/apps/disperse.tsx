import React, {Fragment} from 'react';
import {DefaultSeo} from 'next-seo';
import Disperse from 'components/sections/Disperse/index';
import {DisperseContextApp} from 'components/sections/Disperse/useDisperse';
import {DisperseQueryManagement} from 'components/sections/Disperse/useDisperseQuery';
import {BalancesCurtainContextApp} from 'contexts/useBalancesCurtain';

import type {ReactElement} from 'react';

function DispersePage(): ReactElement {
	return (
		<DisperseContextApp>
			{({configuration}) => (
				<DisperseQueryManagement>
					<BalancesCurtainContextApp
						selectedTokenAddresses={
							configuration.tokenToSend?.address ? [configuration.tokenToSend?.address] : []
						}>
						<Disperse />
					</BalancesCurtainContextApp>
				</DisperseQueryManagement>
			)}
		</DisperseContextApp>
	);
}

DispersePage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return (
		<Fragment>
			<DefaultSeo
				title={'Disperse - SmolDapp'}
				defaultTitle={'Disperse - SmolDapp'}
				description={'Distribute ether or tokens to multiple addresses'}
				openGraph={{
					type: 'website',
					locale: 'en-US',
					url: 'https://disperse.smold.app',
					site_name: 'Disperse - SmolDapp',
					title: 'Disperse - SmolDapp',
					description: 'Distribute ether or tokens to multiple addresses',
					images: [
						{
							url: 'https://smold.app/og_disperse.png',
							width: 800,
							height: 400,
							alt: 'disperse'
						}
					]
				}}
				twitter={{
					handle: '@smoldapp',
					site: '@smoldapp',
					cardType: 'summary_large_image'
				}}
			/>
			{page}
		</Fragment>
	);
};

DispersePage.AppName = 'Disperse';
DispersePage.AppDescription = 'Transfer funds to multiple receivers';
DispersePage.AppInfo = (
	<>
		<p>{'The OG disperse app with a fancy UI facelift.'}</p>
		<br />
		<p>
			{
				'Whether you’re sharing project funds between contributors, or just sending tokens to more than one address. '
			}
			{'Disperse lets you do it all in one transaction.'}
		</p>
		<br />
		<p>
			{
				'With the time you saved you could start writing a novel or open a vegan bakery? If it’s the latter, send '
			}
			{'cakes blz.'}
		</p>
		<br />
	</>
);
DispersePage.getLayout = function getLayout(page: ReactElement): ReactElement {
	return <Fragment>{page}</Fragment>;
};

export default DispersePage;
