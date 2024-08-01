import type {ReactElement} from 'react';

function DisperseAppInfo(): ReactElement {
	return (
		<>
			<p>{'The OG disperse app with a fancy UI facelift.'}</p>
			<br />
			<p>
				{
					'Whether you’re sharing project funds between contributors, or just sending tokens to more than one address. '
				}
				{'Disperse lets you do it all in one transaction.'}
			</p>
			<br />
			<p>
				{
					'With the time you saved you could start writing a novel or open a vegan bakery? If it’s the latter, send '
				}
				{'cakes blz.'}
			</p>
			<br />
			<p>
				{
					'You can copy data from a spreadsheet or any other format. Ensure that each line contains one address and the corresponding amount in the chosen token. It can process virtually any format.'
				}
			</p>
		</>
	);
}

export {DisperseAppInfo};
