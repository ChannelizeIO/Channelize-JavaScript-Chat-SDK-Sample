import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { Provider } from 'react-redux';
import rootReducer from './reducers/reducers.js';
import './index.scss';
import App from './App';
import * as serviceWorker from './serviceWorker';


const store = createStore(rootReducer, applyMiddleware(thunk))

ReactDOM.render(
	<Provider store={store}>
    	<App publicKey="qHvonVEyIxDLa6zh" userId="20697" accessToken="wjHfgpS6avk6MmnMgEJLQBErALAGf0YekHcDGzR478rv0izwGdtemo2xSx8pN3fs"/>
	</Provider>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
