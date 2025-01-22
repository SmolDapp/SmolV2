import {serializeSearchStateForUrl} from '@lib/utils/url/serializeStateForUrl';
import {usePathname, useRouter} from 'next/navigation';

import {useDeepCompareEffect} from '@smolHooks/useDeepCompare';

export function useSyncUrlParams(state: Record<string, unknown>, disabled?: boolean): void {
	const router = useRouter();
	const pathname = usePathname();

	useDeepCompareEffect(() => {
		if (!disabled) {
			router.replace(`${pathname}?${serializeSearchStateForUrl(state)}`, {
				scroll: false
			});
		}
	}, [state, disabled]);
}
