import { MultiSession } from 'golos-lib-js/lib/auth';

const session = new MultiSession('wallet_session')

export const isLoginPage = () => window.location.pathname === '/login' || window.location.pathname === '/'

export default session
