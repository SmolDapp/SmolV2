import type {TAddress} from '@lib/utils/tools.addresses';

/**************************************************************************************************
 ** The TAddressBookEntry type definition is used in the AddressBook component and define the
 ** different properties that are used to represent an address book entry.
 ** The properties are:
 ** - id?: number - Unique ID of the entry
 ** - address: TAddress | undefined - Address of the entry. Can be undefined if the entry is not
 **   yet saved.
 ** - label: string - Name the user gave to the address. Default to a truncated version of the
 **   address.
 ** - chains: number[] - List of chains on which the address is valid. Dynamically updated when
 **   the user interacts.
 ** - slugifiedLabel: string - Slugified version of the label. Used for searching.
 ** - ens?: string - ENS name of the address. Not saved in the database.
 ** - isFavorite?: boolean - Indicates if the address is a favorite.
 ** - isHidden?: boolean - Indicates if the address is hidden from the address book.
 ** - numberOfInteractions?: number - Number of times the address has been used for a action via
 **   Smol.
 ** - tags?: string[] - List of tags associated with the address.
 *************************************************************************************************/
export type TAddressBookEntry = {
	id?: number;
	address: TAddress | undefined;
	label: string;
	chains: number[];
	slugifiedLabel: string;
	ens?: string;
	isFavorite?: boolean;
	isHidden?: boolean;
	numberOfInteractions?: number;
	tags?: string[];
};

/**************************************************************************************************
 ** TODO: Add description
 *************************************************************************************************/
export type TCurtainStatus = {isOpen: boolean; isEditing: boolean; label?: string};

/**************************************************************************************************
 ** TODO: Add description
 *************************************************************************************************/
export type TSelectCallback = (item: TAddressBookEntry) => void;

/**************************************************************************************************
 ** TODO: Add description
 *************************************************************************************************/
export type TAddressBookEntryReducer =
	| {type: 'SET_SELECTED_ENTRY'; payload: TAddressBookEntry}
	| {type: 'SET_ADDRESS'; payload: TAddress | undefined}
	| {type: 'SET_LABEL'; payload: string}
	| {type: 'SET_CHAINS'; payload: number[]}
	| {type: 'SET_IS_FAVORITE'; payload: boolean};

/**************************************************************************************************
 ** TODO: Add description
 *************************************************************************************************/
export type TAddressBookProps = {
	shouldOpenCurtain: boolean;
	selectedEntry: TAddressBookEntry | undefined;
	curtainStatus: TCurtainStatus;
	listEntries: () => Promise<TAddressBookEntry[]>;
	listCachedEntries: () => TAddressBookEntry[];
	getEntry: (props: {address?: TAddress; label?: string}) => Promise<TAddressBookEntry | undefined>;
	getCachedEntry: (props: {address?: TAddress; label?: string}) => TAddressBookEntry | undefined;
	addEntry: (entry: TAddressBookEntry) => Promise<void>;
	updateEntry: (entry: TAddressBookEntry) => Promise<void>;
	bumpEntryInteractions: (entry: TAddressBookEntry) => Promise<void>;
	deleteEntry: (address: TAddress) => Promise<void>;
	onOpenCurtain: (callbackFn: TSelectCallback) => void;
	onCloseCurtain: () => void;
	dispatchConfiguration: React.Dispatch<TAddressBookEntryReducer>;
	setCurtainStatus: React.Dispatch<React.SetStateAction<TCurtainStatus>>;
};
