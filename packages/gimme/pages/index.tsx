import React from 'react';

import type {ReactElement} from 'react';

function Home(): ReactElement {
	return (
		<section className={'mx-auto grid w-full max-w-6xl'}>
			<h1>{'Hello'}</h1>
		</section>
	);
}

export default function Wrapper(): ReactElement {
	return <Home />;
}
