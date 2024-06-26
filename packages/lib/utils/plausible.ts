export const PLAUSIBLE_EVENTS = {
	// Open the curtains
	OPEN_INFO_CURTAIN: 'open info curtain',
	OPEN_ADDRESS_SELECTOR_CURTAIN: 'open address selector curtain',
	OPEN_TOKEN_SELECTOR_CURTAIN: 'open token selector curtain',
	OPEN_AB_CURTAIN: 'open address book curtain',
	OPEN_SWAP_SETTINGS_CURTAIN: 'open swap settings curtain',
	OPEN_MULTISAFE_FAQ_CURTAIN: 'open multisafe FAQ curtain',

	// Address Book events
	AB_ADD_FIRST_CONTACT: 'ab: add 1st contact',
	AB_ADD_ENTRY: 'ab: add entry',
	AB_DELETE_ENTRY: 'ab: delete entry',
	AB_UPDATE_ENTRY: 'ab: update entry',
	AB_IMPORT_CONTACTS: 'ab: import contacts',

	// Send events
	SEND_TOKENS: 'send',
	ADD_TOKEN_OPTION: 'send: add token option',
	ADD_ALL_TOKENS_OPTIONS: 'send: add all tokens option',

	// Revoke events
	REVOKE_ALLOWANCE: 'revoke',

	// Disperse events
	DISPERSE_TOKENS: 'disperse',
	DISPERSE_IMPORT_CONFIG: 'disperse: import configuration',
	DISPERSE_DOWNLOAD_CONFIG: 'disperse: download configuration',
	DISPERSE_DOWNLOAD_TEMPLATE: 'disperse: download template',

	// Swap events
	SWAP_INVERSE_IN_OUT: 'swap: inverse in/out',
	SWAP_SET_RECIPIENT: 'swap: set recipient',
	SWAP_SET_FROM_NETWORK: 'swap: set from network',
	SWAP_SET_TO_NETWORK: 'swap: set to network',
	SWAP_CLICK_NETWORK_DROPDOWN: 'swap: click to network dropdown',
	SWAP_SET_ORDER: 'swap: set order',
	SWAP_SET_SLIPPAGE: 'swap: set slippage',
	SWAP_GET_QUOTE: 'swap: get quote',
	SWAP_EXECUTED: 'swap: executed',
	SWAP_CONFIRMED: 'swap: confirmed',
	SWAP_REVERTED: 'swap: reverted',

	// Navigation
	NAVIGATE_TO_DUMP_SERVICES: 'navigate: dump.services',
	NAVIGATE_TO_MULTISAFE: 'navigate: multisafe',
	NAVIGATE_TO_GITHUB: 'navigate: github',
	NAVIGATE_TO_TWITTER: 'navigate: twitter',

	//Tokenlists
	REMOVE_TOKEN_LIST: 'tokenLists: remove',
	ADD_TOKEN_LIST: 'tokenLists: add',

	// Multisafe events
	PREPARE_NEW_SAFE: 'multisafe: prepare new safe',
	PREPARE_CLONE_SAFE: 'multisafe: prepare clone safe',
	CREATE_NEW_SAFE: 'multisafe: create new safe',
	CREATE_CLONE_SAFE: 'multisafe: create clone safe'
};
