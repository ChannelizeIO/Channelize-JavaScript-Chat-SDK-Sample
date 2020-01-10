import Utility from "../utility.js";
import ConversationWindow from "./conversation-window.js";
import Search from "./search.js";
import Login from "./login.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants.js";

class RecentConversations {

	constructor(widget) {
		// Initialize dependencies
		this.widget = widget;
		this.widget.recentConversations = this;
		this.chAdapter = widget.chAdapter;
		this.utility = new Utility();

		this.loadCount = 0;
		this.limit = 25;
		this.skip = 0;

		// Create recent conversation window
		this._createRecentWindow();
	}

	_createRecentWindow() {
		let frame = document.getElementById("ch_frame");
		// Create recent conversation window
		let recentConvAttributes = [{"id":"ch_recent_window"},{"class":"ch-recent-window"}];
		let recentConvWindow = this.utility.createElement("div", recentConvAttributes, null, frame);

		// Create Header
		let headerAttributes = [{"id":"ch_recent_header"},{"class":"ch-header"}];
		let header = this.utility.createElement("div", headerAttributes, null, recentConvWindow);

		// Create header title div
		let titleAttributes = [{"id":"ch_header_title"},{"class":"ch-header-title"}];
		let titleDiv = this.utility.createElement("div", titleAttributes, LANGUAGE_PHRASES.CHAT, header);

		// Create header options div
		let optionAttributes = [{"id":"ch_header_option"},{"class":"ch-header-option"}];
		let optionsDiv = this.utility.createElement("div", optionAttributes, null, header);

		// Create search button
		let searchAttributes = [{"id":"ch_search"}];
		let search = this.utility.createElement("i", searchAttributes, "search", optionsDiv);
		search.classList.add('material-icons', 'ch-search-icon');

		// Create option button
		let optionsAttributes = [{"id":"ch_logout"},{"title":LANGUAGE_PHRASES.LOGOUT}];
		let options = this.utility.createElement("i", optionsAttributes, "power_settings_new", optionsDiv);
		options.classList.add('material-icons', 'ch-options');

		// Create minimize button
		let minimizeBtnAttributes = [{"id":"ch_minimize_btn"},{"title":LANGUAGE_PHRASES.CLOSE}];
		let minimizeBtn = this.utility.createElement("i", minimizeBtnAttributes, "close", optionsDiv);
		minimizeBtn.classList.add("material-icons", "ch-minimize-btn");

		// Create all conversation listing
		let listingAttributes = [{"id":"ch_recent_listing"},{"class":"ch-recent-listing"}];
		let convListing = this.utility.createElement("div", listingAttributes, null, recentConvWindow);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_recent_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, convListing);
		loaderContainer.style.display = "block";

