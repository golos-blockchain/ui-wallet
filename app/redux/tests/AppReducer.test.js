/*global describe, it, before, beforeEach, after, afterEach */
import chai, {expect} from 'chai';
import dirtyChai from 'dirty-chai';
import reducer from '../AppReducer';
chai.use(dirtyChai);

const defaultState = {
    requests: {},
    loading: false,
    error: '',
    location: {},
    notifications: null,
    ignoredLoadingRequestCount: 0,
    notificounters: {
        total: 0,
        feed: 0,
        reward: 0,
        send: 0,
        mention: 0,
        follow: 0,
        vote: 0,
        reply: 0,
        account_update: 0,
        message: 0,
        receive: 0,
        donate: 0
    }
};

const effectTriggered = {
    type: 'EFFECT_TRIGGERED',
    effectId: 1,
    effect: {
        CALL: true
    }
};

const effectResolved = {
    type: 'EFFECT_RESOLVED',
    effectId: '1'
};


describe('AppReducer', () => {
    it('should return default state', () => {
        expect(
            reducer(defaultState, {})
        ).to.equal(defaultState);
    });

    // FIXME: effect tests were disabled before the Toolkit migration.
});
