/* eslint-disable @typescript-eslint/naming-convention */
import {isStrictEqual} from '@react-hookz/web';
import {isBrowser} from 'framer-motion';
import {useEffect, useMemo, useRef} from 'react';

import type {DependenciesComparator, EffectCallback, EffectHook} from '@react-hookz/web';
import type {DependencyList} from 'react';

const basicDepsComparator: DependenciesComparator = (d1, d2) => {
	if (d1 === d2) {
		return true;
	}

	if (d1.length !== d2.length) {
		return false;
	}

	for (const [i, element] of d1.entries()) {
		if (element !== d2[i]) {
			return false;
		}
	}

	return true;
};

/**
 * Like `useEffect` but uses provided comparator function to validate dependency changes.
 *
 * @param callback Function that will be passed to the underlying effect hook.
 * @param deps Dependency list like the one passed to `useEffect`.
 * @param comparator Function that compares two dependency arrays,
 * and returns `true` if they're equal.
 * @param effectHook Effect hook that will be used to run
 * `callback`. Must match the type signature of `useEffect`, meaning that the `callback` should be
 * placed as the first argument and the dependency list as second.
 * @param effectHookRestArgs Extra arguments that are passed to the `effectHook`
 * after the `callback` and the dependency list.
 */
// eslint-disable-next-line max-params
export function useCustomCompareEffect<
	Callback extends EffectCallback = EffectCallback,
	Deps extends DependencyList = DependencyList,
	HookRestArgs extends any[] = any[],
	R extends HookRestArgs = HookRestArgs
>(
	callback: Callback,
	deps: Deps,
	comparator: DependenciesComparator<Deps> = basicDepsComparator,
	effectHook: EffectHook<Callback, Deps, HookRestArgs> = useEffect,
	...effectHookRestArgs: R
): void {
	const dependencies = useRef<Deps>(undefined);

	// Effects are not run during SSR, therefore, it makes no sense to invoke the comparator
	if (dependencies.current === undefined || (isBrowser && !comparator(dependencies.current, deps))) {
		dependencies.current = deps;
	}

	effectHook(callback, dependencies.current, ...effectHookRestArgs);
}

/**
 * Like `useEffect`, but uses `@react-hookz/deep-equal` comparator function to validate deep
 * dependency changes.
 *
 * @param callback Function that will be passed to the underlying effect hook.
 * @param deps Dependency list like the one passed to `useEffect`.
 * @param effectHook Effect hook that will be used to run
 * `callback`. Must match the type signature of `useEffect`, meaning that the `callback` should be
 * placed as the first argument and the dependency list as second.
 * @param effectHookRestArgs Extra arguments that are passed to the `effectHook`
 * after the `callback` and the dependency list.
 */
export function useDeepCompareEffect<
	Callback extends EffectCallback = EffectCallback,
	Deps extends DependencyList = DependencyList,
	HookRestArgs extends any[] = any[],
	R extends HookRestArgs = HookRestArgs
>(
	callback: Callback,
	deps: Deps,
	effectHook: EffectHook<Callback, Deps, HookRestArgs> = useEffect,
	...effectHookRestArgs: R
): void {
	useCustomCompareEffect(callback, deps, isStrictEqual, effectHook, ...effectHookRestArgs);
}

/**
 * Like useMemo but uses provided comparator function to validate dependency changes.
 *
 * @param factory useMemo factory function
 * @param deps useMemo dependency list
 * @param comparator function to validate dependency changes
 * @returns useMemo result
 */
export const useCustomCompareMemo = <T, Deps extends DependencyList>(
	factory: () => T,
	deps: Deps,
	comparator: DependenciesComparator<Deps>
): T => {
	const dependencies = useRef<Deps>(undefined);

	if (dependencies.current === undefined || !comparator(dependencies.current, deps)) {
		dependencies.current = deps;
	}

	// eslint-disable-next-line react-hooks/exhaustive-deps
	return useMemo<T>(factory, dependencies.current);
};

/**
 * Like useMemo but validates dependency changes using deep equality check instead of reference check.
 *
 * @param factory Function calculating the value to be memoized.
 * @param deps The list of all reactive values referenced inside `factory`.
 * @returns Initially returns the result of calling `factory`. On subsequent renders, it will return
 * the same value, if dependencies haven't changed, or the result of calling `factory` again, if they have changed.
 */
export function useDeepCompareMemo<T, Deps extends DependencyList>(factory: () => T, deps: Deps): T {
	return useCustomCompareMemo(factory, deps, isStrictEqual);
}
