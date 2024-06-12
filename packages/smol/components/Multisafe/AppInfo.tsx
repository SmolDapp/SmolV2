import Image from 'next/image';
import Link from 'next/link';

import type {ReactElement} from 'react';

const FAQ = [
	{
		question: 'Wtf is a Safe?',
		answer: 'Safe, is an open-source, non-custodial, and user-friendly platform designed to facilitate secure storage and management of digital assets. It’s particularly well-suited for individuals, teams, and organizations looking to establish multi-signature wallets to prevent unauthorized access and protect against potential security breaches. The platform ensures that your assets remain in your control at all times.'
	},
	{
		question: 'What is MultiSafe?',
		answer: 'MultiSafe is an application developed by Smol that allows users to create and deploy Safe smart contract wallets across multiple blockchain networks using a single address.'
	},
	{
		question: 'How do I create a Safe?',
		answer: 'To create a Safe, you need to select the owners and define the singing threshold (i.e how many wallets need to sign to approve a transaction).  Once these details are set, you can generate your Safe.'
	},
	{
		question: 'How do I deploy a newly created Safe?',
		answer: 'After generating a Safe, select the networks where you want your Safe to be deployed. This ensures your assets are protected across multiple blockchains. Please note, you will need funds in your wallet on the chain you’ll be deploying your safe on.'
	},
	{
		question: 'How do I clone an existing Safe?',
		answer: 'Enter the address of an existing Safe to clone it onto another network with the original address. Please note, when you clone an existing Safe onto a new chain, it will have the same signers as the ORIGINAL Safe deployment. Even if you’ve changed signers since.'
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

function MultisafeAppInfo(): ReactElement {
	return (
		<div>
			<div className={'my-4 overflow-hidden rounded-lg bg-neutral-200'}>
				<Image
					alt={''}
					src={'/safe.png'}
					width={1500}
					height={260}
					className={'rounded-lg'}
				/>
			</div>
			<div>
				<p className={'text-sm font-medium text-neutral-700'}>
					{'Multisafe is built on '}
					<Link
						href={'https://safe.global'}
						target={'_blank'}
						className={'text-[#00B460] underline'}>
						{'Safe protocol'}
					</Link>
					{' and Safe’s smart contracts to enable users to have the same Safe address on every chain.'}
				</p>
				<p className={'py-4 text-sm'}>
					{
						'Now you can enjoy the same security you know and love from Safe, but now with a consistent address on every chain.'
					}
				</p>
				<p className={'text-sm'}>
					{'Smol charges a smol fee of $4.20 per deployment, for more info - check out the FAQ below.'}
				</p>
			</div>
			<div className={'my-4 h-px w-full bg-neutral-300'} />
			<div className={'mb-8 flex flex-col items-center gap-2 pb-2'}>
				{FAQ.map(({question, answer}) => (
					<div
						key={question}
						className={'w-full'}>
						<div className={'pb-2'}>
							<p className={'text-sm font-medium text-neutral-700'}>{question}</p>
							<p className={'text-sm text-neutral-600'}>{answer}</p>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export {MultisafeAppInfo};
