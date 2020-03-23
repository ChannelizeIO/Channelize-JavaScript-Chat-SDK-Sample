import '../scss/main.scss';
import ChannelizeAdapter from "./adapter.js";
import Utility from "./utility.js";
import Login from "./components/login.js";
import RecentConversations from "./components/recent-conversations.js";
import ConversationWindow from "./components/conversation-window.js";
import { LANGUAGE_PHRASES, IMAGES } from "./constants.js";

class ChannelizeWidget {
	constructor(publicKey) {
		this.utility = new Utility();
		this._init(publicKey);
	}

	// Initialize the main contents
	_init(publicKey) {
		// Create script tag for material icons
		let materialScriptAttributes = [{"href":"https://fonts.googleapis.com/icon?family=Material+Icons"},{"rel":"stylesheet"}];
		this.utility.createElement("link", materialScriptAttributes, null, document.head);

		// Initialize Channelize Adapter
		this.chAdapter = new ChannelizeAdapter(publicKey);
		this.convWindows = [];
	}

	// Load channelize
	load() {
		// Check for already login user
		let userId = this.getCookie("ch_user_id");
		let accessToken = this.getCookie("ch_access_token");

		if(userId && accessToken) {
			this.connect(userId, accessToken, (err, res) => {
				if(err) return console.error(err);

				this.userId = userId;
				this._createLauncher();
			});
		}
		else {
			this._createLauncher();
		}
	}

	connect(userId, accessToken, cb) {
	  	this.chAdapter.connect(userId, accessToken, (err, res) => {
			if(err) return cb(err);

			this._registerChEventHandlers();
			return cb(null, res);
		});
	}

	// Connect and load channelize
	loadWithUserId(userId, accessToken) {
		this.connect(userId, accessToken, (err, res) => {
			if(err) return console.error(err);

			this.userId = userId;
			this.setCookie(userId, accessToken, 30);
			this._createLauncher();
		});
	}

	// Create channelize frame and launcher
	_createLauncher() {
		let widget = document.getElementById("ch_widget");
		let launcher;

		// Create default launcher if not exist
		if(!document.getElementById("ch_launcher")) {
			let launcherAttributes = [{"id":"ch_launcher"},{"class":"ch-launcher"}];
			launcher = this.utility.createElement("div", launcherAttributes, null, widget);

			// Create launcher image
			let launcherImageAttributes = [{"id":"ch_launcher_image"},{"class":"ch-launcher-image"},{"src":IMAGES.LAUNCHER_ICON}];
			this.utility.createElement("img", launcherImageAttributes, null, launcher);
		}

		// Create channelize frame
		let frameAttributes = [{"id":"ch_frame"},{"class":"ch-frame"}];
		let frame = this.utility.createElement("div", frameAttributes, null, widget);

		// Channelize launcher listener
		launcher.addEventListener("click", (data) => {
			// If login window already exist
			if(document.getElementById("ch_login_window"))
				return;

			// Show recent conversation window if already exist
			if(document.getElementById("ch_recent_window")) {
				document.getElementById("ch_recent_window").style.display = "block";
				return;
			}

			let user = this.chAdapter.getLoginUser();
			if(user) {
				// Invoke recent conversation window
				this.recentConversations =  new RecentConversations(this);
			}
			else {
				// Invoke login screen
				new Login(this);
			}
		});
	}

