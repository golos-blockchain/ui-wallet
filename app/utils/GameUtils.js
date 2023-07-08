import tt from 'counterpart'
import { toAsset, vestsToSteem } from 'app/utils/StateFunctions'

const getImageUrl = (imgs ,smallIcon) => {
    let url = '/images/gamefication/' + imgs[smallIcon ? 0 : imgs.length - 1]
    //url = proxifyImageUrl(url, '48x48')
    return url
}

export function getGameLevel(account, gprops, smallIcon = false) {
    let levels = [
      {"power_from": 0.000, "imgs": ["1.png", "1big.png?v=2"],
        "title": ["Креветки", "Shrimp"]},
      {"power_from": 0.005, "imgs": ["2.png", "2big.png?v=2"],
        "title": ["Крабы", "Crabs"]},
      {"power_from": 0.010, "imgs": ["3.png", "3big.png?v=2"],
        "title": ["Осьминоги", "Octopuses"]},
      {"power_from": 0.025, "imgs": ["4.png", "4big.png?v=2"],
        "title": ["Рыбы", "Fish"]},
      {"power_from": 0.050, "imgs": ["5.png", "5big.png?v=2"],
        "title": ["Черепахи", "Turtles"]},
      {"power_from": 0.100, "imgs": ["6.png", "6big.png?v=2"],
        "title": ["Дельфины", "Dolphins"]},
      {"power_from": 0.250, "imgs": ["7.png", "7big.png?v=2"],
        "title": ["Акулы", "Sharks"]},
      {"power_from": 0.500, "imgs": ["8.png", "8big.png?v=2"],
        "title": ["Косатки", "Orca"]},
      {"power_from": 1.000, "imgs": ["9.png", "9big.png?v=2"],
        "title": ["Киты", "Whales"]},
      {"power_from": 5.000, "imgs": ["10.png", "10big.png?v=2"],
        "title": ["Повелители морей", "Lords of the Seas"]}
    ]
    let level = null
    let url = null
    let title = null
    let levelName = null
    let nextLevels = []
    try {
        let accountJS = account.toJS()
        let gpropsJS = gprops.toJS()

        const total = toAsset(gpropsJS.total_vesting_fund_steem).amount
        let vestingSteem = vestsToSteem(accountJS.vesting_shares, gpropsJS);
        vestingSteem = parseInt(vestingSteem)
        //const receivedSteem = vestsToSteem(accountJS.received_vesting_shares, gpropsJS);
        //const delegatedSteem = vestsToSteem(accountJS.delegated_vesting_shares, gpropsJS);
        //const effectiveSteem = parseInt(vestingSteem) + parseInt(receivedSteem) - parseInt(delegatedSteem);
        let pct = vestingSteem * 100 / total

        let nextLevel

        for (let i = levels.length - 1; i >= 0; --i) {
            if (pct >= levels[i].power_from) {
                level = levels[i]
                break
            }
            nextLevel = levels[i]
            const extraLevelData = { ...nextLevel }
            extraLevelData.golos_power_from = total * extraLevelData.power_from / 100
            extraLevelData.golos_power_diff = Math.max(1, extraLevelData.golos_power_from - vestingSteem + 1)
            extraLevelData.imageUrl = getImageUrl(extraLevelData.imgs, smallIcon)
            nextLevels.unshift(extraLevelData)
        }
        if (!level) {
            level = levels[0]
        }

        url = getImageUrl(level.imgs, smallIcon)

        const locale = tt.getLocale().startsWith('ru') ? 0 : 1

        levelName = level.title[locale]
        pct = pct.toFixed(2)
        if (pct === '0.00') {
            pct = '~0.0001'
        }
        title = tt('user_profile.game_level', {
            LEVEL: levelName,
            STAKE: pct,
            GP: vestingSteem,
        })

        if (nextLevel) {
            let nextName = nextLevel.title[locale]
            const nextGP = total * nextLevel.power_from / 100
            const diffGP = nextGP - vestingSteem
            title += tt('user_profile.next_game_level', {
                LEVEL: nextName,
                GP_DIFF: Math.floor(diffGP),
            })
        }
    } catch (err) {
        console.error('gamefication error:', err)
        url = null
    }
    if (url) {
        return {
            levelUrl: url,
            levelTitle: title,
            levelName,
            level,
            nextLevels
        }
    }
    return {}
}
