import { LIQUID_TOKEN, LIQUID_TOKEN_UPPERCASE, DEBT_TOKEN_SHORT, VESTING_TOKEN } from 'app/client_config';

// TODO add comments and explanations
// TODO change name to formatCoinTypes?
// TODO make use of DEBT_TICKER etc defined in config/clietn_config
export function formatCoins(string) {
	// return null or undefined if string is not provided
	if(!string) return string
	// TODO use .to:owerCase() ? for string normalisation
	string = string.replace('SBD', DEBT_TOKEN_SHORT ).replace('SD', DEBT_TOKEN_SHORT)
		  		   .replace('Steem Power', VESTING_TOKEN).replace('STEEM POWER', VESTING_TOKEN)
		    	   .replace('Steem', LIQUID_TOKEN).replace('STEEM', LIQUID_TOKEN_UPPERCASE)
	return string
}
