import {Fragment, type ReactElement, type ReactNode} from 'react';
import {useRouter} from 'next/router';
import {usePlausible} from 'next-plausible';
import * as Dialog from '@radix-ui/react-dialog';
import {useMountEffect} from '@react-hookz/web';
import {useIsMounted} from '@smolHooks/useIsMounted';
import {IconCross} from '@lib/icons/IconCross';
import {CurtainContent} from '@lib/primitives/Curtain';

export function CloseCurtainButton(): ReactElement {
	const plausible = usePlausible();
	const {route} = useRouter();

	useMountEffect(() => {
		plausible('open info curtain', {props: {curtainPage: route}});
	});

	return (
		<Dialog.Close className={'withRing group -mr-1 -mt-1 rounded p-1'}>
			<IconCross className={'size-4 text-neutral-600 transition-colors group-hover:text-neutral-900'} />
			<span className={'sr-only'}>{'Close'}</span>
		</Dialog.Close>
	);
}

type TCurtainElement = {
	trigger: ReactElement;
	info: ReactNode;
};
export function InfoCurtain(props: TCurtainElement): ReactElement {
	const isMounted = useIsMounted();
	if (!isMounted) {
		return <Fragment />;
	}

	return (
		<Dialog.Root>
			<Dialog.Trigger>{props.trigger}</Dialog.Trigger>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'Info'}</h3>
						<CloseCurtainButton />
					</div>
					<div className={'scrollable text-neutral-600'}>{props.info}</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
