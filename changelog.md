# Changelog

## [Unreleased]

### Added

- Added comprehensive JSDoc-style comments to ERC20 types and constants in `packages/lib/utils/tools.erc20.ts`
    - Improved code documentation for TERC20Token type
    - Added detailed comments for TERC20TokenList interface
    - Documented TERC20TokensWithBalance and TChainERC20Tokens types
    - Added explanatory comments for DEFAULT_ERC20 constant
    - Enhanced documentation for ALTERNATE_ERC20_APPROVE_ABI with detailed explanation
    - Added comprehensive documentation for TApproveERC20 type and approveERC20 function with examples
- Added comprehensive documentation to number utilities in `packages/lib/utils/numbers.ts`
    - Added detailed type documentation for TNumberish and TNormalizedBN
    - Added function documentation with examples for all number conversion utilities
    - Enhanced documentation for BigNumber normalization functions
    - Added comprehensive examples for number formatting functions
    - Added detailed documentation for amount formatting types and functions
    - Enhanced documentation for currency and locale-specific formatting utilities
    - Added examples for TAmount formatting and validation functions
    - Added detailed documentation for formatCounterValue with examples
    - Added comprehensive documentation for parseAmount with locale examples
    - Added detailed documentation for percentOf with precision calculation examples
- Added comprehensive documentation to address utilities in `packages/lib/utils/tools.addresses.ts`
    - Added detailed type documentation for all address types (TAddress, TAddressSmol, etc.)
    - Added comprehensive documentation for address validation functions
    - Enhanced documentation for address conversion and formatting utilities
    - Added detailed examples for ENS resolution and smart contract detection
    - Added documentation for address safety and validation functions
    - Enhanced documentation for Gnosis Safe detection and bytecode retrieval
- Added comprehensive documentation to Disperse context in `packages/smol/app/(apps)/disperse/contexts/useDisperse.tsx`
    - Added detailed documentation for DisperseContext and its provider
    - Enhanced documentation for token initialization and URL parameter handling
    - Added comprehensive examples for context usage
    - Documented state management and reset functionality
    - Added detailed comments for effect hooks and memoization

// ... existing code ...
