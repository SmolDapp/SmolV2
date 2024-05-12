import {cloneElement} from 'react';
import {cl} from '@builtbymom/web3/utils';
import {IconCircleCheck} from '@lib/icons/IconCircleCheck';

import type {ReactElement} from 'react';

export type TCardWithIcon = {
	isSelected?: boolean;
	onClick?: () => void;
	label: string;
	description?: string;
	icon: ReactElement;
};

export default function CardWithIcon({onClick, label, icon, description}: TCardWithIcon): ReactElement {
	return (
		<button
			className={cl('hover box-0 group relative flex w-full justify-center p-4 md:p-6')}
			onClick={onClick}>
			<div className={'relative flex w-full gap-4'}>
				<div>{cloneElement(icon, {className: 'size-5 text-neutral-700'})}</div>
				<div className={'-mt-1 text-left'}>
					<b className={'text-sm md:text-base'}>{label}</b>
					<p className={'text-sm text-neutral-600'}>{description}</p>
				</div>
			</div>
		</button>
	);
}

export function SmallCardWithIcon({isSelected, onClick, label, icon}: TCardWithIcon): ReactElement {
	return (
		<button
			className={cl(
				'hover box-0 group relative flex w-full items-center justify-center p-2 md:p-4',
				isSelected ? '!bg-primary-50' : ''
			)}
			onClick={onClick}>
			<div className={'relative flex w-full flex-col items-center justify-center'}>
				<div
					suppressHydrationWarning
					className={`border-primary-200 group-hover:bg-primary-0 mb-2 flex size-6 items-center justify-center rounded-full border transition-colors md:size-8 ${
						isSelected ? 'bg-primary-0' : ''
					}`}>
					{cloneElement(icon, {className: 'h-2 md:h-4 w-2 md:w-4 text-primary-900'})}
				</div>
				<b
					suppressHydrationWarning
					className={'text-sm'}>
					{label}
				</b>
			</div>
			<IconCircleCheck
				className={`absolute right-4 top-4 size-4 text-[#16a34a] transition-opacity ${
					isSelected ? 'opacity-100' : 'opacity-0'
				}`}
			/>
		</button>
	);
}
