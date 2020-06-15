import '../scss/main.scss';
import ChannelizeAdapter from "./adapter.js";
import Utility from "./utility.js";
import Login from "./components/login.js";
import Conversation from "./components/conversation.js";
import Threads from "./components/threads.js";
import { LANGUAGE_PHRASES, SETTINGS, IMAGES } from "./constants.js";

class ChannelizeLiveStream {
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
		this.conversations = {};
		this.threads = {};
	}

	// Load channelize
	load(cb) {
		// Check for already login user
		let userId = this.getCookie("ch_live_stream_user_id");
		let accessToken = this.getCookie("ch_live_stream_access_token");
		
		if (userId && accessToken) {
			this.connect(userId, accessToken, (err, res) => {
				if (err) console.error(err);

				this.userId = userId;
				this._createFrame();
				cb(null, res);
			});
		} else {
			this._createFrame();
		}
	}

	connect(userId, accessToken, cb) {
	  	this.chAdapter.connect(userId, accessToken, (err, res) => {
			if (err) return cb(err);

			return cb(null, res);
		});
	}
	
	// Create channelize frame and launcher
	_createFrame() {
		let liveStreamEle = document.getElementById("ch_live_stream");

		// Create channelize frame
		let frameAttributes = [{"id":"ch_frame"},{"class":"ch-frame"}];
		let frame = this.utility.createElement("div", frameAttributes, null, liveStreamEle);

		let user = this.chAdapter.getLoginUser();
		if (user) {
			// Create model frame. This model frame is used to show the image and video.
			this.utility.createModelFrame();
			
			// Load conversation screen
			this.loadConversation(SETTINGS.CONVERSATION_ID);
		} else {
			// Invoke login screen
			this.renderLogin();
		}
	}

	

	loadConversation(conversationId) {
		// Destory the login screen
		this.destroyLogin();
		
		// Load the conversation
		this.chAdapter.getConversation(conversationId, (err, conversation) => {
			if(err) return console.error(err);

			if (conversation) {
				this.renderConversation(conversation);
			}
		});
	}

	renderLogin() {
		new Login(this);
 	}

 	renderConversation(conversation) {
		let convScreen = new Conversation(this);
		convScreen.init(conversation); // Pass conversation object in params
		this.conversations = convScreen;
		this.handleConversationEvents(conversation);
 	}

 	renderThreads(message, conversation) {
		// Hide the conversation screen
		this.showConversation(false);

		// Render the threads screen
		this.threads = new Threads(this, message, conversation);
 	}

 	destroyLogin() {
 		let loginScreen = document.getElementById("ch_login_screen");
 		if (loginScreen) {
 			loginScreen.remove();
 		}
 	}

 	destroyThreads() {
 		// Display the conversation screen
 		this.showConversation(true);

 		// Remove the threads screen
 		let threadsScreen = document.getElementById("ch_thread_screen");
 		if (threadsScreen) {
 			threadsScreen.remove();
			this.threads = {};
 		}
 	}

 	destroyConversation() {
 		// Render the login screen
 		this.renderLogin();

 		// Destory the conversation screen
 		let conversationScreen = document.getElementById("ch_conv_screen");
 		if (conversationScreen) {
 			conversationScreen.remove();
 			this.conversations = {};
 		}
 	}

	showConversation(show) {
 		let conversationScreen = document.getElementById("ch_conv_screen");
 		if (!conversationScreen) {
 			return;
 		}
 		if (show) {
			conversationScreen.style.display = "block";
		} else {
			conversationScreen.style.display = "none";
		}
 	}

 	handleConversationEvents(conversation) {
		// Start watching before subscribe the watcher events.
		conversation.startWatching((err, res) => {
			
			// Handle start watching event
			conversation.on('watcher.conversation.start_watching', (data) => {
				// Handle new message on conversation screen
				this.conversations.handleStartWatching(data);
			});

			// Handle stop watching event
			conversation.on('watcher.conversation.stop_watching', (data) => {
				// Handle new message on conversation screen
				this.conversations.handleStopWatching(data);
			});


			// Handle new message event
			conversation.on('watcher.message.created', (data) => {
				// Handle new message on conversation screen
				this.conversations.addNewMessage(data.message);
				
				// Handle new message on thread screen
				if (typeof this.threads.addNewMessage == "function") {
					this.threads.addNewMessage(data.message);
				}
			});

			// Handle delete message for everyone event
			conversation.on('watcher.message.deleted_for_everyone', (data) => {
				// Handle new message on conversation screen
				this.conversations.updateDeleteForEveryoneMsg(data);
				
				// Handle new message on thread screen
				if (typeof this.threads.updateDeleteForEveryoneMsg == "function") {
					this.threads.updateDeleteForEveryoneMsg(data);
				}
			});
		});

		// Handle add reaction event
		conversation.on('reaction.added', (data) => {
			// Handle add reaction on conversation screen
			this.conversations.handleAddReaction(data);
			
			// Handle add reaction on thread screen
			if (typeof this.threads.handleAddReaction == "function") {
				this.threads.handleAddReaction(data);
			}
		});

		// Handle remove reaction event
		conversation.on('reaction.removed', (data) => {
			// Handle remove reaction on conversation screen
			this.conversations.handleRemoveReaction(data);

			// Handle remove reaction on thread screen
			if (typeof this.threads.handleRemoveReaction == "function") {
				this.threads.handleRemoveReaction(data);
			}
		});
	}

	setCookie(userId, accessToken, exdays) {
		let date = new Date();
		date.setTime(date.getTime() + (exdays*24*60*60*1000));
		var expires = "expires=" + date.toUTCString();
		document.cookie = "ch_live_stream_user_id=" + userId + ";" + expires + ";path=/";
		document.cookie = "ch_live_stream_access_token=" + accessToken + ";" + expires + ";path=/";
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

}

window.ChannelizeLiveStream = ChannelizeLiveStream;