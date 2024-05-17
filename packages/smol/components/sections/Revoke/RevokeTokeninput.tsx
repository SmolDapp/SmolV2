import {type ReactElement, useState} from 'react';
import {cl, isAddress} from '@builtbymom/web3/utils';
import {Button} from '@lib/primitives/Button';

import {useAllowances} from './useAllowances';

export const RevokeTokeninput = (): ReactElement => {
	const [isTouched, set_isTouched] = useState<boolean>(false);
	const {configuration, dispatchConfiguration, fetchTokenToSearch, isDoneWithInitialFetch, isLoading} =
		useAllowances();
	const isFetching = isLoading || !isDoneWithInitialFetch;
	return (
		<div className={'flex max-w-96 items-center'}>
			<label>
				<input
					className={cl(
						'w-full border-neutral-400 rounded-lg bg-transparent py-3 px-4 text-base',
						'text-neutral-900 placeholder:text-neutral-600 caret-neutral-700',
						'focus:placeholder:text-neutral-300 placeholder:transition-colors',
						'focus:border-neutral-400 disabled:cursor-not-allowed disabled:opacity-40',
						isTouched && !isAddress(configuration.tokenToCheck) && configuration.tokenToCheck
							? 'border-red'
							: ''
					)}
					type={'text'}
					onFocus={() => set_isTouched(true)}
					placeholder={'Token to check 0x...'}
					autoComplete={'off'}
					autoCorrect={'off'}
					spellCheck={'false'}
					value={configuration.tokenToCheck}
					disabled={isFetching}
					// onChange={e => set_searchValue(e.target.value)}
					onChange={e => dispatchConfiguration({type: 'SET_TOKEN_TO_CHECK', payload: e.target.value})}
				/>
			</label>

			<Button
				onClick={fetchTokenToSearch}
				disabled={!isAddress(configuration.tokenToCheck)}
				className={'ml-4 !h-8 font-bold'}>
				<p className={'text-xs font-bold leading-6'}>{'Check'}</p>
			</Button>
		</div>
	);
};
