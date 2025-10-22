import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import { Link } from 'react-router';
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils';
import Reveal from 'react-foundation-components/lib/global/reveal';

import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import NFTSmallIcon from 'app/components/elements/nft/NFTSmallIcon'
import CreateNFTCollection from 'app/components/modules/nft/CreateNFTCollection'
import IssueNFTToken from 'app/components/modules/nft/IssueNFTToken'
import g from 'app/redux/GlobalReducer'
import user from 'app/redux/User'
import transaction from 'app/redux/Transaction'
import { getAssetMeta } from 'app/utils/market/utils'
import { withScreenSize } from 'app/utils/ScreenSize'

class NFTCollections extends Component {
    state = {}

    constructor() {
        super()
    }

    showCreate = (e) => {
        e.preventDefault()
        this.setState({
            showCreate: true,
        })
    }

    hideCreate = () => {
        this.setState({
            showCreate: false,
        })
    }

    showIssue = (e) => {
        e.preventDefault()
        this.setState({
            showIssue: true,
        })
    }

    hideIssue = () => {
        this.setState({
            showIssue: false,
        })
    }

    render() {
        const { account, isMyAccount, nft_collections, nft_assets, fetchState, isS } = this.props
        const accountName = account.get('name')

        const collections = nft_collections ? nft_collections.toJS() : null
        const assets = nft_assets ? nft_assets.toJS() : null

        let items
        if (!collections) {
            items = <LoadingIndicator type='circle' />
        } else if (!collections.length) {
            if (isMyAccount) {
                items = <span>{tt('nft_collections_jsx.not_yet')}</span>
            } else {
                items = <span>{tt('nft_collections_jsx.not_yet2') + accountName + tt('nft_collections_jsx.not_yet3')}</span>
            }
        } else {
            items = []
            let count = 0
            for (const collection of collections) {
                const { name, token_count, json_metadata, image, market_volume, last_buy_price } = collection

                let data
                if (json_metadata) {
                    data = JSON.parse(json_metadata)
                }
                data = data || {} // node allows to use '', null, object, or array

                const issueIt = (e) => {
                    e.preventDefault()
                    this.setState({
                        showIssue: true,
                        issueName: name,
                        issueNum: token_count + 1
                    })
                }

                const deleteIt = async (e) => {
                    e.preventDefault()

                    await this.props.deleteCollection(name, accountName, () => {
                        this.props.fetchState()
                    }, (err) => {
                        console.error(err)
                    })
                }

                const price = Asset(last_buy_price)
                const asset = assets[price.symbol]
                let imageUrl
                if (asset) {
                    imageUrl = getAssetMeta(asset).image_url
                }

                const collLink = <Link to={'/nft-collections/' + name} target='_blank' rel='noreferrer nofollow'>
                    {name}
                </Link>;

                let kebab
                if (isS && isMyAccount) {
                    const kebabItems = [
                        { link: '#', value: tt('nft_collections_jsx.issue_token'), onClick: issueIt},
                        { link: '#', value: tt('nft_collections_jsx.remove_it'), onClick: deleteIt},
                    ];

                    kebab = <td>
                        <DropdownMenu el='div' items={kebabItems}>
                            <Icon name='new/more' size='1_25x' />
                        </DropdownMenu>
                    </td>
                }

                items.push(<tr key={name} className={count % 2 == 0 ? '' : 'zebra'}>
                    <td title={data.title}>
                        <NFTSmallIcon image={image} />
                        {isS && <div>{collLink}</div>}
                    </td>
                    {!isS && <td title={data.title}>
                        {collLink}
                    </td>}
                    <td>
                        {tt('nft_tokens_jsx.token_count', { count: token_count })}
                        {(!isS && isMyAccount) ? <button className='button hollow small' onClick={issueIt}>
                            {tt('transfer_jsx.issue')}
                        </button> : null}
                    </td>
                    <td className='market-stats'>
                        <div title={tt('nft_collections_jsx.volume_hint')}>
                            {tt('rating_jsx.volume') + ' ' + parseFloat(market_volume).toFixed(3)}
                        </div>
                        <div title={tt('nft_collections_jsx.price_hint')}>
                            {imageUrl && <img className='price-icon' src={imageUrl} alt={''} />}
                            <span className='price-val'>{price.amountFloat}</span>
                        </div>
                    </td>
                    {(!isS && isMyAccount) ? <td>
                        <button disabled={!!token_count} title={token_count ? tt('nft_collections_jsx.tokens_exist') : null} className='button hollow small alert' onClick={deleteIt}>
                            {tt('g.delete')}
                        </button>
                    </td> : null}
                    {kebab}
                </tr>)

                ++count
            }

            items = <table><tbody>
                {items}
            </tbody></table>
        }

        const { showCreate, showIssue, issueName, issueNum } = this.state

        const marketLink = <Link to={`/nft`} className="button float-right">
            {tt('header_jsx.nft_market')}
        </Link>;
        const createBtn = isMyAccount && <a href='#' onClick={this.showCreate} className={'button hollow ' + (!isS && 'float-right')}>
            {tt('nft_collections_jsx.create')}
        </a>;

        return (<div className='NFTCollections'>
            <div className="row">
                <div className="column small-12">
                    <h4 className="Assets__header">{tt('g.nft_collections')}</h4>
                    {!isS && marketLink}
                    {!isS && createBtn}
                </div>
            </div>
            {isS && <div className="row">
                <div className="column small-12">
                    {createBtn}
                    {marketLink}
                </div>
            </div>}
            <br />
            <div className="row">
                <div className="column small-12">
                    {items}
                </div>
            </div>

            <Reveal show={showCreate} onHide={this.hideCreate} revealStyle={{ width: '450px' }}>
                <CreateNFTCollection
                    onClose={this.hideCreate}
                    fetchState={fetchState}
                />
            </Reveal>

            <Reveal show={showIssue} onHide={this.hideIssue} revealStyle={{ width: '450px' }}>
                <IssueNFTToken
                    onClose={this.hideIssue}
                    issueName={issueName}
                    issueNum={issueNum}
                    fetchState={fetchState}
                />
            </Reveal>
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        return {...ownProps,
            nft_collections: state.global.get('nft_collections'),
            nft_assets: state.global.get('nft_assets')
        }
    },
    dispatch => ({
        fetchState: () => {
            const pathname = window.location.pathname
            dispatch({type: 'FETCH_STATE', payload: {pathname}})
        },
        deleteCollection: (
            name, username, successCallback, errorCallback
        ) => {
            const operation = {
                creator: username,
                name,
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'nft_collection_delete',
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(withScreenSize(NFTCollections))
