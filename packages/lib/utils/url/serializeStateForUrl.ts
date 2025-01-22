/**
 * Converts a state object into a query params string that can be used in an URL.
 *
 * It is a generic helper.
 */
export function serializeSearchStateForUrl(state: Record<string, unknown>): string {
	const mappedStateEntries = Object.entries(state).map(([key, value]) => {
		if (!value) {
			return undefined;
		}

		if (Array.isArray(value)) {
			if (value.length === 0) {
				return undefined;
			}
			if (!['string', 'number', 'bigint', 'boolean'].includes(typeof value[0])) {
				return undefined;
			}
			return `${key}=${value.join(',')}`;
		}

		return `${key}=${value}`;
	});

	const filteredStateEntries = mappedStateEntries.filter(v => v !== null && v !== undefined);

	return encodeURI(filteredStateEntries.join('&'));
}
