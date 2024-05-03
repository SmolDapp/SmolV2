'use client';

import * as React from 'react';
import {Drawer as DrawerPrimitive} from 'vaul';
import {cl} from '@builtbymom/web3/utils';

const Drawer = ({
	shouldScaleBackground = true,
	...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>): React.ReactElement => (
	<DrawerPrimitive.Root
		shouldScaleBackground={shouldScaleBackground}
		{...props}
	/>
);
Drawer.displayName = 'Drawer';

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({className, ...props}, ref) => (
	<DrawerPrimitive.Overlay
		ref={ref}
		className={cl('fixed inset-0 z-50 bg-black/80', className)}
		{...props}
	/>
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({className, children, ...props}, ref) => (
	<DrawerPortal>
		<DrawerOverlay />
		<DrawerPrimitive.Content
			ref={ref}
			className={cl(
				'fixed inset-y-0 top-0 bottom-0 z-50 mr-24 w-[60vw] flex h-auto flex-col rounded-r-lg border-4',
				className
			)}
			{...props}>
			{children}
		</DrawerPrimitive.Content>
	</DrawerPortal>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
	<div
		className={cl('grid gap-1.5 p-4 text-center sm:text-left', className)}
		{...props}
	/>
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({className, ...props}: React.HTMLAttributes<HTMLDivElement>): React.ReactElement => (
	<div
		className={cl('mt-auto flex flex-col gap-2 p-4', className)}
		{...props}
	/>
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({className, ...props}, ref) => (
	<DrawerPrimitive.Title
		ref={ref}
		className={cl('text-lg font-semibold leading-none tracking-tight', className)}
		{...props}
	/>
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
	React.ElementRef<typeof DrawerPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({className, ...props}, ref) => (
	<DrawerPrimitive.Description
		ref={ref}
		className={cl('text-sm text-muted-foreground', className)}
		{...props}
	/>
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	DrawerPortal,
	DrawerTitle,
	DrawerTrigger
};
