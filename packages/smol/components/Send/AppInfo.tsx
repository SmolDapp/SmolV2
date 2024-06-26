import type {ReactElement} from 'react';

function SendAppInfo(): ReactElement {
	return (
		<>
			<p>
				{
					'The send app lets you (yep, you guessed it) send your tokens through cyberspace to their destination. '
				}
			</p>
			<br />
			<p>
				{
					'Select one token or several, input the receiver address (or if you’re a chad, use the address book) and '
				}
				{'you’re good to go.'}
			</p>
			<br />
			<p>
				{
					'Make sure the chain selector in the sidebar is set to the chain you want to send the tokens on. Simple '
				}
				{'innit.'}
			</p>
		</>
	);
}

export {SendAppInfo};
