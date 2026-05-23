import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import ByteBuffer from 'bytebuffer';
import tt from 'counterpart';
import "./Nodes.scss";

const Long = ByteBuffer.Long;

class Nodes extends Component {
    static propTypes = {
        accounts: PropTypes.object.isRequired,
        witnesses: PropTypes.object.isRequired,
    };

    shouldComponentUpdate(np, ns) {
        return (
            np.accounts !== this.props.accounts ||
            np.witnesses !== this.props.witnesses
        );
    }

    render() {
        const sorted_witnesses = Object.values(this.props.witnesses).sort((a, b) =>
            Long.fromString(String(b.votes)).subtract(
                Long.fromString(String(a.votes)).toString()
            )
        );

        let api_nodes = [];
        let api_raw_nodes = [];
        let seed_nodes = [];
        let seed_raw_nodes = [];

        sorted_witnesses.forEach(item => {
            const owner = item.owner;
            const acc = this.props.accounts[owner];
            try {
              const metadata = JSON.parse(acc.json_metadata);
              if (metadata.witness) {
                let api_node = metadata.witness.api_node;
                let seed_node = metadata.witness.seed_node;
                if (api_node && api_node != '') {
                    api_raw_nodes.push(api_node);
                    api_nodes.push(<tr><td><img src="images/api.png" title={tt('witnesses_jsx.what_is_api')} /></td><td>{api_node}</td><td><b><Link to={'/~witnesses'}>{owner}</Link></b></td></tr>);
                }
                if (seed_node && seed_node != '') {
                    seed_raw_nodes.push(seed_node);
                    seed_nodes.push(<tr><td><img src="images/seed.png" title={tt('witnesses_jsx.what_is_seed')} /></td><td>{seed_node}</td><td><b><Link to={'/~witnesses'}>{owner}</Link></b></td></tr>);
                }
              }
            } catch(err) {
            }
        });

        return (
            <div>
                <h2>Список нод</h2>
                <table>
                <thead>
                    <th></th>
                    <th>Нода</th>
                    <th>Делегат</th>
                </thead>
                <tbody>
                <tr><td></td><td><span className="button no-margin-bottom" onClick={this.copyApiNodes}>Копировать API-ноды</span></td><td></td></tr>
                {api_nodes}
                <tr><td></td><td><span className="button no-margin-bottom" onClick={this.copySeedNodes}>Копировать SEED-ноды</span></td><td></td></tr>
                {seed_nodes}
                </tbody>
                </table>
                <textarea id="api_nodes" style={{opacity: 0}} value={api_raw_nodes.join('\n')}></textarea>
                <textarea id="seed_nodes" style={{opacity: 0}} value={seed_raw_nodes.join('\n')}></textarea>
            </div>
        );
    }

    copyApiNodes = () => {
        const api_nodes = document.getElementById('api_nodes');
        api_nodes.select();
        api_nodes.setSelectionRange(0, 99999);
        document.execCommand("copy");
    }

    copySeedNodes = () => {
        const seed_nodes = document.getElementById('seed_nodes');
        seed_nodes.select();
        seed_nodes.setSelectionRange(0, 99999);
        document.execCommand("copy");
    }
}

export default connect(
    state => {
        return {
            accounts: state.global.accounts,
            witnesses: state.global.witnesses,
        };
    },
    dispatch => {
        return {
        };
    }
)(Nodes);
