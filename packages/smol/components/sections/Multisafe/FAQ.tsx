import {type ReactElement} from 'react';
import Link from 'next/link';
import {usePlausible} from 'next-plausible';
import * as Dialog from '@radix-ui/react-dialog';
import {CloseCurtainButton} from '@lib/common/Curtains/InfoCurtain';
import {CurtainContent} from '@lib/primitives/Curtain';

const FAQ = [
	{
		question: 'What is MultiSafe?',
		answer: 'MultiSafe is an application developed by Smol that allows users to create and deploy multi-signature wallets across multiple blockchain networks using a single address.'
	},
	{
		question: 'How do I create a Safe?',
		answer: 'To create a Safe, you need to select the owners, define the threshold, and customize with a prefix or suffix. Once these details are set, you can generate your Safe.'
	},
	{
		question: 'How do I deploy a newly created Safe?',
		answer: 'After creating a Safe, select the networks where you want your Safe to be deployed. This ensures your assets are protected across multiple blockchains.'
	},
	{
		question: 'How do I clone an existing Safe?',
		answer: 'Enter the address of an existing Safe to clone it onto another network. This duplicates your Safe’s security and functionality seamlessly.'
	},
	{
		question: 'How do I deploy a cloned Safe?',
		answer: 'You just need to click a button, nothing more. The original configuration, including the owners and threshold from when the Safe was first created, will be kept.'
	},
	{
		question: "Why can't I deploy a Safe on zkSync?",
		answer: "Deploying on zkSync is not supported due to the network's specific features. We tried, but as of now, it's not possible."
	},
	{
		question: 'Why is my Safe not clonable?',
		answer: 'Your Safe might not be clonable if it is not compatible with the cloning mechanism used by MultiSafe. The best way to have a clonable Safe is to use Multisafe from the start!'
	}
];

/**************************************************************************************************
 ** The TMultisafeSAQCurtain type is used to type the props of the MultisafeFAQCurtain component.
 *************************************************************************************************/
export type TMultisafeSAQCurtain = {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
};

/**************************************************************************************************
 ** The MultisafeFAQCurtain component is responsible for displaying the curtain with the list of
 ** frequently asked questions about MultiSafe.
 *************************************************************************************************/
export function MultisafeFAQCurtain(props: TMultisafeSAQCurtain): ReactElement {
	const plausible = usePlausible();

	return (
		<Dialog.Root
			open={props.isOpen}
			onOpenChange={props.onOpenChange}>
			<CurtainContent>
				<aside
					style={{boxShadow: '-8px 0px 20px 0px rgba(36, 40, 51, 0.08)'}}
					className={'bg-neutral-0 flex h-full flex-col overflow-y-hidden p-6'}>
					<div className={'mb-4 flex flex-row items-center justify-between'}>
						<h3 className={'font-bold'}>{'FAQ'}</h3>
						<CloseCurtainButton />
					</div>
					<div className={'flex h-full flex-col gap-4'}>
						<div className={'scrollable text-neutral-600'}>
							<p className={'text-sm'}>
								{
									'Find answers to common questions about MultiSafe below. If you need further assistance, ping us on X at '
								}
								<Link
									className={'underline'}
									onClick={() => plausible('Contact Us')}
									href={'https://x.com/smoldapp'}
									passHref>
									{'@smoldapp'}
								</Link>
								{'.'}
							</p>
						</div>
						<div className={'my-1 h-px w-full bg-neutral-300'} />
						<div className={'scrollable mb-8 mt-0 flex flex-col items-center gap-2 pb-2'}>
							{FAQ.map(({question, answer}) => (
								<div
									key={question}
									className={'w-full'}>
									<div className={'pb-2 pl-1'}>
										<p className={'text-sm text-neutral-900'}>{question}</p>
										<p className={'text-xs text-neutral-600'}>{answer}</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</aside>
			</CurtainContent>
		</Dialog.Root>
	);
}
