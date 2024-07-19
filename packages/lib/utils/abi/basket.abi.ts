const BASKET_ABI = [
	{
		inputs: [
			{
				internalType: 'address',
				name: '_uniswapV2Router',
				type: 'address'
			},
			{
				internalType: 'address',
				name: '_sushiV2Router',
				type: 'address'
			},
			{
				internalType: 'address',
				name: '_uniswapV3Router',
				type: 'address'
			},
			{
				internalType: 'address',
				name: '_velodromeRouter',
				type: 'address'
			},
			{
				internalType: 'address',
				name: '_weth',
				type: 'address'
			},
			{
				internalType: 'address',
				name: '_feeRecipient',
				type: 'address'
			}
		],
		stateMutability: 'nonpayable',
		type: 'constructor'
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: true,
				internalType: 'address',
				name: 'user',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'tokenIn',
				type: 'address'
			},
			{
				indexed: true,
				internalType: 'address',
				name: 'tokenOut',
				type: 'address'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amountIn',
				type: 'uint256'
			},
			{
				indexed: false,
				internalType: 'uint256',
				name: 'amountOut',
				type: 'uint256'
			},
			{
				indexed: false,
				internalType: 'enum MultiSwapRouter.DEX',
				name: 'dex',
				type: 'uint8'
			}
		],
		name: 'Swap',
		type: 'event'
	},
	{
		inputs: [],
		name: 'FEE_DENOMINATOR',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'MAX_FEE_PERCENTAGE',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'WETH',
		outputs: [
			{
				internalType: 'contract IWETH',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'feePercentage',
		outputs: [
			{
				internalType: 'uint256',
				name: '',
				type: 'uint256'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'feeRecipient',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				components: [
					{
						internalType: 'address',
						name: 'tokenIn',
						type: 'address'
					},
					{
						internalType: 'address',
						name: 'tokenOut',
						type: 'address'
					},
					{
						internalType: 'address',
						name: 'recipient',
						type: 'address'
					},
					{
						internalType: 'uint256',
						name: 'amountIn',
						type: 'uint256'
					},
					{
						internalType: 'uint256',
						name: 'amountOutMin',
						type: 'uint256'
					},
					{
						internalType: 'enum MultiSwapRouter.DEX',
						name: 'dex',
						type: 'uint8'
					},
					{
						internalType: 'uint24',
						name: 'fee',
						type: 'uint24'
					},
					{
						internalType: 'uint160',
						name: 'sqrtPriceLimitX96',
						type: 'uint160'
					},
					{
						internalType: 'bool',
						name: 'stable',
						type: 'bool'
					},
					{
						internalType: 'address',
						name: 'factory',
						type: 'address'
					}
				],
				internalType: 'struct MultiSwapRouter.SwapParams[]',
				name: 'params',
				type: 'tuple[]'
			}
		],
		name: 'multicall',
		outputs: [],
		stateMutability: 'payable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'owner',
		outputs: [
			{
				internalType: 'address',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'uint256',
				name: '_feePercentage',
				type: 'uint256'
			}
		],
		name: 'setFeePercentage',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: '_feeRecipient',
				type: 'address'
			}
		],
		name: 'setFeeRecipient',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'sushiV2Router',
		outputs: [
			{
				internalType: 'contract IUniswapV2Router02',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [
			{
				internalType: 'address',
				name: 'newOwner',
				type: 'address'
			}
		],
		name: 'transferOwnership',
		outputs: [],
		stateMutability: 'nonpayable',
		type: 'function'
	},
	{
		inputs: [],
		name: 'uniswapV2Router',
		outputs: [
			{
				internalType: 'contract IUniswapV2Router02',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'uniswapV3Router',
		outputs: [
			{
				internalType: 'contract IV3SwapRouter',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		inputs: [],
		name: 'velodromeRouter',
		outputs: [
			{
				internalType: 'contract IVelodromeRouter',
				name: '',
				type: 'address'
			}
		],
		stateMutability: 'view',
		type: 'function'
	},
	{
		stateMutability: 'payable',
		type: 'receive'
	}
] as const;

export default BASKET_ABI;
