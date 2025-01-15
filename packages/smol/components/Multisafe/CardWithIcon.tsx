import {cloneElement} from 'react';
import {cl} from '@builtbymom/web3/utils';

import type {ReactElement} from 'react';

type TCardWithIcon = {
	isSelected?: boolean;
	onClick?: () => void;
	label: string;
	description?: string;
	icon: ReactElement;
};

export default function CardWithIcon({onClick, label, icon, description}: TCardWithIcon): ReactElement {
	return (
		<button
			className={cl('hover box-0 !border-neutral-400/60 group relative flex w-full justify-center p-4 md:p-6')}
			onClick={onClick}>
			<div className={'relative flex w-full flex-col gap-2'}>
				<div className={'flex w-full items-center gap-2 md:items-start md:gap-4'}>
					<div>{cloneElement(icon, {className: 'size-4 md:size-5 text-neutral-700'})}</div>
					<div className={'text-left md:-mt-1'}>
						<b className={'text-sm md:text-base'}>{label}</b>
						<p className={'hidden text-sm text-neutral-600 md:block'}>{description}</p>
					</div>
				</div>
				<p className={'block text-left text-sm text-neutral-600 md:hidden'}>{description}</p>
			</div>
		</button>
	);
}
