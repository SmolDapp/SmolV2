'use client';

import {useUpdateEffect} from '@react-hookz/web';
import Image from 'next/image';
import {useState} from 'react';

import type {ImageProps} from 'next/image';
import type {CSSProperties, ReactElement} from 'react';

function ImageWithFallback(props: ImageProps & {altSrc?: string}): ReactElement {
	const {alt, src, altSrc, ...rest} = props;
	const [imageSrc, setImageSrc] = useState(altSrc ? src : `${src}?fallback=true`);
	const [imageStyle, setImageStyle] = useState<CSSProperties>({});

	useUpdateEffect((): void => {
		setImageSrc(altSrc ? src : `${src}?fallback=true`);
		setImageStyle({});
	}, [src]);

	return (
		<Image
			alt={alt}
			src={imageSrc}
			loading={'eager'}
			className={'animate-fadeIn'}
			style={{
				minWidth: props.width,
				minHeight: props.height,
				maxWidth: props.width,
				maxHeight: props.height,
				...imageStyle
			}}
			onError={(): void => {
				if (altSrc && imageSrc !== `${altSrc}?fallback=true`) {
					setImageSrc(`${altSrc}?fallback=true`);
					return;
				}
				setImageSrc('/placeholder.png');
				setImageStyle({filter: 'opacity(0.2)'});
			}}
			{...rest}
		/>
	);
}

export {ImageWithFallback};
