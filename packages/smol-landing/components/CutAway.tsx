import Link from 'next/link';

import {Button} from 'packages/smol-landing/components/Button';

import type {ReactElement} from 'react';

type TCutaway = {
	title: ReactElement;
	description: string;
	link: string;
	buttonTitle: string;
	icon: ReactElement;
};

export const Cutaway = ({title, description, link, buttonTitle, icon}: TCutaway): ReactElement => {
	return (
		<div className={'flex flex-col justify-between rounded-2xl bg-neutral-200 px-6 py-8 md:h-full'}>
			<div className={'mb-6'}>
				<div className={'mb-3 text-2xl font-extrabold leading-[24px] text-neutral-900'}>{title}</div>
				<div className={'text-base text-neutral-700'}>{description}</div>
			</div>
			<Link href={link}>
				<Button className={'!h-10 w-full'}>
					<span className={'mr-2 text-sm'}>{buttonTitle}</span>
					{icon}
				</Button>
			</Link>
		</div>
	);
};
