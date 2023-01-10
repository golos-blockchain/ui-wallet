
const blogsAvailable = () => {
    return typeof($STM_Config) !== 'undefined'
        && $STM_Config.blogs_service && $STM_Config.blogs_service.host
}

export function blogsUrl(pathname = '') {
    try {
        return new URL(pathname, $STM_Config.blogs_service.host).toString()
    } catch (err) {
        console.error('blogsUrl', err)
        return ''
    }
}

export function blogsTarget() {
    if (process.env.IS_APP) {
        return '_blank'
    } 
    return undefined
}
