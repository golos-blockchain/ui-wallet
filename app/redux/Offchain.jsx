import user from 'app/redux/User';

const defaultState = { user: {} };

export default function reducer(state = defaultState, action) {
    if (action.type === user.actions.saveLoginConfirm.type) {
        if (!action.payload) {
            return { ...state, account: null };
        }
    }
    return state;
}