	// Handle all real time events of JS-SDK
	_registerChEventHandlers() {
		// Handle new message
		window.channelize.chsocket.on('user.message_created', (data) => {
			if(this.recentConversations) {
				this.recentConversations.updateNewMessage(data.message);
			}

			this.convWindows.forEach(conversationWindow => {
				conversationWindow.addNewMessage(data.message);
			});
		});

		// Handle delete message for me
		window.channelize.chsocket.on('user.message_deleted', (data) => {
			let updatedLastMsg;
			// Remove message from conversation screen
			if(document.getElementById(data.messages[0].id)) {
				document.getElementById(data.messages[0].id).remove();

				if(document.getElementById("ch_messages_box").lastChild) {
					let lastMsgAfterDelete = document.getElementById("ch_messages_box").lastChild.id;
					updatedLastMsg = document.getElementById("ch_message_" + lastMsgAfterDelete);
				}
			}

			if(this.recentConversations) {
				this.recentConversations.deleteLastMessage(data, updatedLastMsg);
			}
		});

		// Handle delete message for everyone
		window.channelize.chsocket.on('message.deleted_for_everyone', (data) => {
			// Update message text in conversation screen
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateDeleteForEveryoneMsg(data);
			});

			// Update message text in recent screen
			let recentTargetMsg = document.getElementById("ch_msg_" + data.messages[0].id);
			if(recentTargetMsg) {
				// Remove if media/location/sticker/gif icon present
				if(recentTargetMsg.parentNode.firstChild.nodeName != "DIV")
					recentTargetMsg.parentNode.firstChild.remove();

				recentTargetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
			}
		});

		// Handle mark as read
		window.channelize.chsocket.on('conversation.mark_as_read', (data) => {
			if(this.userId == data.user.id)
				return;

			// Update lastReadAt of conversation
			if(this.recentConversations) {
				this.recentConversations.updateReadAt(data);
			}

			// Update message read status in conversation screen
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateMsgStatus(data);
			});
		});

		// Handle user online/ofline status
		window.channelize.chsocket.on('user.status_updated', (data) => {
			if(this.recentConversations) {
				this.recentConversations.updateUserStatus(data.user);
			}

			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateUserStatus(data.user);
			});
		});

		// Handle clear conversation
		window.channelize.chsocket.on('user.conversation_cleared', (data) => {
			// Delete last message from particular recent conversation
			if(document.getElementById(data.conversation.id) && document.getElementById(data.conversation.id).lastChild)
				document.getElementById(data.conversation.id).lastChild.remove();

			// Remove all messages of the conversation
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleClearConversation(data.conversation);
			});
		});

		// Handle delete conversation
		window.channelize.chsocket.on('user.conversation_deleted', (data) => {
			// Delete last message from particular recent conversation
			if(document.getElementById(data.conversation.id) && document.getElementById(data.conversation.id).lastChild)
				document.getElementById(data.conversation.id).remove();

			// Remove conversation screen
			this.convWindows.forEach(conversationWindow => {
				if(conversationWindow.conversation.id == data.conversation.id) {
					if(document.getElementById("ch_conv_window")) {
						document.getElementById("ch_conv_window").remove();
					}
				}
			});
		});

		// Handle user block
		window.channelize.chsocket.on('user.blocked', (data) => {
			// Update block icon in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleBlock(data);
			}
			
			// Update conversation screen of block user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleBlock(data);
			});
		});

		// Handle user unblock
		window.channelize.chsocket.on('user.unblocked', (data) => {
			// Update unblock icon in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleUnblock(data);
			}
			
			// Update conversation screen of unblock user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleUnblock(data);
			});
		});
	}

	setCookie(userId, accessToken, exdays) {
		let date = new Date();
		date.setTime(date.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+ date.toUTCString();
		document.cookie = "ch_user_id=" + userId + ";" + expires + ";path=/";
		document.cookie = "ch_access_token=" + accessToken + ";" + expires + ";path=/";
	}

	getCookie(cname) {
		var name = cname + "=";
		var cookieArray = document.cookie.split(';');
		for(var i = 0; i < cookieArray.length; i++) {
			var singleCookie = cookieArray[i];
			while (singleCookie.charAt(0) == ' ') {
				singleCookie = singleCookie.substring(1);
			}
			if (singleCookie.indexOf(name) == 0) {
				return singleCookie.substring(name.length, singleCookie.length);
			}
		}
		return "";
	}

	// To skip out login process and direct open recent conversation window
	loadRecentConversation(userId, accessToken) {
		// Connect to Channelize server
		this.userId = userId;
		this.connect(userId, accessToken, (err, res) => {
			if(err) return console.error(err);

			// Create channelize frame
			let widget = document.getElementById("ch_widget");
			let frameAttributes = [{"id":"ch_frame"},{"class":"ch-frame"}];
			let frame = this.utility.createElement("div", frameAttributes, null, widget);

			// Invoke recent conversation window
			this.recentConversations =  new RecentConversations(this);
		});
	}

	// To open a conversation screen of any user via member-id or conversation-id
	loadConversationWindow(otherMemberId, conversationId = null) {
		if(otherMemberId) {
			this.chAdapter.getConversationsList(1, 0, otherMemberId, "members", null, null, null, null, null, (err, conversations) => {
				if(err) return console.error(err);

				if(!conversations.length) {
					console.error(LANGUAGE_PHRASES.CONVERSATION_NOT_FOUND);
					return;
				}

				let conversationWindow = new ConversationWindow(this);
				conversationWindow.init(conversations[0]); // Pass conversation object in params
				this.convWindows.push(conversationWindow);
			});
		}
		else if(conversationId) {
			let conversation = this.chAdapter.getConversation(conversationId, (err, conversation) => {
				if(err) return console.error(err);

				let conversationWindow = new ConversationWindow(this);
				conversationWindow.init(conversation); // Pass conversation object in params
				this.convWindows.push(conversationWindow);
			});
		}
	}
}

window.ChannelizeWidget = ChannelizeWidget;