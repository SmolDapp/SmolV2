import React from 'react';

import type {ReactElement} from 'react';

function LogoLooksRare(props: React.SVGProps<SVGSVGElement>): ReactElement {
	return (
		<svg
			{...props}
			width={'96'}
			height={'96'}
			viewBox={'0 0 96 96'}
			fill={'none'}
			xmlns={'http://www.w3.org/2000/svg'}>
			<circle
				cx={'48'}
				cy={'48'}
				r={'48'}
				fill={'#0CE466'}
			/>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={
					'M48 53.1888C42.5092 53.1888 38.054 48.738 38.054 43.2428C38.054 37.7476 42.5092 33.2969 48 33.2969C53.4907 33.2969 57.9459 37.7476 57.9459 43.2428C57.9459 48.738 53.4907 53.1888 48 53.1888ZM43.6756 43.2428C43.6756 45.632 45.6127 47.5671 48 47.5671C50.3872 47.5671 52.3243 45.632 52.3243 43.2428C52.3243 40.8536 50.3872 38.9185 48 38.9185C45.6127 38.9185 43.6756 40.8536 43.6756 43.2428Z'
				}
				fill={'black'}
			/>
			<path
				fillRule={'evenodd'}
				clipRule={'evenodd'}
				d={
					'M16 43.256L35.027 24.2158H60.9729L79.9999 43.256L48 75.2428L16 43.256ZM62.7026 36.3238C54.6182 28.2039 41.3817 28.2039 33.2973 36.3239L26.3784 43.2429L33.2973 50.1618C41.3817 58.2817 54.6182 58.2817 62.7026 50.1618L69.6215 43.2429L62.7026 36.3238Z'
				}
				fill={'black'}
			/>
		</svg>
	);
}

export default LogoLooksRare;
