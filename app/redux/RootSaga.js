import { all, fork } from 'redux-saga/effects'
import { fetchDataWatches } from 'app/redux/FetchDataSaga';
import { marketWatches } from 'app/redux/MarketSaga';
import { sharedWatches } from 'app/redux/SagaShared';
import { userWatches } from 'app/redux/UserSaga';
import { authWatches } from 'app/redux/AuthSaga';
import { transactionWatches } from 'app/redux/TransactionSaga';

export default function* rootSaga() {
  yield fork(userWatches);
  yield fork(fetchDataWatches)
  yield fork(sharedWatches)
  yield fork(authWatches)
  yield fork(transactionWatches)
  yield fork(marketWatches)
}
