'use client';

import {useEffect, useState} from 'react';

export const useIsMounted = (defaultValue: boolean = false): boolean => {
	const [isMounted, setIsMounted] = useState(defaultValue);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	return isMounted;
};
