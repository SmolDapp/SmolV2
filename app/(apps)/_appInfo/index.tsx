'use client';

import {usePathname} from 'next/navigation';
import {useCallback} from 'react';

import {InfoCurtain} from '@lib/components/Curtains/InfoCurtain';
import {IconQuestionMark} from '@lib/components/icons/IconQuestionMark';
import {cl} from '@lib/utils/helpers';
import {AddressBookAppInfo} from 'app/(apps)/_appInfo/AddressBookAppInfo';
import {DisperseAppInfo} from 'app/(apps)/_appInfo/DisperseAppInfo';
import {MultisafeAppInfo} from 'app/(apps)/_appInfo/MultisafeAppInfo';
import {RevokeAppInfo} from 'app/(apps)/_appInfo/RevokeAppInfo';
import {SendAppInfo} from 'app/(apps)/_appInfo/SendAppInfo';
import {SwapAppInfo} from 'app/(apps)/_appInfo/SwapAppInfo';
import {WalletAppInfo} from 'app/(apps)/_appInfo/WalletAppInfo';

import type {ReactElement} from 'react';

export default function AppInfoCurtain(): ReactElement {
	const pathName = usePathname();
	const getContent = useCallback(() => {
		if (pathName?.startsWith('/wallet') || pathName?.startsWith('/apps/wallet')) {
			return <WalletAppInfo />;
		}
		if (pathName?.startsWith('/address-book') || pathName?.startsWith('/apps/address-book')) {
			return <AddressBookAppInfo />;
		}
		if (pathName?.startsWith('/disperse') || pathName?.startsWith('/apps/disperse')) {
			return <DisperseAppInfo />;
		}
		if (pathName?.startsWith('/revoke') || pathName?.startsWith('/apps/revoke')) {
			return <RevokeAppInfo />;
		}
		if (pathName?.startsWith('/send') || pathName?.startsWith('/apps/send')) {
			return <SendAppInfo />;
		}
		if (pathName?.startsWith('/swap') || pathName?.startsWith('/apps/swap')) {
			return <SwapAppInfo />;
		}
		if (pathName?.startsWith('/multisafe') || pathName?.startsWith('/apps/multisafe')) {
			return <MultisafeAppInfo />;
		}

		return null;
	}, [pathName]);

	const content = getContent();

	if (!content) {
		return <div className={'flex w-full justify-end'} />;
	}

	return (
		<div className={'flex w-full justify-end'}>
			<InfoCurtain
				trigger={
					<div
						id={'info-curtain-trigger'}
						className={cl(
							'size-4 md:size-8 rounded-full absolute right-4 top-4',
							'bg-neutral-200 transition-colors hover:bg-neutral-300',
							'flex justify-center items-center'
						)}>
						<IconQuestionMark className={'size-6 text-neutral-600'} />
					</div>
				}
				info={content}
			/>
		</div>
	);
}
