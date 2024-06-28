import type {ReactElement} from 'react';

export const Cutaway = ({title, description}: {title: ReactElement; description: string}): ReactElement => {
	return (
		<div className={'flex min-h-52 max-w-96 flex-col rounded-2xl bg-neutral-200 px-6 py-8'}>
			<div className={'mb-3 text-2xl font-extrabold leading-[24px] text-neutral-900'}>{title}</div>
			<div className={'text-base text-neutral-700'}>{description}</div>
		</div>
	);
};
