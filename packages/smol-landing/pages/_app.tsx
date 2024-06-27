import Layout from '@smolLandingDesignSystem/Layout';
import {Meta} from '@lib/common/Meta';
import {WithFonts} from '@lib/common/WithFonts';

import type {AppProps} from 'next/app';
import type {ReactElement} from 'react';

import '../style.css';

function MyApp(props: AppProps): ReactElement {
	return (
		<WithFonts>
			<Meta
				title={'Smol Landing'}
				titleColor={''}
				themeColor={''}
				description={''}
				og={''}
				uri={''}
			/>
			<div className={'flex w-full flex-col justify-center'}>
				<main className={'relative mb-0 flex min-h-screen w-full flex-col'}>
					<Layout {...props} />
				</main>
			</div>
		</WithFonts>
	);
}
export default MyApp;
