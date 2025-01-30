'use client';

import {useMemo} from 'react';
import {useAccount} from 'wagmi';

export function useIsSafe(): boolean {
	const {connector} = useAccount();

	function isInSafeIFrame(): boolean {
		if (typeof window === 'undefined') {
			return false;
		}
		if (
			window !== window.top ||
			window.top !== window.self ||
			(document?.location?.ancestorOrigins || []).length !== 0
		) {
			// check if https://app.safe.global is ancestor
			if (Array.from(document?.location?.ancestorOrigins || []).includes('https://app.safe.global')) {
				return true;
			}
			// check if https://app.safe.global is parent
			if (window.top?.location?.href?.includes('https://app.safe.global')) {
				return true;
			}

			// check if https://app.safe.global is self
			if (window.self?.location?.href?.includes('https://app.safe.global')) {
				return true;
			}

			return true;
		}
		return false;
	}

	const isUsingSafe = useMemo(() => {
		return connector?.id === 'safe' || (connector as any)?._wallets?.[0]?.id === 'safe' || false;
	}, [connector]);

	return isUsingSafe || isInSafeIFrame();
}