		// Create loader
		let loaderAttributes = [{"id":"ch_recent_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);

		// Create ul for listing
		let ulAttributes = [{"id":"ch_recent_ul"},{"class":"ch-recent-ul"}];
		let ul = this.utility.createElement("ul", ulAttributes, null, convListing);

		// Invoke event listeners
			this._registerClickEventHandlers();

		// Set user image in header
		this.getUser(window.userId, (err, user) => {
			if(err) return console.error(err);

			let imgAttributes = [{"class":"ch-conversation-image"}];
			let userImg = this.utility.createElement("div", imgAttributes, null, null);
			header.insertBefore(userImg, header.childNodes[0]);
			let profileImageUrl = user.profileImageUrl ? user.profileImageUrl : IMAGES.AVTAR;
			userImg.style.backgroundImage = "url(" + profileImageUrl + ")";
		});

		// Load recent conversations
		this._loadConversations();
	}

	_loadConversations() {
		// Load conversations
		this.chAdapter.getConversationsList(this.limit, this.skip, null, (err, conversations) => {
			if(err) return console.error(err);

			this.conversations = conversations;
			// Hide loader
			document.getElementById("ch_recent_loader_container").style.display = "none";

			if(!conversations.length) {
				// Create no message div
				let convlisting = document.getElementById("ch_recent_listing");
				let noMessageDivAttributes = [{"id":"ch_no_msg"},{"class":"ch-no-msg"}];
				this.utility.createElement("div", noMessageDivAttributes, LANGUAGE_PHRASES.NO_CONV_FOUND, convlisting);
				return;
			}

			// Create conversation listing elements
			this._createConversationListing(conversations);
		});
	}

	_createConversationListing(conversations) {
		let ul = document.getElementById("ch_recent_ul");

		conversations.forEach(conversation => {
			conversation = this.modifyConversation(conversation);
			if(!conversation.member)
				return;

			// Create list of conversations
			let listAttributes = [{"id":conversation.id}];
			let list = this.utility.createElement("li", listAttributes, null, ul);

			// Add listener on every conversation
			list.addEventListener("click", (data) => {
				if(document.getElementById("ch_conv_window")) {
					document.getElementById("ch_conv_window").remove();
					this.widget.convWindows.pop();
				}

				const conversationWindow = new ConversationWindow(this.widget);
				conversationWindow.init(conversation);
				this.widget.convWindows.push(conversationWindow);
			});
			
			// Create profile image tag
			let imgAttributes = [{"class":"ch-conversation-image"}];
			let imgDiv = this.utility.createElement("div", imgAttributes, null, list);
			imgDiv.style.backgroundImage = "url(" + conversation.profileImageUrl + ")";

			// Create online icon
			let iconAttributes = [{"id":conversation.member.userId+"_online_icon"},{"class":"ch-online-icon"}];
			let icon = this.utility.createElement("span", iconAttributes, null, imgDiv);

			// Show block icon
			if(conversation.blockedByUser || conversation.blockedByMember) {
				icon.classList.add("ch-user-blocked");
				icon.classList.add("ch-show-element");
			}

			if(!conversation.isGroup && conversation.member.user && conversation.member.user.isOnline)
				icon.classList.add("ch-show-element");

			// Create title div
			let titleDivAttributes = [{"id":"ch_title"}];
			this.utility.createElement("div", titleDivAttributes, conversation.title, list);

			// Create time div
			let createdAtAttributes = [{"id":"ch_created_at"},{"class":"ch-created-at"}];
			this.utility.createElement("div", createdAtAttributes, conversation.lastMessageTime, list);

			// Create last message box
			let lastMsgBoxAttributes = [{"id":"ch_last_msg_box"},{"class":"ch-last-msg-box"}];
			let lastMsgBox = this.utility.createElement("div", lastMsgBoxAttributes, null, list);

			if(conversation.lastMessageType != "text") {
				// Create last message icon
				let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":conversation.lastMessageIcon}];
				this.utility.createElement("img", msgIconAttributes, null, lastMsgBox);
			}

			// Create last message
			let lastMsgAttributes = [{"id":"ch_msg_"+conversation.lastMessageId},{"class":"ch-last-message"}];
			this.utility.createElement("div", lastMsgAttributes, conversation.lastMessageBody, lastMsgBox);
		});
	}

	getUser(userId, cb) {
		this.chAdapter.getUser(userId, (err, user) => {
			if(err) return cb(err);

			return cb(null, user);
		});
	}

	modifyConversation(conversation) {
		let member = conversation.membersList.find(member => member.userId != window.userId);
		if (!member || !member.user) {
      conversation.title = LANGUAGE_PHRASES.DELETED_MEMBER;
      conversation.profileImageUrl = null;
      conversation.isOnline = false;
      return conversation;
    }

    //Set profile Image of conversation
    let imgUrl;
    if(!conversation.isGroup)
    	imgUrl = IMAGES.AVTAR;
    else
    	imgUrl = IMAGES.GROUP;

		if(conversation.isGroup)
			conversation.profileImageUrl = conversation.profileImageUrl ? conversation.profileImageUrl : imgUrl;
		else
			conversation.profileImageUrl = member.user.profileImageUrl ? member.user.profileImageUrl : imgUrl;

    // Set conversation title and member status
		conversation.title = conversation.isGroup ? conversation.title : member.user.displayName;
		conversation.isOnline = member.user ? member.user.isOnline : false;
		conversation.member = member;

		let loginUser = conversation.membersList.find(member => member.userId == window.userId);
		conversation = this._setLastMessage(conversation, loginUser.lastMessage);

		// Set block user status
		if(!member.isActive)
			conversation.blockedByMember = true;

		if(!loginUser.isActive)
			conversation.blockedByUser = true;

		conversation.modified = true;
		return conversation;
	}

	_setLastMessage(conversation, message) {
		if(!message)
			return conversation;
		// Set lastMessage of conersation
		if(!message.contentType || message.contentType == 0) {
			if(message.isDeleted) {
				conversation.lastMessageType = "text";
				conversation.lastMessageBody = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
			}
			else if(message.attachmentType && message.attachmentType != "text") {
				let icon;

				switch(message.attachmentType) {
					case "image":
						icon = IMAGES.GALLERY_ICON;
						conversation.lastMessageBody = LANGUAGE_PHRASES.IMAGE;
						break;

					case "audio":
						icon = IMAGES.AUDIO_ICON;
						conversation.lastMessageBody = LANGUAGE_PHRASES.AUDIO;
						break;

					case "video":
						icon = IMAGES.GALLERY_ICON;
						conversation.lastMessageBody = LANGUAGE_PHRASES.VIDEO;
						break;
				}
				conversation.lastMessageType = message.attachmentType;
				conversation.lastMessageIcon = icon;
			}
			else {
				conversation.lastMessageType = "text";
				conversation.lastMessageBody = message.body;
			}
		}
		else if(message.contentType == 2) {
			if(message.attachmentType == "sticker") {
				conversation.lastMessageBody = LANGUAGE_PHRASES.STICKER;
				conversation.lastMessageType = "sticker";
				conversation.lastMessageIcon = IMAGES.STICKER_ICON;
			}
			else {
				conversation.lastMessageBody = LANGUAGE_PHRASES.GIF;
				conversation.lastMessageType = "gif";
				conversation.lastMessageIcon = IMAGES.GIF_ICON;
			}
		}
		else if(message.contentType == 3) {
			conversation.lastMessageBody = LANGUAGE_PHRASES.LOCATION;
			conversation.lastMessageType = "location";
			conversation.lastMessageIcon = IMAGES.LOCATION_ICON;
		}

		// Set Last Message time
		if(!message.recipients.length) {
			conversation.lastMessageTime = this.utility.updateTimeFormat(Date());
		}
		else {
			let loginUser = conversation.membersList.find(member => member.userId == window.userId);
			conversation.lastMessageTime = this.utility.updateTimeFormat(loginUser.updatedAt);
		}
		
		// Set last message Id
		conversation.lastMessageId = message.id;
		return conversation;
	}

	deleteLastMessage(data, updatedLastMsg) {
		let targetLastMsg = document.getElementById("ch_msg_" + data.messageIds[0]);
		if(!updatedLastMsg) {
			targetLastMsg.innerHTML = "";
			return;
		}

		if(targetLastMsg) {
			targetLastMsg.id = updatedLastMsg.id.replace("ch_message_", "ch_msg_");
			let lastMsgBox = targetLastMsg.parentNode;

			// Remove last message icon if exist
			if(lastMsgBox.firstChild.id == "ch_msg_type_icon")
				lastMsgBox.firstChild.remove();

			// Update last message
			if(updatedLastMsg.firstChild.innerText == LANGUAGE_PHRASES.MESSAGE_DELETED) {
				targetLastMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
			}
			else {
				let mediaMsg = updatedLastMsg.firstChild;

				if(mediaMsg.id == "ch_image_message") {
					// Create last message icon
					let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":IMAGES.GALLERY_ICON}];
					let msgIcon = this.utility.createElement("img", msgIconAttributes, null, null);
					lastMsgBox.insertBefore(msgIcon, targetLastMsg);

					targetLastMsg.innerHTML = LANGUAGE_PHRASES.IMAGE;
				}
				else if(mediaMsg.id == "ch_audio_message") {
					// Create last message icon
					let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":IMAGES.AUDIO_ICON}];
					let msgIcon = this.utility.createElement("img", msgIconAttributes, null, null);
					lastMsgBox.insertBefore(msgIcon, targetLastMsg);

					targetLastMsg.innerHTML = LANGUAGE_PHRASES.AUDIO;
				}
				else if(mediaMsg.id == "ch_video_message") {
					// Create last message icon
					let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":IMAGES.VIDEO_ICON}];
					let msgIcon = this.utility.createElement("img", msgIconAttributes, null, null);
					lastMsgBox.insertBefore(msgIcon, targetLastMsg);

					targetLastMsg.innerHTML = LANGUAGE_PHRASES.VIDEO;
				}
				else if(mediaMsg.id == "ch_location_message") {
					// Create last message icon
					let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":IMAGES.LOCATION_ICON}];
					let msgIcon = this.utility.createElement("img", msgIconAttributes, null, null);
					lastMsgBox.insertBefore(msgIcon, targetLastMsg);

					targetLastMsg.innerHTML = LANGUAGE_PHRASES.LOCATION;
				}
				else if(mediaMsg.id == "ch_sticker_message") {
					// Create last message icon
					let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":IMAGES.STICKER_ICON}];
					let msgIcon = this.utility.createElement("img", msgIconAttributes, null, null);
					lastMsgBox.insertBefore(msgIcon, targetLastMsg);

					targetLastMsg.innerHTML = LANGUAGE_PHRASES.STICKER;
				}
				else {
					targetLastMsg.innerHTML = updatedLastMsg.innerText;
				}
			}
		}
	}

	updateNewMessage(message) {
		if(!message) {
			return;
		}

		let convToUpdate = this.conversations.find(conv => conv.id == message.chatId);

		// Update recent conversation list if exist
		if(convToUpdate && document.getElementById(convToUpdate.id)) {
			document.getElementById(convToUpdate.id).remove();
			convToUpdate = this._setLastMessage(convToUpdate, message);
			this._addNewConversationInList(convToUpdate);
		}
		else {
			// Get new conversation object
			this.chAdapter.getConversation(message.chatId, (err, conversation) => {
				if(err) return console.error(err);

				// Remove no message tag if exist
				if(document.getElementById("ch_no_msg"))
					document.getElementById("ch_no_msg").remove();

				conversation = this.modifyConversation(conversation);
				this.conversations = this.conversations.concat(conversation);
				this._addNewConversationInList(conversation);

				// Replace dummy conversation with new conversation
				this.widget.convWindows.forEach(conversationWindow => {
					if(conversationWindow.conversation.isDummyObject) {
						if(document.getElementById("ch_conv_window")) {
							document.getElementById("ch_conv_window").remove();
							this.widget.convWindows.pop();
						}

						const conversationWindow = new ConversationWindow(this.widget);
						conversationWindow.init(conversation);
						this.widget.convWindows.push(conversationWindow);
					}
				});
			});
		}
	}

	updateUserOnline(user) {
		if(!this.conversations)
			return;

		this.conversations.forEach(conversation => {
			if(conversation.member.userId == user.id) {
				conversation.status = "Online";
				return;
			}
		});

		let onlineIcon = document.getElementById(user.id+"_online_icon");
		if(onlineIcon) {
			onlineIcon.classList.remove("ch-user-blocked");
			onlineIcon.classList.add("ch-show-element");
		}
	}

	updateUserOffline(user) {
		if(!this.conversations)
			return;

		let conv = this.conversations.find(conversation => {
			conversation.member.userId == user.id;
			conversation.status = this.utility.updateTimeFormat(user.lastSeen);
		});

		let onlineIcon = document.getElementById(user.id+"_online_icon");
		if(onlineIcon) {
			onlineIcon.classList.remove("ch-show-element");
		}
	}

	_addNewConversationInList(conversation) {
		// Add new conversation in recent conversation list
		let ul = document.getElementById("ch_recent_ul");
		let listAttributes = [{"id":conversation.id}];
		let newConvlist = this.utility.createElement("li", listAttributes, null, null);
		ul.insertBefore(newConvlist, ul.childNodes[0]);

		// Add event listener on new conversation
		newConvlist.addEventListener("click", (data) => {
			if(document.getElementById("ch_conv_window")) {
				document.getElementById("ch_conv_window").remove();
				this.widget.convWindows.pop();
			}

			const conversationWindow = new ConversationWindow(this.widget);
			conversationWindow.init(conversation);
			this.widget.convWindows.push(conversationWindow);
		});
		
		// Create profile image tag
		let imgAttributes = [{"class":"ch-conversation-image"}];
		let imgDiv = this.utility.createElement("div", imgAttributes, null, newConvlist);
		imgDiv.style.backgroundImage = "url(" + conversation.profileImageUrl + ")";

		// Create title div
		let titleAttributes = [{"id":"ch_title"}];
		this.utility.createElement("div", titleAttributes, conversation.title, newConvlist);

		// Create time div
		let createdAtAttributes = [{"id":"ch_created_at"},{"class":"ch-created-at"}];
		this.utility.createElement("div", createdAtAttributes, conversation.lastMessageTime, newConvlist);

		// Create last message box
		let lastMsgBoxAttributes = [{"id":"ch_last_msg_box"},{"class":"ch-last-msg-box"}];
		let lastMsgBox = this.utility.createElement("div", lastMsgBoxAttributes, null, newConvlist);

		if(conversation.lastMessageType != "text") {
			// Create last message icon
			let msgIconAttributes = [{"id":"ch_msg_type_icon"},{"class":"ch-msg-type-icon"},{"src":conversation.lastMessageIcon}];
			this.utility.createElement("img", msgIconAttributes, null, lastMsgBox);
		}

		// Create last message
		let lastMsgAttributes = [{"id":"ch_msg_"+conversation.lastMessageId}, {"class":"ch-last-message"}];
		this.utility.createElement("div", lastMsgAttributes, conversation.lastMessageBody, lastMsgBox);
	}

	removeConversationList(id) {
		document.getElementById(id).remove();
	}

	_loadMoreConversations() {
		++this.loadCount;
		this.skip = this.loadCount * this.limit;
		this.chAdapter.getConversationsList(this.limit, this.skip, null, (err, conversations) => {
			if(err) return console.error(err);

			this._createConversationListing(conversations);
			this.conversations = this.conversations.concat(conversations);
		});
	}

	_registerClickEventHandlers() {
		// Search button listener
		let searchBtn = document.getElementById("ch_search");
		searchBtn.addEventListener("click", (data) => {
			let searchWindow = document.getElementById("ch_search_window");
			if(!searchWindow) {
				new Search(this.widget);
			}
		});

		// Logout button listener
		let logoutBtn = document.getElementById("ch_logout");
		logoutBtn.addEventListener("click", (data) => {
			// Show loader
			document.getElementById("ch_recent_loader_container").style.display = "block";

			// Disconnect from channelize server
			this.chAdapter.disconnect("", (err, res) => {
				if(err) return console.error(err);

				// Delete cookies
				this.widget.setCookie("ch_user_id", "", -1);
				this.widget.setCookie("ch_access_token", "", -1);

				document.getElementById("ch_recent_window").remove();
				if(document.getElementById("ch_conv_window"))
					document.getElementById("ch_conv_window").remove();

				this.widget.recentConversations = null;
				this.widget.convWindows = [];
				// Invoke login screen
				new Login(this.widget);
			});
		});

		// Add minimize button listener
		let minimizeBtn = document.getElementById("ch_minimize_btn");
		if(!minimizeBtn)
			return;

		minimizeBtn.addEventListener("click", (data) => {
			document.getElementById("ch_recent_window").style.display = "none";
		});

		// Load more conversation on scroll
		let convListing = document.getElementById("ch_recent_listing");

		convListing.addEventListener("scroll", (data) => {
			if(convListing.scrollTop >= (convListing.scrollHeight - convListing.clientHeight)) {
				this._loadMoreConversations();
			}
		});
	}

	handleBlock(self, userId) {
		this.conversations.forEach(conversation => {
			if(conversation.member.userId == userId && self) {
				conversation.blockedByMember = true;
			}
			else if(conversation.member.userId == userId && !self) {
				conversation.blockedByUser = true;
			}
		});

		let onlineIcon = document.getElementById(userId+"_online_icon");
		if(onlineIcon)
			onlineIcon.classList.add("ch-user-blocked");
	}

	handleUnblock(self, userId) {
		this.conversations.forEach(conversation => {
			if(conversation.member.userId == userId && self) {
				conversation.blockedByMember = false;
			}
			else if(conversation.member.userId == userId && !self) {
				conversation.blockedByUser = false;
			}
		});

		let onlineIcon = document.getElementById(userId+"_online_icon");
		if(onlineIcon)
			onlineIcon.classList.remove("ch-user-blocked");
	}
}

export { RecentConversations as default };