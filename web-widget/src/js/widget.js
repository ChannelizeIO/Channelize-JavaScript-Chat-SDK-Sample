import '../scss/main.scss';
import ChannelizeAdapter from "./adapter.js";
import Utility from "./utility.js";
import Login from "./components/login.js";
import Members from "./components/members.js";
import Thread from "./components/thread.js";
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
		this.threads = [];
	}

	// Load channelize
	load(cb) {
		// Check for already login user
		let userId = this.getCookie("ch_user_id");
		let accessToken = this.getCookie("ch_access_token");
		
		if(userId && accessToken) {
			this.connect(userId, accessToken, (err, res) => {
				if(err) return console.error(err);

				this.userId = userId;
				this._createLauncher();
				cb(null, res);
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
	loadWithUserId(userId, accessToken, cb) {
		this.connect(userId, accessToken, (err, res) => {
			if(err) return console.error(err);

			this.userId = userId;
			this.setCookie(userId, accessToken, 30);
			this._createLauncher();
			cb(null, res);
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

			// I have to handle showInConversation value here. If updateNewMessage is true or threads is
			// Is not enabled then show the message in conversation window.
			// Get conversation is does not exist
			if(!document.getElementById(data.message.conversationId)) {
				this.chAdapter.getConversation(data.message.conversationId, (err, conversation) => {
					if(err) return console.error(err);

					if(this.recentConversations) {
						this.recentConversations.updateNewMessage(data.message, conversation);
					}

					this.convWindows.forEach(conversationWindow => {
						conversationWindow.addNewMessage(data.message, conversation);
					});
				});

			}
			else {
				if(this.recentConversations) {
					this.recentConversations.updateNewMessage(data.message);
				}

				this.convWindows.forEach(conversationWindow => {
					conversationWindow.addNewMessage(data.message);
				});

				this.threads.forEach(thread => {
					thread.addNewMessage(data.message);
				});
			}
		});

		// Handle delete message for me
		window.channelize.chsocket.on('user.message_deleted', (data) => {
			let updatedLastMsg;
			
			// Remove message from conversation window
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

			// Remove messge from thread screen
			this.threads.forEach(thread => {
				thread.handleDeleteForMe(data);
			});
		});

		// Handle delete message for everyone
		window.channelize.chsocket.on('message.deleted_for_everyone', (data) => {
			// Update message text in recent screen
			if(this.recentConversations) {
				this.recentConversations.updateDeleteForEveryoneMsg(data);
			}

			// Update message text in conversation window
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateDeleteForEveryoneMsg(data);
			});
			
			// Update message text in thread screen
			this.threads.forEach(thread => {
				thread.updateDeleteForEveryoneMsg(data);
			});
		});

		// Handle mark as read
		window.channelize.chsocket.on('conversation.mark_as_read', (data) => {
			if(this.userId == data.user.id) {
				return;
			}

			// Update lastReadAt of conversation
			if(this.recentConversations) {
				this.recentConversations.updateReadAt(data);
			}

			// Update message read status in conversation window
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateMsgStatus(data);
			});

			// Update message read status in threads screen
			this.threads.forEach(thread => {
				thread.updateMsgStatus(data);
			});
		});

		// Handle user online/ofline status
		window.channelize.chsocket.on('user.status_updated', (data) => {
			if (this.recentConversations) {
				this.recentConversations.updateUserStatus(data.user);
			}

			this.convWindows.forEach(conversationWindow => {
				conversationWindow.updateUserStatus(data.user);
			});

			if(document.getElementById(data.user.id+"_member_online_icon")) {
				if (data.user.isOnline) {
					document.getElementById(data.user.id+"_member_online_icon").classList.add("ch-show-element");
				} else {
					document.getElementById(data.user.id+"_member_online_icon").classList.remove("ch-show-element");
				}
			}
		});

		// Handle clear conversation
		window.channelize.chsocket.on('user.conversation_cleared', (data) => {
			// Delete last message from particular recent conversation
			if (this.recentConversations) {
				this.recentConversations.handleClearConversation(data.conversation);
			}

			// Remove all messages of the conversation
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleClearConversation(data.conversation);
			});

			// Remove all messages of the thread
			this.threads.forEach(thread => {
				thread.handleClearConversation(data.conversation);
			});
		});

		// Handle delete conversation
		window.channelize.chsocket.on('user.conversation_deleted', (data) => {
			// Remove the conversation from recent conversation
			if (this.recentConversations) {
				this.recentConversations.handleDeleteConversation(data.conversation);
			}

			// Remove conversation window
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleDeleteConversation(data.conversation);
			});

			// Remove threads screen
			this.threads.forEach(thread => {
				thread.handleDeleteConversation(data.conversation);
			});
		});

		// Handle user block
		window.channelize.chsocket.on('user.blocked', (data) => {
			// Update block icon in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleBlock(data);
			}
			
			// Update conversation window of block user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleBlock(data);
			});

			// Update thread screen of block user
			this.threads.forEach(thread => {
				thread.handleBlock(data);
			});
		});

		// Handle user unblock
		window.channelize.chsocket.on('user.unblocked', (data) => {
			// Update unblock icon in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleUnblock(data);
			}
			
			// Update conversation window of unblock user
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleUnblock(data);
			});

			// Update thread screen of unblock user
			this.threads.forEach(thread => {
				thread.handleUnblock(data);
			});
		});

		// Handle user join
		window.channelize.chsocket.on('user.joined', (data) => {
			// Update conversation active in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleUserJoined(data);
			}

			// Update conversation active in conversation windows
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleUserJoined(data);
			});
		});

		// Handle user left
		window.channelize.chsocket.on('user.removed', (data) => {
			// Update conversation active in recent conversation
			if(this.recentConversations) {
				this.recentConversations.handleUserRemoved(data);
			}

			// Update conversation active in conversation windows
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleUserRemoved(data);
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

	// To open a conversation window via conversation-id
	loadConversationWindow(conversationId ) {
		let conversation = this.chAdapter.getConversation(conversationId, (err, conversation) => {
			if(err) return console.error(err);

			let conversationWindow = new ConversationWindow(this);
			conversationWindow.init(conversation); // Pass conversation object in params
			this.convWindows.push(conversationWindow);
		});
	}

	// To open a conversation window of any user via user-id
	loadConversationWindowByUserId(userId) {
		this.chAdapter.getConversationsList(1, 0, userId, "members", null, null, null, null, null, (err, conversations) => {
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

	handleConversationEvents(conversation) {
		
		// Handle add reaction
		conversation.on('reaction.added', (data) => {
			// Handle add reaction on conversation window
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleAddReaction(data);
			});
			
			// Handle add reaction on thread screen
			this.threads.forEach(thread => {
				thread.handleAddReaction(data);
			});
		});

		// Handle remove reaction
		conversation.on('reaction.removed', (data) => {
			// Handle remove reaction on conversation window
			this.convWindows.forEach(conversationWindow => {
				conversationWindow.handleRemoveReaction(data);
			});

			// Handle remove reaction on thread screen
			this.threads.forEach(thread => {
				thread.handleRemoveReaction(data);
			});

		});
	}

	loadConversationMembers(conversationId) {
		new Members(this, conversationId);
	}

	loadThread(message, conversation) {
		let thread =  new Thread(this, message, conversation);
		this.threads.push(thread);
 	}

}

window.ChannelizeWidget = ChannelizeWidget;