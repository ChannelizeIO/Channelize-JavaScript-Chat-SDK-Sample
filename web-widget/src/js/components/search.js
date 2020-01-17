import Utility from "../utility.js";
import ConversationWindow from "./conversation-window.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants.js";

class Search {
	constructor(widget) {
		// Initialize dependencies
		this.chAdapter = widget.chAdapter;
		this.widget = widget;
		this.utility = new Utility();

		this.createSearchComponents();
		this._registerClickEventHandlers();
	}

	createSearchComponents() {
		// Create search box components
		let widget = document.getElementById("ch_frame");
		let searchWindowAttributes = [{"id": "ch_search_window"},{"class":"ch-search-window"}];
		let searchWindow = this.utility.createElement("div", searchWindowAttributes, null, widget);

		// Create search header
		let searchHeaderAttributes = [{"id":"ch_search_header"},{"class":"ch-header"}];
		let searchHeader = this.utility.createElement("div", searchHeaderAttributes, LANGUAGE_PHRASES.SEARCH, searchWindow);

		// Create search Close button
		let closeBtnAttributes = [{"id":"ch_search_close_btn"}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "arrow_back", searchHeader);
		closeBtn.classList.add("material-icons", "ch-close-btn");

		// Create search box
		let searchBoxAttributes = [{"id":"ch_search_box"},{"class":"ch-search-box"}];
		let searchBox = this.utility.createElement("div", searchBoxAttributes, null, searchWindow);

		// Create search input box
		let inputBoxAttributes = [{"id":"ch_search_input_box"},{"class":"ch-search-input-box"}];
		this.utility.createElement("input", inputBoxAttributes, null, searchBox);

		// Create clear search icon
		let clearAttributes = [{"id":"ch_clear_search_icon"}];
		let clearBtn = this.utility.createElement("i", clearAttributes, "close", searchBox);
		clearBtn.classList.add("material-icons", "ch-clear-search-icon");

		// Create friends listing box
		let friendsBoxAttributes = [{"id":"ch_friends_box"},{"class":"ch-friends-box"}];
		let friendsBox = this.utility.createElement("div", friendsBoxAttributes, null, searchWindow);

		// Get user friends
		this.chAdapter.getFriends((err, friends) => {
			if(err) return console.error(err);

			if(friends.length) {
				// Create suggested element
				let suggestedAttributes = [{"id":"ch_suggested"},{"class":"ch-suggested"}];
				this.utility.createElement("div", suggestedAttributes, LANGUAGE_PHRASES.SUGGESTED, friendsBox);
				this.friends = friends;

				friends.forEach(friend => {
					this._createFriendList(friend);
				});
			}
		});

		// Get more users
		this.chAdapter.getAllUsers(null, 10, 0, null, null, (err, users) => {
			if(err) return console.error(err);

			if(!users.length)
				return;

			// Create more users element
			let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
			let moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, friendsBox);

			let moreUsersCount = 0;
			users.forEach(user => {
				if(!document.getElementById(user.id) && user.id != this.widget.userId) {
					this._createFriendList(user);
					++moreUsersCount;
				}
			});

			if(moreUsersCount) {
				// Show more user header in other users found
				moreUsers.style.display = "block";
				this.users = users;
			}

		});
	}

	_createFriendList(friend) {
		// Create friends listing
		let friendListAttributes = [{"id":friend.id},{"class":"ch-friends-list"}];
		let friendsBox = document.getElementById("ch_friends_box");
		let friendsList = this.utility.createElement("li", friendListAttributes, null, friendsBox);

		// Add click listener on friend list
		friendsList.addEventListener("click", (data) => {
			if(document.getElementById("ch_conv_window")) {
				document.getElementById("ch_conv_window").remove();
				this.widget.convWindows.pop();
			}

			// Check for exist conversation
			this.chAdapter.getConversationsList(1, 0 , friend.id, (err, conversation) => {
				if(err) return console.error(err);

				if(conversation.id) {
					const conversationWindow = new ConversationWindow(this.widget);
					conversationWindow.init(conversation);
					this.widget.convWindows.push(conversationWindow);
				}
				else {
					// Open new conversation window
					const conversationWindow = new ConversationWindow(this.widget);
					conversationWindow.init(null, friend);
					this.widget.convWindows.push(conversationWindow);
				}
			});
		});

		// Create image tag
		friend.profileImageUrl = friend.profileImageUrl ? friend.profileImageUrl : IMAGES.AVTAR;
		let imageAttributes = [{"id":"ch_contact_img"},{"class":"ch-contact-img"},{"src":friend.profileImageUrl}];
		let contactImg = this.utility.createElement("img", imageAttributes, null, friendsList);

		// Create name div
		let nameAttributes = [{"id":"ch_friend_name"},{"class":"ch-friend-name"}];
		let contactName = this.utility.createElement("div", nameAttributes, friend.displayName, friendsList);
	}

	searchMember(searchTerm) {
		let friendsBox = document.getElementById("ch_friends_box");
		friendsBox.innerHTML = "";
		let localFriendsCount = 0;
		let localUersCount = 0;

		// Search in local friend
		this.friends.forEach(friend => {
			var pattern = new RegExp(searchTerm, "ig");
			let searchResults = friend.displayName.match(pattern);
			if(searchResults) {
				this._createFriendList(friend);
				++localFriendsCount;
			}
		});

		// Search in already loaded users
		this.users.forEach(user => {
			var pattern = new RegExp(searchTerm, "ig");
			let searchResults = user.displayName.match(pattern);
			if(searchResults) {
				this._createFriendList(user);
				++localUersCount;
			}
		});

		if(localFriendsCount) {
			// Create suggested tag
			let suggestedAttributes = [{"id":"ch_suggested"},{"class":"ch-suggested"}];
			let suggested = this.utility.createElement("div", suggestedAttributes, LANGUAGE_PHRASES.SUGGESTED, friendsBox);
			friendsBox.insertBefore(suggested, friendsBox.childNodes[0]);
		}

		if(localUersCount) {
			// Create more users element
			let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
			let moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, friendsBox);
			moreUsers.style.display = "block";
			friendsBox.insertBefore(moreUsers, document.getElementById(this.users[0].id));
		}

		if(!searchTerm)
			return;

		// Search in all users
		this.chAdapter.getAllUsers(searchTerm, 10, 0, null, null, (err, users) => {
			if(err) return console.error(err);

			if(!users.length)
				return;

			// Create more users element
			let moreUsers = document.getElementById("ch_more_users");
			if(!moreUsers) {
				let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
				moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, friendsBox);
			}

			let moreUsersCount = 0;
			users.forEach(user => {
				if(!document.getElementById(user.id) && user.id != this.widget.userId) {
					this._createFriendList(user);
					++moreUsersCount;
				}
			});

			if(moreUsersCount) {
				// Show more user header if other users found
				moreUsers.style.display = "block";
			}
		});
	}

	_registerClickEventHandlers() {
		// Close search button listener
		let closeBtn = document.getElementById("ch_search_close_btn");
		closeBtn.addEventListener("click", (data) => {
			document.getElementById("ch_search_window").remove();
		});

		// Search on input value
		let input = document.getElementById("ch_search_input_box");
		let timeout = null;
		input.addEventListener("keyup", (data) => {
			// Clear the previous timeout
			clearTimeout(timeout);

			// Make a new timeout set to go off in 1000ms (1 second)
		    timeout = setTimeout(() => {
		    	// Search the member
		    	this.searchMember(input.value);
		    }, 1000);
		});

		// Clear search input value
		let clear = document.getElementById("ch_clear_search_icon");
		clear.addEventListener("click", (data) => {
			document.getElementById("ch_search_input_box").value = "";
			this.searchMember();
		});
	}
}

export { Search as default };