import Utility from "../utility.js";
import ConversationWindow from "./conversation-window.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants.js";

class Search {
	constructor(widget) {
		// Initialize dependencies
		this.chAdapter = widget.chAdapter;
		this.widget = widget;
		this.utility = new Utility();
		this.searchLimit = 10;
		this.friendsLimit = 20;
		this.friends = [];
		this.users = [];

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
		let searchHeader = this.utility.createElement("div", searchHeaderAttributes, LANGUAGE_PHRASES.SEARCH_MEMBERS, searchWindow);

		// Create search Close button
		let closeBtnAttributes = [{"id":"ch_search_close_btn"}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "arrow_back", searchHeader);
		closeBtn.classList.add("material-icons", "ch-close-btn");

		// Create search box
		let searchBoxAttributes = [{"id":"ch_search_box"},{"class":"ch-search-box"}];
		let searchBox = this.utility.createElement("div", searchBoxAttributes, null, searchWindow);

		// Create search input box
		let inputBoxAttributes = [{"id":"ch_search_input_box"},{"class":"ch-search-input-box"},{"placeholder":LANGUAGE_PHRASES.SEARCH}];
		this.utility.createElement("input", inputBoxAttributes, null, searchBox);

		// Create clear search icon
		let clearAttributes = [{"id":"ch_clear_search_icon"}];
		let clearBtn = this.utility.createElement("i", clearAttributes, "close", searchBox);
		clearBtn.classList.add("material-icons", "ch-clear-search-icon");

		// Create friends listing box
		let friendsBoxAttributes = [{"id":"ch_friends_box"},{"class":"ch-friends-box"}];
		let friendsBox = this.utility.createElement("div", friendsBoxAttributes, null, searchWindow);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_search_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, friendsBox);
		loaderContainer.style.display = "block";

		// Create loader
		let loaderAttributes = [{"id":"ch_search_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);

		// Create suggested friends listing box
		let suggestedBoxAttributes = [{"id":"ch_suggested_box"}];
		let suggestedBox = this.utility.createElement("div", suggestedBoxAttributes, null, friendsBox);

		// Create other users listing box
		let usersBoxAttributes = [{"id":"ch_users_box"}];
		let usersBox = this.utility.createElement("div", usersBoxAttributes, null, friendsBox);

		// Get user friends
		this.chAdapter.getFriends(null, this.friendsLimit, null, null, null, (err, friends) => {
			if(err) return console.error(err);

			// Hide loader
			if(document.getElementById("ch_search_loader_container"))
				document.getElementById("ch_search_loader_container").style.display = "none";

			if(friends.length) {
				// Create suggested element
				let suggestedAttributes = [{"id":"ch_suggested"},{"class":"ch-suggested"}];
				this.utility.createElement("div", suggestedAttributes, LANGUAGE_PHRASES.SUGGESTED, suggestedBox);
				this.friends = friends;

				friends.forEach(friend => {
					this._createFriendList(friend, "suggested");
				});
			}
		});

		// Get more users
		this.chAdapter.getAllUsers(null, this.searchLimit, 0, null, null, (err, users) => {
			if(err) return console.error(err);

			if(!users.length)
				return;

			// Create more users element
			let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
			let moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, usersBox);

			let moreUsersCount = 0;
			users.forEach(user => {
				if(!document.getElementById(user.id) && user.id != this.widget.userId) {
					this._createFriendList(user, "users");
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

	_createFriendList(friend, type) {
		// Create friends listing
		let parentId = (type == "suggested") ? "ch_suggested_box" : "ch_users_box";
		let parentBox = document.getElementById(parentId);

		let friendListAttributes = [{"id":friend.id},{"class":"ch-friends-list"}];
		let friendsBox = document.getElementById("ch_friends_box");
		let friendsList = this.utility.createElement("li", friendListAttributes, null, parentBox);

		// Add click listener on friend list
		friendsList.addEventListener("click", (data) => {
			if(document.getElementById("ch_conv_window")) {
				document.getElementById("ch_conv_window").remove();
				this.widget.convWindows.pop();
			}

			// Check for exist conversation
			this.chAdapter.getConversationsList(1, 0 , friend.id, "members", null, null, null, null, null, (err, conversation) => {
				if(err) return console.error(err);

				conversation = conversation[0];

				if(conversation) {
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
		// Remove old friends from list
		let suggestedbox = document.getElementById("ch_suggested_box");
		suggestedbox.innerHTML = "";

		let usersBox = document.getElementById("ch_users_box");
		usersBox.innerHTML = "";

		let localFriendsCount = 0;
		let localUersCount = 0;

		if(searchTerm == null) {
			// Show local friend
			this.friends.forEach(friend => {
				this._createFriendList(friend, "suggested");
			});

			// Show already loaded users
			this.users.forEach(user => {
				this._createFriendList(user, "users");
			});

			if(this.friends.length) {
				// Create suggested tag
				let suggestedAttributes = [{"id":"ch_suggested"},{"class":"ch-suggested"}];
				let suggested = this.utility.createElement("div", suggestedAttributes, LANGUAGE_PHRASES.SUGGESTED, suggestedbox);
				suggestedbox.insertBefore(suggested, suggestedbox.childNodes[0]);
			}

			if(this.users.length) {
				// Create more users element
				let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
				let moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, usersBox);
				moreUsers.style.display = "block";
				usersBox.insertBefore(moreUsers, usersBox.childNodes[0]);
			}
			return;
		}

		// Show loader
		if(document.getElementById("ch_search_loader_container"))
			document.getElementById("ch_search_loader_container").style.display = "block";

		// Search in all friends by API call
		this.chAdapter.getFriends(searchTerm, this.friendsLimit, null, null, null, (err, friends) => {
			if(err) return console.error(err);

			// Hide loader
			if(document.getElementById("ch_search_loader_container"))
				document.getElementById("ch_search_loader_container").style.display = "none";

			if(!friends.length)
				return;

			// Create friends element
			let suggested = document.getElementById("ch_suggested");
			if(!suggested) {
				let suggestedAttributes = [{"id":"ch_suggested"},{"class":"ch-suggested"}];
				suggested = this.utility.createElement("div", suggestedAttributes, LANGUAGE_PHRASES.SUGGESTED, usersBox);
			}

			// let suggestedCount = 0;
			friends.forEach(friend => {
				this._createFriendList(friend, "users");
			});
		});

		// Search in all users by API call
		this.chAdapter.getAllUsers(searchTerm, this.searchLimit, 0, null, null, (err, users) => {
			if(err) return console.error(err);

			if(!users.length)
				return;

			// Create more users element
			let moreUsers = document.getElementById("ch_more_users");
			if(!moreUsers) {
				let moreUsersAttributes = [{"id":"ch_more_users"},{"class":"ch-more-users"}];
				moreUsers = this.utility.createElement("div", moreUsersAttributes, LANGUAGE_PHRASES.MORE_USERS, usersBox);
			}

			let moreUsersCount = 0;
			users.forEach(user => {
				if(!document.getElementById(user.id) && user.id != this.widget.userId) {
					this._createFriendList(user, "users");
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
			this.searchMember(null);
		});
	}
}

export { Search as default };