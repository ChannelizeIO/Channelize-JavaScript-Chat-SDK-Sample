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
		this.getUser(this.widget.userId, (err, user) => {
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
		this.chAdapter.getConversationsList(this.limit, this.skip, null, "members", null, null, null, null, null, (err, conversations) => {
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
			// modify conversation object
			conversation = this.modifyConversation(conversation);

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

			if(!conversation.isGroup && conversation.user) {
				// Create online icon
				let iconAttributes = [{"id":conversation.user.id+"_online_icon"},{"class":"ch-online-icon"}];
				let icon = this.utility.createElement("span", iconAttributes, null, imgDiv);

				// Show block icon
				if(conversation.blockedByUser || conversation.blockedByMember) {
					icon.classList.add("ch-user-blocked");
				}

				// Show online icon
				if(conversation.user && conversation.user.isOnline) {
					icon.classList.add("ch-show-element");
				}
			}

			// Create title div
			let titleDivAttributes = [{"id":"ch_title"}];
			this.utility.createElement("div", titleDivAttributes, conversation.title, list);

			// Create time div
			let createdAtAttributes = [{"id":"ch_created_at"},{"class":"ch-created-at"}];
			this.utility.createElement("div", createdAtAttributes, conversation.lastMessageTime, list);

			// Create last message box
			let lastMsgBoxAttributes = [{"id":"ch_last_msg_box"},{"class":"ch-last-msg-box"}];
			let lastMsgBox = this.utility.createElement("div", lastMsgBoxAttributes, null, list);

			if(conversation.lastMessageIcon) {
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
		if (!conversation.isGroup && Object.entries(conversation.user).length === 0) {
			conversation.title = LANGUAGE_PHRASES.DELETED_MEMBER;
			conversation.profileImageUrl = IMAGES.AVTAR;
			return conversation;
    	}

    	// Set last message of conversation
		conversation = this._setLastMessage(conversation, conversation.lastMessage);

	    // Set profile Image, title and status of conversation
		if(conversation.isGroup) {
			conversation.profileImageUrl = conversation.profileImageUrl ? conversation.profileImageUrl : IMAGES.GROUP;
			conversation.status = conversation.memberCount + " " + LANGUAGE_PHRASES.MEMBERS;
		}
		else {
			conversation.profileImageUrl = conversation.user.profileImageUrl ? conversation.user.profileImageUrl : IMAGES.AVTAR;
			conversation.title = conversation.user.displayName;

			// Set block user status
			let member = conversation.members.find(member => member.userId == conversation.user.id);
			if(!member) {
				conversation.blockedByMember = true;
				conversation.status = "";
			}
			else {
				conversation.blockedByMember = member ? false : true;
				if(!conversation.isActive) {
					conversation.blockedByUser = true;
				}

				if(conversation.user.isOnline) {
					conversation.status = LANGUAGE_PHRASES.ONLINE;
				}
				else if(conversation.user.lastSeen) {
					conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(member.user.lastSeen);
				}
			}
		}
		conversation.isModified = true;
		return conversation;
	}

	_setLastMessage(conversation, message) {
		if(!message)
			return conversation;

		// Set lastMessage of conersation
		conversation.lastMessage = message;
		if(message.isDeleted) {
			conversation.lastMessageIcon = null;
			conversation.lastMessageBody = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
		}
		else if(message.type != "normal") {
			conversation.lastMessageIcon = null;
			conversation.lastMessageBody = this._modifyMessageBody(message);
		}
		else if(message.attachments && message.attachments.length) {

			switch(message.attachments[0].type) {
				case "image":
					conversation.lastMessageIcon = IMAGES.GALLERY_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.IMAGE;
					break;

				case "audio":
					conversation.lastMessageIcon = IMAGES.AUDIO_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.AUDIO;
					break;

				case "video":
					conversation.lastMessageIcon = IMAGES.GALLERY_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.VIDEO;
					break;

				case "location":
					conversation.lastMessageIcon = IMAGES.LOCATION_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.LOCATION;
					break;

				case "sticker":
					conversation.lastMessageIcon = IMAGES.STICKER_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.STICKER;
					break;

				case "gif":
					conversation.lastMessageIcon = IMAGES.GIF_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.GIF;
					break;

				case "text":
					conversation.lastMessageIcon = IMAGES.GALLERY_ICON;
					conversation.lastMessageBody = message.body;
					break;

				default:
					conversation.lastMessageIcon = IMAGES.GALLERY_ICON;
					conversation.lastMessageBody = LANGUAGE_PHRASES.ATTACHMENT;
			}
		}
		else {
			conversation.lastMessageIcon = null;
			conversation.lastMessageBody = message.body;
		}

		// Set Last Message time
		if(!message.updatedAt) {
			conversation.lastMessageTime = this.utility.updateTimeFormat(Date());
		}
		else {
			conversation.lastMessageTime = this.utility.updateTimeFormat(message.updatedAt);
		}
		
		// Set last message Id
		conversation.lastMessageId = message.id;
		return conversation;
	}

	deleteLastMessage(data, updatedLastMsg) {
		let targetLastMsg = document.getElementById("ch_msg_" + data.messages[0].id);
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

	updateNewMessage(message, newConversation = null) {
		if(!message) {
			return;
		}

		let convToUpdate = this.conversations.find(conv => conv.id == message.conversationId);

		if(newConversation) {
			// Remove no message tag if exist
			if(document.getElementById("ch_no_msg")) {
				document.getElementById("ch_no_msg").remove();
			}

			newConversation = this.modifyConversation(newConversation);
			this.conversations = this.conversations.concat(newConversation);
			this._addNewConversationInList(newConversation);
		}
		else {
			document.getElementById(convToUpdate.id).remove();
			convToUpdate = this._setLastMessage(convToUpdate, message);
			this._addNewConversationInList(convToUpdate);
		}
	}

	_modifyMessageBody(message) {
		if(!message)
			return;

		// Handle meta message
		if(message.type == "admin") {
			let body;

			// adminMessageType
			switch(message.body) {
				case "admin_group_create" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_CREATED;
					break;

				case "admin_group_change_photo" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_PHOTO_CHANGED;
					break;

				case "admin_group_change_title" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_TITLE_CHANGED;
					break;

				case "admin_group_add_members" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_MEMBER_ADDED;
					break;

				case "admin_group_remove_members" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_MEMBER_REMOVED;
					break;

				case "admin_group_make_admin" :
					body = "<i>" + LANGUAGE_PHRASES.GROUP_ADMIN_UPDATED;
					break;

				default:
					body = "<i>" + message.type + " message";
			}
			return body;
		}
	}

	updateUserStatus(user) {
		if(!this.conversations)
			return;

		const index = this.conversations.findIndex(conversation => conversation.user.id == user.id);
		if(index != -1) {
			this.conversations[index].user = user;
			if(user.isOnline) {
				this.conversations[index].status = LANGUAGE_PHRASES.ONLINE;
			}
			else {
				this.conversations[index].status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(user.lastSeen);
			}
		}

		// Update block/unblock icon
		let userStatusIcon = document.getElementById(user.id+"_online_icon");
		if(!userStatusIcon)
			return;

		if(user.isOnline) {
			userStatusIcon.classList.add("ch-show-element");
		}
		else {
			userStatusIcon.classList.remove("ch-show-element");
		}
	}

	updateReadAt(data) {
		let index = this.conversations.findIndex(conv => conv.id == data.conversation.id);
		if(index != -1) {
			this.conversations[index].lastReadAt[data.userId] = data.timestamp;
		}
	}

	_addNewConversationInList(conversation) {
		// Add new conversation in recent conversation list
		let ul = document.getElementById("ch_recent_ul");
		let listAttributes = [{"id":conversation.id}];
		let newConvlist = this.utility.createElement("li", listAttributes, null, null);
		ul.insertBefore(newConvlist, ul.childNodes[0]);

		// Add event listener on new conversation list
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

		if(!conversation.isGroup && conversation.user) {
			// Create online icon
			let iconAttributes = [{"id":conversation.user.id+"_online_icon"},{"class":"ch-online-icon"}];
			let icon = this.utility.createElement("span", iconAttributes, null, imgDiv);

			// Show block icon
			if(conversation.blockedByUser || conversation.blockedByMember) {
				icon.classList.add("ch-user-blocked");
			}

			// Show online icon
			if(conversation.user && conversation.user.isOnline) {
				icon.classList.add("ch-show-element");
			}
		}

		// Create title div
		let titleAttributes = [{"id":"ch_title"}];
		this.utility.createElement("div", titleAttributes, conversation.title, newConvlist);

		// Create time div
		let createdAtAttributes = [{"id":"ch_created_at"},{"class":"ch-created-at"}];
		this.utility.createElement("div", createdAtAttributes, conversation.lastMessageTime, newConvlist);

		// Create last message box
		let lastMsgBoxAttributes = [{"id":"ch_last_msg_box"},{"class":"ch-last-msg-box"}];
		let lastMsgBox = this.utility.createElement("div", lastMsgBoxAttributes, null, newConvlist);

		if(conversation.lastMessageIcon) {
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
		this.chAdapter.getConversationsList(this.limit, this.skip, null, "members", null, null, null, null, null, (err, conversations) => {
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

	handleBlock(data) {
		this.conversations.forEach(conversation => {
			if(conversation.isGroup)
				return;

			if(conversation.user.id == data.blocker.id) {
				conversation.blockedByMember = true;
			}
			else if(conversation.user.id == data.blockee.id) {
				conversation.blockedByUser = true;
			}
		});

		let onlineIcon = document.getElementById(data.blockee.id+"_online_icon");
		if(onlineIcon) {
			onlineIcon.classList.add("ch-user-blocked");
		}
	}

	handleUnblock(data) {
		this.conversations.forEach(conversation => {
			if(conversation.isGroup)
				return;

			if(conversation.user.id == data.unblocker.id) {
				conversation.blockedByMember = false;
			}
			else if(conversation.user.id == data.unblockee.id) {
				conversation.blockedByUser = false;
			}
		});

		let onlineIcon = document.getElementById(data.unblockee.id+"_online_icon");
		if(onlineIcon) {
			onlineIcon.classList.remove("ch-user-blocked");
		}
	}
}

export { RecentConversations as default };