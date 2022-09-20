export const routeRegex = {
    UserProfile1: /^\/(@[\w\.\d-]+)\/?$/,
    UserProfile2: /^\/(@[\w\.\d-]+)\/(transfers|assets|create-asset|invites|curation-rewards|author-rewards|donates-from|donates-to|filled-orders|permissions|created|password|witness)\/??(?:&?[^=&]*=[^=&]*)*$/,
    UserProfile3: /^\/(@[\w\.\d-]+)\/[\w\.\d-]+/,
    UserAssetEndPoints: /^\/(@[\w\.\d-]+)\/assets\/([\w\d.-]+)\/(update|transfer)$/,
    UserEndPoints: /^(transfers|assets|create-asset|invites|curation-rewards|author-rewards|donates-from|donates-to|filled-orders|permissions|created|password|witness)$/,
    WorkerSort: /^\/workers\/([\w\d\-]+)\/?($|\?)/,
    WorkerSearchByAuthor: /^\/workers\/([\w\d\-]+)\/(\@[\w\d.-]+)\/?($|\?)/,
    WorkerRequest: /^\/workers\/([\w\d\-]+)\/(\@[\w\d.-]+)\/([\w\d-]+)\/?($|\?)/,
    MarketPair: /^\/market\/([\w\d\.]+)\/([\w\d.]+)\/?($|\?)/,
    UserJson: /^\/(@[\w\.\d-]+)(\.json)$/,
    UserNameJson: /^.*(?=(\.json))/
};

export default function resolveRoute(path)
{
    if (path === '/' || path === '/login') {
        return {page: 'Login'}
    }
    if (path.indexOf("@bm-chara728") !== -1) {
        return {page: 'NotFound'};
    }
    if (path === '/exchanges'){
        return {page: 'Exchanges'}
    }
    if (path === '/xss/test' && process.env.NODE_ENV === 'development') {
        return {page: 'XSSTest'};
    }
    if (path === '/change_password') {
        return {page: 'ChangePassword'};
    }
    if (path === '/market') {
        return {page: 'Market'};
    }
    let match = path.match(routeRegex.MarketPair);
    if (match) {
        return {page: 'Market', params: match.slice(1)};
    }
    if (path === '/~witnesses') {
        return {page: 'Witnesses'};
    }
    if (path === '/workers') {
        return {page: 'Workers'};
    }
    if (process.env.IS_APP) {
        if (path === '/__app_goto_url') {
            return {page: 'AppGotoURL'};
        }
        if (path === '/__app_splash') {
            return {page: 'AppSplash'};
        }
        if (path === '/__app_settings') {
            return {page: 'AppSettings'};
        }
        if (path === '/__app_update') {
            return {page: 'AppUpdate'};
        }
    }
    if (path === '/nodes') {
        return {page: 'Nodes'};
    }
    if (path === '/leave_page') {
        return {page: 'LeavePage'};
    }
    match = path.match(routeRegex.WorkerRequest)
        || path.match(routeRegex.WorkerSearchByAuthor)
        || path.match(routeRegex.WorkerSort);
    if (match) {
        return {page: 'Workers', params: match.slice(1)};
    }
    match = path.match(routeRegex.UserAssetEndPoints);
    if (match) {
        return {page: 'UserProfile', params: [match[1], 'assets', match[2], match[3]]};
    }
    match = path.match(routeRegex.UserProfile1) ||
        // @user/"posts" is deprecated in favor of "comments" as of oct-2016 (#443)
        path.match(routeRegex.UserProfile2);
    if (match) {
        return {page: 'UserProfile', params: match.slice(1)};
    }
    if (path === '/convert') { 
        return {page: 'ConvertAssetsLoader', params: []}
    }
    return {page: 'NotFound'};
}
