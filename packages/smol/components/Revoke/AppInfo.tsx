import type {ReactElement} from 'react';

function RevokeAppInfo(): ReactElement {
	return (
		<>
			<p>
				{
					"Revoke lets you see which contracts your wallet has given approvals to, and lets you 'revoke' access to any contracts at will."
				}
			</p>
			<br />
			<p>{'"Why would I use revoke?"'}</p>
			<br />
			<p>{'Maybe you granted access to a dodgy contract and want peace of mind?'}</p>
			<br />
			<p>{'Or perhaps you granted a contract permission to spend 10,000 of your tokens instead of 10. '}</p>
			<br />
			<p>
				{
					'Revoke gives you full transparency to see which contracts have the power to spend from your wallet, and the power to take back control with a simple click (but please note revoking a contract requires a transaction to be signed by your wallet).'
				}
			</p>
			<br />
			<p>
				{'Smol Revoke is using '}
				<a
					href={'https://github.com/RevokeCash/whois/'}
					className={'text-neutral-900 underline'}>
					{'whois'}
				</a>
				{' libraries by '}
				<a
					href={'https://revoke.cash/'}
					className={'text-neutral-900 underline'}>
					{'revoke.cash'}
				</a>
				{'. We stan.'}
			</p>
		</>
	);
}

export {RevokeAppInfo};
