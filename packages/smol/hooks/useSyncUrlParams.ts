import {useRouter} from 'next/router';
import {getPathWithoutQueryParams} from 'lib/utils/url/getPathWithoutQueryParams';
import {serializeSearchStateForUrl} from 'lib/utils/url/serializeStateForUrl';
import {useDeepCompareEffect} from '@react-hookz/web';

export function useSyncUrlParams(state: {[key: string]: unknown}): void {
	const router = useRouter();

	useDeepCompareEffect(() => {
		router.replace(
			{
				pathname: getPathWithoutQueryParams(router.asPath),
				query: serializeSearchStateForUrl(state)
			},
			undefined,
			{
				scroll: false,
				shallow: true
			}
		);
	}, [state]);
}
