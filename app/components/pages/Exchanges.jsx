import React from 'react';
import tt from 'counterpart'

import { blogsUrl } from 'app/utils/blogsUtils'
import Icon from 'app/components/elements/Icon'

class Exchanges extends React.Component {
    render() {
        return (
            <div className='landing-exchanges'>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.title')}</h2>
                        <h3><Icon name="golos" size="2x" /> Golos Blockchain (GLS)</h3>
                    </div>
                    <br />
                    <div className='row'>                            
                            <a target="_blank" href="/market/GOLOS/YMUSDT" className="golos-btn btn-secondary btn-round"><Icon name="trade" /> Golos Market</a>&nbsp;<a target="_blank" href="/convert/GOLOS/YMUSDT" className="golos-btn btn-secondary btn-round"><Icon name="sorting" /> Golos Convert</a>&nbsp;<a target="_blank" href="https://coinmarketcap.com/currencies/golos-blockchain/" className="golos-btn btn-secondary btn-round"><Icon name="extlink" /> CoinMarketCap</a>&nbsp;<a target="_blank" href="https://explorer.golos.id/" className="golos-btn btn-secondary btn-round"><Icon name="cog" /> Block Explorer</a>&nbsp;<a href="mailto:info@golos.id" className="golos-btn btn-secondary btn-round"><Icon name="new/envelope" /> Contact Us</a>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://rudex.org/"><img src={require("app/assets/images/exchanges/rudex.png")} width="275" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <span className='new'>new</span> <Icon name="line" /> <a target="_blank" href={blogsUrl('/ru--golos/@lllll1ll/vsyo-prosto-rubl-usdt-rudex-golos')}>{tt('exchanges_jsx.guide_user')} @lllll1ll</a> <small>(подробно и по шагам)</small> <Icon name='extlink' /><br />
                                    <Icon name="line" /> <a target="_blank" href={blogsUrl('/@allforyou/golos-delistyat-s-kuny-perekhodim-na-rudex')}>{tt('exchanges_jsx.guide_user')} @allforyou</a> <Icon name='extlink' /><br />
                                    <Icon name="line" /> <a target="_blank" href="https://www.youtube.com/results?search_query=%D0%B1%D0%B8%D1%80%D0%B6%D0%B0+rudex&sp=CAI%253D">Пользовательские видеообзоры биржи</a> <Icon name='extlink' />
                                    <br /><br />
                                    <a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.USDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTC" className="button">GOLOS-BTC</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTS" className="button">GOLOS-BTS</a>
                                    <br />
                                    <a target="_blank" href={blogsUrl('/@alex-pu/dexbot-na-vps-v-dokere-dlya-babushek')}>Настройка</a> и <a target="_blank" href={blogsUrl('/@alex-pu/dexbot-best-long-term-strategy')}>стратегии</a> торгового бота DEXbot, <a target="_blank" href="https://github.com/golos-blockchain/libs/wiki">примеры</a> операций <small>(JavaScript/Python)</small>.
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://dex.golos.app/#/trade/GOLOS_YMUSDT"><img src={require("app/assets/images/exchanges/golosdex.png")} width="285" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <Icon name="line" /> <a target="_blank" href={blogsUrl('/@gloriya/obzor-servisov-dex-c-shlyuzami-usdt-ltc-trx-dash-doge-rub')}>{tt('exchanges_jsx.guide_user')} @gloriya</a> <Icon name='extlink' /><br />
                                    <Icon name="line" /> <a target="_blank" href={blogsUrl('/@allforyou/torguem-na-vnutrennei-birzhe-golosa')}>{tt('exchanges_jsx.guide_user')} @allforyou</a> <Icon name='extlink' />
                                    <br /><br />
                                    <a target="_blank" href="/market/GOLOS/YMUSDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="/market/GOLOS/YMPZM" className="button">GOLOS-PZM</a>&nbsp;&nbsp;<a target="_blank" href="/market/GOLOS/YMHIVE" className="button">GOLOS-HIVE</a>
                                    <p><a target="_blank" href="/market/GOLOS/YMUSDT">Биржа</a> или <a target="_blank" href="/convert/GOLOS/YMUSDT">обменник</a>, на которых возможно торговать токенами GOLOS через<br/> альтернативные шлюзы к <small><a target="_blank" href={blogsUrl('/@ecurrex-ru/anons-novye-shlyuzy-tron-trx-i-usdt-trc-20')}>USDT, TRON</a>, <a target="_blank" href={blogsUrl('/@ecurrex-ru/prizm-na-golose')}>PRIZM</a>, <a target="_blank" href={blogsUrl('/@ecurrex-ru/anons-shlyuzov-dlya-hive-i-steem')}>HIVE, STEEM</a></small> эмитента <a href="/@ecurrex-ru">@ecurrex-ru</a> 
                                    <br /><small>и другим популярным активам...</small></p>
                                    <span className='new'>скоро</span> Настройка и стратегии торгового бота DEXbot, <a target="_blank" href="https://github.com/golos-blockchain/libs/wiki">примеры</a> операций <small>(JavaScript/Python)</small>.
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div>
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <a target="_blank" href="https://console.minter.network/ru"><img src={require("app/assets/images/exchanges/minter.png")} width="210" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <Icon name="line" /> <a target="_blank" href={blogsUrl('/@docsait/manual-raboty-pulov-goloschain-v-seti-minter')}>{tt('exchanges_jsx.guide_user')} @docsait</a> <Icon name='extlink' /><br />
                                    <Icon name="line" /> <a target="_blank" href={blogsUrl('/@denis-skripnik/glsmp')}>{tt('exchanges_jsx.guide_user')} @denis-skripnik</a> <Icon name='extlink' />
                                    <br /><br />
                                    <a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BNB" className="button">GOLOS-BNB</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/USDTE" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BIP" className="button">GOLOS-BIP</a>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div> 
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <div className='row'>
                                <div className='column large-12 medium-12 small-12' align='center'>
                                <p className='landing-exchanges-block-text reg landing-exchanges-block-center'>А также покупка/продажа токенов через:</p>
                                <p><span className='new'>new</span> <Icon name="line" /> Объявления в телеграм-чате <a target="_blank" href="https://t.me/golostrading"><Icon name="new/telegram" /> GolosTrading</a> для OTC-сделок (<a target="_blank" href={blogsUrl('/@lindsay/gde-vzyat-tokeny-golos-prostomu-yuzeru')}>подробнее <Icon name="extlink" /></a>)</p>
                                <p><Icon name="line" /> Обмен через <a target="_blank" href="https://steem-engine.net/?p=market&t=GOLOSP">Steem Engine</a>, инструкция доступна <a target="_blank" href={blogsUrl('/@allforyou/zavodim-i-vyvodim-golosa-s-birzhi-steem-engine')}>здесь</a> <Icon name="extlink" /></p>
                                </div>
                            </div>
                        </div>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                    </div>
                </div> 
                <div className='landing-exchanges-block'>
                    <div className='column large-12 medium-12 small-12'>
                        <h2>{tt('exchanges_jsx.questions')}?</h2>
                        <div className='column large-12 medium-12 small-12'>
                            <hr/>
                        </div>
                        <div className='row'>
                            <div className='column large-12 medium-12 small-12'>
                                <p className='landing-exchanges-block-text landing-exchanges-block-center'>
                                    {tt('exchanges_jsx.community_chat')} <a target="_blank" href='https://t.me/golos_id'>t.me/golos_id</a>, {tt('exchanges_jsx.delegate_chat')} <a target="_blank" href='https://t.me/golos_delegates'>t.me/golos_delegates</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

module.exports = {
    path: 'exchanges',
    component: Exchanges,
};