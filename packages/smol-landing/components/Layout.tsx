import Link from 'next/link';
import {useState} from 'react';

import {Button} from 'packages/smol-landing/components/Button';

import {MobileNavBar} from './MobileNavBar';
import {NavBar} from './NavBar';

import type {NextComponentType} from 'next';
import type {AppProps} from 'next/app';
import type {NextRouter} from 'next/router';
import type {ReactElement, ReactNode} from 'react';

type TAppProps = {
	children: ReactNode;
};

function App(props: TAppProps): ReactElement {
	return <section className={'mt-16 flex w-full justify-center px-2'}>{props.children}</section>;
}

type TComponent = NextComponentType & {
	getLayout: (p: ReactElement, router: NextRouter) => ReactElement;
};

export default function Layout(props: AppProps): ReactElement {
	const {Component, router} = props;
	const getLayout = (Component as TComponent).getLayout || ((page: ReactElement): ReactElement => page);
	const [isNavBarOpen, setIsNavBarOpen] = useState<boolean>(false);

	return (
		<div className={'mx-auto mt-10 flex w-full max-w-6xl flex-col justify-center px-6 md:px-0'}>
			{isNavBarOpen && <MobileNavBar setIsNavBarOpen={setIsNavBarOpen} />}
			<div className={'grid grid-cols-2 px-2 md:grid-cols-3'}>
				<span className={'flex items-center font-[Monument] text-lg font-extrabold leading-snug md:text-2xl'}>
					{'MOM HUB'}
				</span>
				<div className={'hidden md:flex'}>
					<NavBar />
				</div>
				<div className={'flex justify-end md:hidden'}>
					<Button
						onClick={() => setIsNavBarOpen(true)}
						className={'!h-8 w-min justify-end py-1.5 !text-xs'}>
						{'Menu'}
					</Button>
				</div>
				<div className={'hidden w-full items-center justify-end md:flex'}>
					<Link
						href={'https://smold.app/'}
						className={
							'w-fit rounded-lg border px-4 py-2 text-xs font-bold transition-colors hover:bg-neutral-300'
						}>
						{'Launch App'}
					</Link>
				</div>
			</div>
			<App>{getLayout(<Component {...props} />, router)}</App>
		</div>
	);
}
