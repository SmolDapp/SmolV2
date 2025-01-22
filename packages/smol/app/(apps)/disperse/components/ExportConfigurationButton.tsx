import {IconImport} from '@lib/icons/IconImport';
import {Button} from '@lib/primitives/Button';
import {cl} from '@lib/utils/helpers';
import {PLAUSIBLE_EVENTS} from '@lib/utils/plausible';
import {usePlausible} from 'next-plausible';
import Papa from 'papaparse';
import React, {useCallback} from 'react';

import {useDisperse} from 'packages/smol/app/(apps)/disperse/contexts/useDisperse';

import type {ComponentPropsWithoutRef, ReactElement} from 'react';

export function ExportConfigurationButton({
	className,
	title = 'Export Configuration'
}: ComponentPropsWithoutRef<'button'>): ReactElement {
	const {configuration} = useDisperse();
	const plausible = usePlausible();

	const downloadConfiguration = useCallback(async () => {
		plausible(PLAUSIBLE_EVENTS.DISPERSE_DOWNLOAD_CONFIG);
		const receiverEntries = configuration.inputs
			.map(input => ({
				receiverAddress: input.receiver.address,
				value: input.value.normalizedBigAmount.normalized.toString()
			}))
			.filter(entry => entry.value && entry.receiverAddress);

		const csv = Papa.unparse(receiverEntries, {header: true});
		const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'});
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		const name = `smol-disperse-${new Date().toISOString().split('T')[0]}.csv`;
		a.setAttribute('hidden', '');
		a.setAttribute('href', url);
		a.setAttribute('download', name);
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}, [configuration.inputs, plausible]);

	return (
		<Button
			onClick={downloadConfiguration}
			className={cl(className)}>
			<IconImport className={'mr-2 size-3 rotate-180 text-neutral-900'} />
			{title}
		</Button>
	);
}
