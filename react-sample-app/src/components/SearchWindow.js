import React, { Component } from 'react';
import Header from "./Header";
import Loader from "./Loader";
import FriendList from "./FriendList";
import { connect } from 'react-redux';
import { LANGUAGE_PHRASES } from "../constants";

class SearchWindow extends Component {

	constructor(props) {
    super(props);
    this.searchLimit = 10;
    this.friendsLimit = 20;
    this.timeout = null;
    this.friends = this.props.friends;
    this.users = this.props.users;
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    // If friends are already loaded
    if(this.props.friends.length || this.props.users.length) {
      return;
    }

    // Get friends of login user
    this.props.chAdapter.getFriends(null, this.friendsLimit, null, null, null, (err, friends) => {
      if(err) return console.error(err);

      this.friends = friends;
      this.props.loadFriends(friends);
    });

    // Get other users
    this.props.chAdapter.getAllUsers(null, this.searchLimit, 0, null, null, (err, users) => {
      if(err) return console.error(err);

      this.users = users;
      this.props.loadUsers(users);
    });
  }

  handleChange(event) {
    let inputValue = event.target.value;

    // Clear the previous timeout
    clearTimeout(this.timeout);

    // Make a new timeout set to go off in 1000ms (1 second)
    this.timeout = setTimeout(() => {
      // Search the member
      this.searchMember(inputValue);
    }, 1000);
  }

  searchMember(value) {
    if(!value) {
      this.props.loadFriends(this.friends);
      this.props.loadUsers(this.users);
      return;
    }

    // Search in all friends by API call
    this.props.chAdapter.getFriends(value, this.friendsLimit, null, null, null, (err, friends) => {
      if(err) return console.error(err);

      this.props.loadFriends(friends);
    });

    // Search in all users by API call
    this.props.chAdapter.getAllUsers(value, this.searchLimit, 0, null, null, (err, users) => {
      if(err) return console.error(err);

      this.props.loadUsers(users);
    });
  }

  clearSearch() {
    // clear the search input
    document.getElementById("ch_search_input_box").value = "";
    this.props.loadFriends(this.friends);
    this.props.loadUsers(this.users);
  }

  render() {
    let headerImg = <i id="ch_search_close_btn" className="material-icons ch-close-btn" onClick={() => this.props.closeWindow(this.friends, this.users)}>arrow_back</i>    
    let suggested;
    let moreUsers;

    if(this.props.friends.length) {
      suggested = <div id="ch_suggested" className="ch-suggested">{LANGUAGE_PHRASES.SUGGESTED}</div>
    }
    if(this.props.users.length) {
      moreUsers = <div id="ch_more_users" className="ch-more-users">{LANGUAGE_PHRASES.MORE_USERS}</div>
    }
  	return (
      <div id="ch_search_window" className="ch-search-window">
        <Header headerImg={headerImg} title={LANGUAGE_PHRASES.SEARCH} />
        <div id="ch_search_box" className="ch-search-box">
          <input id="ch_search_input_box" className="ch-search-input-box" onChange={this.handleChange} />
          <i id="ch_clear_search_icon" className="material-icons ch-clear-search-icon" onClick={() =>this.clearSearch()}>close</i>
        </div>
        <div id="ch_friends_box" className="ch-friends-box">
          {(!this.props.friends.length && !this.props.users.length) && <Loader />}
          <div id="ch_suggested_box">
            {suggested}
            {this.props.friends.map((friend) => <FriendList key={friend.id} friend={friend} chAdapter={this.props.chAdapter} /> )}
          </div>
          <div id="ch_users_box">
            {moreUsers}
            {this.props.users.map((user) => <FriendList key={user.id} friend={user} chAdapter={this.props.chAdapter} /> )}
          </div>
        </div>
      </div>
		);
  }
}

const mapStateToProps = (state) => {
  return {...state}
}

const mapDispatchToProps = (dispatch) => {
	return {
    loadFriends: (friends) => { dispatch({type: "LOAD_FRIENDS", friends: friends})},
    loadUsers: (users) => { dispatch({type: "LOAD_USERS", users: users})},
    closeWindow: (friends, users) => { dispatch({type: "CLOSE_WINDOW", isSearchWindowOpen: false, friends: friends, users: users})}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchWindow)