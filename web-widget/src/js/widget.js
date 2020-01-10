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
		this.publicKey = publicKey;
		this._init();
	}

	// Initialize the main contents
	_init() {
		// Create script tag for material icons
		let materialScriptAttributes = [{"href":"https://fonts.googleapis.com/icon?family=Material+Icons"},{"rel":"stylesheet"}];
		this.utility.createElement("link", materialScriptAttributes, null, document.head);

		// Initialize Channelize Adapter
		this.chAdapter = new ChannelizeAdapter(this.publicKey);
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

				window.userId = userId;
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
	loadWithConnect(userId, accessToken) {
		this.connect(userId, accessToken, (err, res) => {
			if(err) return console.error(err);

			window.userId = userId;
			this.setCookie(userId, accessToken, 1);
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

			this.chAdapter.getCurrentUser((err, user) => {
				if(user) {
					// Invoke recent conversation window
					this.recentConversations =  new RecentConversations(this);
				}
				else {
					// Invoke login screen
					new Login(this);
				}
			});
		});
	}

	// Handle all real time events of JS-SDK
	_registerChEventHandlers() {
		// Handle new message
		window.channelize.chsocket.on('messageReceived', (message) => {
			if(this.recentConversations) {
				this.recentConversations.updateNewMessage(message);
			}

			this.convWindows.forEach(conversationWindow => {
				conversationWindow.addNewMessage(message);
			});
		});

		// Handle delete message for me
		window.channelize.chsocket.on('messagesDeletedForMe', (data) => {
			let updatedLastMsg;

			// Remove message from conversation screen
			if(document.getElementById(data.messageIds[0])) {
				document.getElementById(data.messageIds[0]).remove();

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
		channelize.chsocket.on('messagesDeletedForEveryone', (data) => {
			// Update message text in conversation screen
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateDeleteForEveryoneMsg(data);
			});

			// Update message text in recent screen
			let recentTargetMsg = document.getElementById("ch_msg_" + data.deletedIds[0]);
			if(recentTargetMsg)
				recentTargetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
		});

		// Handle mark as read
		window.channelize.chsocket.on('readMessageToOwner', (message) => {
			if(!message.messageId || !document.getElementById(message.messageId))
				return;

			let msgBox = document.getElementById(message.messageId).firstChild;
			msgBox.lastChild.innerHTML = "done_all";
		});

		// Handle user online
		window.channelize.chsocket.on('online', (user) => {
			if(this.recentConversations) {
				this.recentConversations.updateUserOnline(user);
			}

			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateStatus(user);
			});
		});

		// Handle user offline
		window.channelize.chsocket.on('offline', (user) => {
			if(this.recentConversations) {
				this.recentConversations.updateUserOffline(user);
			}
			
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateStatus(user);
			});
		});

		// Handle clear conversation
		window.channelize.chsocket.on('conversationCleared', (conversation) => {
			// Delete last message from particular recent conversation
			if(document.getElementById(conversation.id) && document.getElementById(conversation.id).lastChild)
				document.getElementById(conversation.id).lastChild.remove();

			// Open new updated conversation screen
			this.convWindows.forEach(conversationWindow => {
				if(conversationWindow.conversation.id == conversation.id) {
					if(document.getElementById("ch_conv_window")) {
						document.getElementById("ch_conv_window").remove();
					}
					conversationWindow = new ConversationWindow(this);
					conversationWindow.init(conversation);
				}
			});
		});

		// Handle delete conversation
		window.channelize.chsocket.on('conversationDeleted', (conversation) => {
			// Delete last message from particular recent conversation
			if(document.getElementById(conversation.id) && document.getElementById(conversation.id).lastChild)
				document.getElementById(conversation.id).remove();

			// Remove conversation screen
			this.convWindows.forEach(conversationWindow => {
				if(conversationWindow.conversation.id == conversation.id) {
					if(document.getElementById("ch_conv_window")) {
						document.getElementById("ch_conv_window").remove();
					}
				}
			});
		});

		// Handle user block
		window.channelize.chsocket.on('userBlocked', (self, userId) => {
			// Update block icon in recent conversation
			this.recentConversations.handleBlock(self, userId);
			
			// Update conversation screen of block user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleBlock(self, userId);
			});
		});

		// Handle user unblock
		window.channelize.chsocket.on('userUnblocked', (self, userId) => {
			// Update unblock icon in recent conversation
			this.recentConversations.handleUnblock(self, userId);
			
			// Update conversation screen of unblock user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleUnblock(self, userId);
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
		window.userId = userId;
		this.chAdapter.connect(userId, accessToken, (err, res) => {
			if(err) return console.error(err);

			// Invoke recent conversation window
			this.recentConversations =  new RecentConversations(this);
		});
	}

	// To open a conversation screen of any user via member-id or conversation-id
	loadConversationWindow(otherMemberId, conversationId = null) {
		if(otherMemberId) {
			this.chAdapter.getConversationsList(1, 0, otherMemberId, (err, conversation) => {
				if(err) return console.error(err);

				let conversationWindow = new conversationWindow(this);
				conversationWindow.init(conversation); // Pass conversation object in params
				this.convWindows.push(conversationWindow);
			});
		}
		else if(conversationId) {
			let conversation = this.chAdapter.getConversation(conversationId, (err, conversation) => {
				if(err) return console.error(err);

				let conversationWindow = new conversationWindow(this);
				conversationWindow.init(conversation); // Pass conversation object in params
				this.convWindows.push(conversationWindow);
			});
		}
	}
}

window.ChannelizeWidget = ChannelizeWidget;