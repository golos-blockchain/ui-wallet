import App from 'app/components/App';
import resolveRoute from './ResolveRoute';

export default {
    path: '/',
    component: App,
    getChildRoutes(nextState, cb) {
        const route = resolveRoute(nextState.location.pathname);
        if (route.page === 'Welcome') {
            cb(null, [
                {
                    path: 'welcome',
                    component: process.env.BROWSER
                        ? require('@pages/WelcomeLoader').default
                        : require('@pages/Welcome').default,
                },
            ]);
        } else if (route.page === 'Start') {
            cb(null, [require('@pages/Start')]);
        } else if (route.page === 'Exchanges') {
            cb(null, [require('@pages/Exchanges')]);
        } else if (route.page === 'Faq') {
            cb(null, [
                {
                    path: 'faq',
                    component: process.env.BROWSER
                        ? require('@pages/FaqLoader').default
                        : require('@pages/Faq').default,
                },
            ]);
        } else if (route.page === 'Login') {
            cb(null, [require('@pages/Login')]);
        } else if (route.page === 'ChangePassword') {
            cb(null, [require('@pages/ChangePasswordPage')]);
        } else if (route.page === 'Witnesses') {
            cb(null, [require('@pages/WitnessesLoader')]);
        } else if (route.page === 'Workers') {
            cb(null, [require('@pages/WorkersLoader')]);
        } else if (route.page === 'MinusedAccounts') {
            cb(null, [require('@pages/MinusedAccounts')]);
        } else if (route.page === 'AppGotoURL') {
            cb(null, [require('@pages/app/AppGotoURL')]);
        } else if (route.page === 'AppSplash') {
            cb(null, [require('@pages/app/AppSplash')]);
        } else if (route.page === 'AppSettings') {
            cb(null, [require('@pages/app/AppSettings')]);
        } else if (route.page === 'AppUpdate') {
            cb(null, [require('@pages/app/AppUpdate')]);
        } else if (route.page === 'Nodes') {
            cb(null, [require('@pages/NodesLoader')]);
        } else if (route.page === 'LeavePage') {
            cb(null, [require('@pages/LeavePage')]);
        } else if (route.page === 'Search') {
            cb(null, [require('@pages/Search')]);
        } else if (route.page === 'UserProfile') {
            cb(null, [require('@pages/UserProfile')]);
        } else if (route.page === 'ConvertAssetsLoader') {
            cb(null, [require('@pages/ConvertAssetsLoader')]);
        } else if (route.page === 'Market') {
            cb(null, [require('@pages/MarketLoader')]);
        } else {
            cb(process.env.BROWSER ? null : Error(404), [
                require('@pages/NotFound'),
            ]);
        }
    },
    //indexRoute: {
    //    component: PostsIndex.component,
    //},
};
