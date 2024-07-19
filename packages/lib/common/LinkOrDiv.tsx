import Link from 'next/link';

import type {ReactElement, ReactNode} from 'react';

type TProps = {
	href: string;
	isDisabled?: boolean;
	children?: ReactNode;
	passHref?: boolean;
	className?: string;
	target?: string;
	onClick?: () => void;
};

export function LinkOrDiv({href, isDisabled, children, passHref, onClick, ...rest}: TProps): ReactElement {
	if (isDisabled) {
		return (
			<button
				className={'w-full'}
				disabled={isDisabled}
				{...rest}>
				{children}
			</button>
		);
	}

	if (!href) {
		return (
			<button
				className={'w-full'}
				onClick={onClick}
				{...rest}>
				{children}
			</button>
		);
	}

	return (
		<Link
			href={href}
			passHref={passHref}
			onClick={onClick}
			{...rest}>
			{children}
		</Link>
	);
}
