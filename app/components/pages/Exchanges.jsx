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
                                    <a target="_blank" href={blogsUrl('/@allforyou/golos-delistyat-s-kuny-perekhodim-na-rudex')}>{tt('exchanges_jsx.guide_user')}</a> <Icon name='extlink' />
                                    <br /><br />
                                    <a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.USDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTC" className="button">GOLOS-BTC</a>&nbsp;&nbsp;<a target="_blank" href="https://market.rudex.org/#/market/RUDEX.GOLOS_RUDEX.BTS" className="button">GOLOS-BTS</a>
                                    <br />
                                    <a target="_blank" href={blogsUrl('/@alex-pu/dexbot-na-vps-v-dokere-dlya-babushek')}>Настройка</a> и <a target="_blank" href={blogsUrl('/@alex-pu/dexbot-best-long-term-strategy')}>стратегии</a> по торговому боту DEXbot, <a target="_blank" href="https://github.com/golos-blockchain/libs/wiki">примеры</a> биржевых операций.
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
                                <a target="_blank" href="https://dex.golos.app"><img src={require("app/assets/images/exchanges/golosdex.png")} width="285" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href={blogsUrl('/@allforyou/torguem-na-vnutrennei-birzhe-golosa')}>{tt('exchanges_jsx.guide_user')}</a> <Icon name='extlink' />
                                    <br /><br />
                                    <p><a target="_blank" href="/market/GOLOS/YMUSDT">Биржа</a> или <a target="_blank" href="/convert/GOLOS/YMUSDT">обменник</a>, на которых возможно покупать/продавать токены GOLOS через<br/> альтернативные шлюзы, напр. к <small>USDT, TRON, DOGE, HIVE, STEEM</small> и другим активам...</p>
                                    <p><Icon name="line" /> <a target="_blank" href={blogsUrl('/@ecurrex-ru/anons-novye-shlyuzy-tron-trx-i-usdt-trc-20')}><small>YM</small>USDT</a> <small> TRC-20 (обмен и выход на популярные биржи)</small>, тема <a target="_blank" href="https://golostalk.com/services/@ecurrex-ru/ecurrex-tokeny-ymxxx">на форуме</a></p>
                                    <p><Icon name="line" /> <a target="_blank" href={blogsUrl('/@ecurrex-ru/prizm-na-golose')}><small>YM</small>PZM</a>, <a target="_blank" href={blogsUrl('/@ecurrex-ru/anons-novye-shlyuzy-tron-trx-i-usdt-trc-20')}><small>YM</small>TRX</a>, <a target="_blank" href={blogsUrl('/@ecurrex-ru/anons-shlyuzov-dlya-hive-i-steem')}><small>YM</small>HIVE и <small>YM</small>STEEM</a> от эмитента <a href="/@ecurrex-ru">@ecurrex-ru</a></p>
                                    <a target="_blank" href="/market/GOLOS/YMUSDT" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="/market/GOLOS/YMPZM" className="button">GOLOS-PZM</a>&nbsp;&nbsp;<a target="_blank" href="/market/GOLOS/YMHIVE" className="button">GOLOS-HIVE</a>
                                    <br />
                                    <p>Пользовательский опыт обмена: <a target="_blank" href={blogsUrl('/@gloriya/obzor-servisov-dex-c-shlyuzami-usdt-ltc-trx-dash-doge-rub')}>обзор от @gloriya</a></p>
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
                                <a target="_blank" href="https://www.minter.network/"><img src={require("app/assets/images/exchanges/minter.png")} width="210" /></a>
                                </div>
                                <div className='landing-exchanges-block-center column large-12 medium-12 small-12'>
                                    <a target="_blank" href={blogsUrl('/@denis-skripnik/glsmp')}>{tt('exchanges_jsx.guide_user')}</a> <Icon name='extlink' />
                                    <br /><br />
                                    <a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BNB" className="button">GOLOS-BNB</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/USDTBSC" className="button">GOLOS-USDT</a>&nbsp;&nbsp;<a target="_blank" href="https://chainik.io/pool/GOLOSCHAIN/BIP" className="button">GOLOS-BIP</a>
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
                                <p>- Объявления в телеграм-чате <a target="_blank" href="https://t.me/golostrading"><Icon name="new/telegram" /> GolosTrading</a> для OTC-сделок (<a target="_blank" href={blogsUrl('/@lindsay/gde-vzyat-tokeny-golos-prostomu-yuzeru')}>подробнее <Icon name="extlink" /></a>)</p>
                                <p>- Обмен с <a target="_blank" href="https://steem-engine.net/?p=market&t=GOLOSP">Steem Engine</a>, инструкция доступна <a target="_blank" href={blogsUrl('/@allforyou/zavodim-i-vyvodim-golosa-s-birzhi-steem-engine')}>здесь</a> <Icon name="extlink" /></p>
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