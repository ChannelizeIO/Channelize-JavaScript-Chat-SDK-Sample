import Utility from "../utility.js";
import RecentConversations from "./recent-conversations.js";
import { LANGUAGE_PHRASES, IMAGES, SETTINGS } from "../constants.js";

class ConversationWindow {

	constructor(widget) {
		// Initialize dependencies
		this.chAdapter = widget.chAdapter;
		this.widget = widget;
		this.utility = new Utility();

		this.loadCount = 0;
		this.limit = 25;
		this.skip = 0;
	}

	init(conversation = null, data = null) {
		if(!conversation && data) {
			this._createDummyConversation(data);
			return;
		}

		this.conversation = this.modifyConversation(conversation);

		this._openConversationWindow(this.conversation, true);
		this._registerClickEventHandlers();
		this._markAsRead(this.conversation);
	}

	_createDummyConversation(member) {
		let dummyObject = {
			userId: member.id,
			profileImageUrl: member.profileImageUrl ? member.profileImageUrl : IMAGES.AVTAR,
			title: member.displayName,
			isGroup: false,
			isDummyObject: true
		}

		if(member.isOnline)
			dummyObject.status = "online";
		else if(!member.isOnline && member.lastSeen)
			dummyObject.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(member.lastSeen);

		this.conversation = dummyObject;
		this._openConversationWindow(this.conversation, false);
		this._registerClickEventHandlers();
	}

	_openConversationWindow(conversation, loadMessages) {
		// Create Window frame
		let chFrame = document.getElementById("ch_frame");
		let windowAttributes = [{"id":"ch_conv_window"},{"class":"ch-conv-window"}];
		var windowDiv = this.utility.createElement("div", windowAttributes, null, chFrame);

		// Create header
		let headerAttributes = [{"class":"ch-header"}];
		let header = this.utility.createElement("div", headerAttributes, null, windowDiv);

		// Create conversation images div
		let imgAttributes = [{"class":"ch-conversation-image"}];
		let memberImg = this.utility.createElement("div", imgAttributes, null, header);
		memberImg.style.backgroundImage = "url(" + conversation.profileImageUrl + ")";

		// Create conversation details wrapper
		let detailsAttributes = [{"class":"ch-conv-details-wrapper"}];
		let detailsWrapper = this.utility.createElement("div", detailsAttributes, null, header);

		// Create conversation header title
		let titleAttributes = [{"class":"ch-conv-title"}];
		this.utility.createElement("div", titleAttributes, conversation.title, detailsWrapper);

		// Create option button
		let optionAttributes = [{"id":"ch_conv_options"}];
		let optionBtn = this.utility.createElement("i", optionAttributes, "keyboard_arrow_down", detailsWrapper);
		optionBtn.classList.add("material-icons", "ch-conv-options");

		// Create status div
		let statusAttributes = [{"id":"ch_conv_status"},{"class":"ch-conv-status"}];
		let status =this.utility.createElement("div", statusAttributes, conversation.status, detailsWrapper);

		// Create drop down
		let dropDownAttributes = [{"id":"ch_conv_drop_down"},{"class":"ch-conv-drop-down"}];
		let dropDown = this.utility.createElement("div", dropDownAttributes, null, header);

		// Create mute option
		let muteOptionAttributes = [{"id":"ch_conv_mute"},{"class":"ch-conv-mute"}];
		this.utility.createElement("div", muteOptionAttributes, LANGUAGE_PHRASES.MUTE_CONV, dropDown);

		// Create clear option
		let clearOptionAttributes = [{"id":"ch_conv_clear"},{"class":"ch-conv-clear"}];
		this.utility.createElement("div", clearOptionAttributes, LANGUAGE_PHRASES.CLEAR_CONV, dropDown);

		// Create delete option
		let deleteOptionAttributes = [{"id":"ch_conv_delete"},{"class":"ch-conv-delete"}];
		this.utility.createElement("div", deleteOptionAttributes, LANGUAGE_PHRASES.DELETE_CONV, dropDown);

		// Create block user option
		let blockOptionAttributes = [{"id":"ch_conv_block"},{"class":"ch-conv-block"}];
		let blockOption = this.utility.createElement("div", blockOptionAttributes, LANGUAGE_PHRASES.BLOCK_USER, dropDown);

		// Create unblock user option
		let unblockOptionAttributes = [{"id":"ch_conv_unblock"},{"class":"ch-conv-unblock"}];
		let unblockOption = this.utility.createElement("div", unblockOptionAttributes, LANGUAGE_PHRASES.UNBLOCK_USER, dropDown);

		if(!conversation.isGroup) {
			if(conversation.blockedByUser) 
				unblockOption.style.display = "block";
			else
				blockOption.style.display = "block";
		}

		// Create conversation close button
		let closeBtnAttributes = [{"id":"ch_conv_close_btn"},{"title":LANGUAGE_PHRASES.CLOSE}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "close", header);
		closeBtn.classList.add("material-icons", "ch-close-btn");

		// Create message box
		let msgsBoxAttributes = [{"id":"ch_messages_box"},{"class":"ch-messages-box"}];
		let messagesBox = this.utility.createElement("div", msgsBoxAttributes, null, windowDiv);

		// Create snackbar for warnings
		let snackbarAttributes = [{"id":"ch_snackbar"}];
		this.utility.createElement("div", snackbarAttributes, null, windowDiv);

		if(loadMessages) {
			// Create loader container
			let loaderContainerAttributes = [{"id":"ch_conv_loader_container"},{"class":"ch-loader-bg"}];
			let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, messagesBox);
			loaderContainer.style.display = "block";

			// Create loader
			let loaderAttributes = [{"id":"ch_conv_loader"},{"class":"ch-loader"}];
			let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);
		}
		else {
			// Create no message div
			let noMessageDivAttributes = [{"id":"ch_no_msg"},{"class":"ch-no-msg"}];
			this.utility.createElement("div", noMessageDivAttributes, LANGUAGE_PHRASES.NO_MESSAGES_FOUND, messagesBox);
		}

		// Create send message div
		let sendBoxAttributes = [{"id":"ch_send_box"},{"class":"ch-send-box"}];
		let sendBox = this.utility.createElement("div", sendBoxAttributes, null, windowDiv);

		// Create input box
		let inputBoxAttributes = [{"id":"ch_input_box"},{"class":"ch-input-box"}, {"type":"text"}, {"placeholder":LANGUAGE_PHRASES.SEND_MESSAGE}];
		this.utility.createElement("textarea", inputBoxAttributes, null, sendBox);

		// Create media messages docker
		let mediaDockerAttributes = [{"id":"ch_media_docker"},{"class":"ch-media-docker"}];
		let mediaDocker = this.utility.createElement("div", mediaDockerAttributes, null, sendBox);

		// Create image messages option
		let imageOptionAttributes = [{"id":"ch_image_option"},{"class":"ch-image-option"}];
		let imageOption = this.utility.createElement("div", imageOptionAttributes, null, mediaDocker);

		// Create option icon span
		let imageIconSpanAttributes = [{"id":"ch_image_icon_span"},{"class":"ch-image-icon-span"}];
		let imageIconSpan = this.utility.createElement("span", imageIconSpanAttributes, null, imageOption);

		// Create image messages option icon
		let imageIconAttributes = [{"id":"ch_image_option_icon"},{"class":"ch-image-option-icon"},{"src":IMAGES.GALLERY_ICON}];
		this.utility.createElement("img", imageIconAttributes, null, imageIconSpan);

		// Create input for image
		let imageInputAttributes = [{"id":"ch_image_input"},{"class":"ch-image-input"},{"type":"file"},{"accept":"image/*"}];
		this.utility.createElement("input", imageInputAttributes, null, imageOption);

		// Create option name span for image
		let imageNameAttributes = [{"id":"ch_image_option_name"},{"class":"ch-image-option-name"}];
		this.utility.createElement("span", imageNameAttributes, LANGUAGE_PHRASES.IMAGE, imageOption);

		// Create audio messages option
		let audioOptionAttributes = [{"id":"ch_audio_option"},{"class":"ch-audio-option"}];
		let audioOption = this.utility.createElement("div", audioOptionAttributes, null, mediaDocker);

		// Create option icon span
		let audioIconSpanAttributes = [{"id":"ch_audio_icon_span"},{"class":"ch-audio-icon-span"}];
		let audioIconSpan = this.utility.createElement("span", audioIconSpanAttributes, null, audioOption);

		// Create audio messages option icon
		let audioIconAttributes = [{"id":"ch_audio_option_icon"},{"class":"ch-audio-option-icon"},{"src":IMAGES.AUDIO_ICON}];
		this.utility.createElement("img", audioIconAttributes, null, audioIconSpan);

		// Create input for audio
		let audioInputAttributes = [{"id":"ch_audio_input"},{"class":"ch-audio-input"},{"type":"file"},{"accept":"audio/*"}];
		this.utility.createElement("input", audioInputAttributes, null, audioOption);

		// Create option name span for audio
		let audioNameAttributes = [{"id":"ch_audio_option_name"},{"class":"ch-audio-option-name"}];
		this.utility.createElement("span", audioNameAttributes, LANGUAGE_PHRASES.AUDIO, audioOption);

		// Create video messages option
		let videoOptionAttributes = [{"id":"ch_video_option"},{"class":"ch-video-option"}];
		let videoOption = this.utility.createElement("div", videoOptionAttributes, null, mediaDocker);

		// Create option icon span
		let videoIconSpanAttributes = [{"id":"ch_video_icon_span"},{"class":"ch-video-icon-span"}];
		let videoIconSpan = this.utility.createElement("span", videoIconSpanAttributes, null, videoOption);

		// Create video messages option icon
		let videoIconAttributes = [{"id":"ch_video_option_icon"},{"class":"ch-video-option-icon"},{"src":IMAGES.VIDEO_ICON}];
		this.utility.createElement("img", videoIconAttributes, null, videoIconSpan);

		// Create input for video
		let videoInputAttributes = [{"id":"ch_video_input"},{"class":"ch-video-input"},{"type":"file"},{"accept":"video/*"}];
		this.utility.createElement("input", videoInputAttributes, null, videoOption);

		// Create option name span for video
		let videoNameAttributes = [{"id":"ch_video_option_name"},{"class":"ch-video-option-name"}];
		this.utility.createElement("span", videoNameAttributes, LANGUAGE_PHRASES.VIDEO, videoOption);

		// Create attachment button
		let attachmentAttributes = [{"id":"ch_attachment_btn"},{"title":LANGUAGE_PHRASES.SEND_ATTACHMENTS}];
		let attachment = this.utility.createElement("i", attachmentAttributes, "attachment", sendBox);
		attachment.classList.add("material-icons", "ch-attachment-btn");

		// Create send button
		let sendButtonAttributes = [{"id":"ch_send_button"},{"class":"ch-send-button"}];
		let sendButton = this.utility.createElement("button", sendButtonAttributes, null, sendBox);

		// Create send icon
		let sendIconAttributes = [{"class":"ch-send-icon"}];
		let sendIcon = this.utility.createElement("i", sendIconAttributes, "send", sendButton);
		sendIcon.classList.add("material-icons");

		// Hide send message box and status is blocked user
		if(conversation.blockedByUser || conversation.blockedByMember) {
			status.style.visibility = "hidden";
			sendBox.style.visibility = "hidden";
		}

		if(loadMessages)
			this._createMessagesListing(conversation);
	}

	_createMessagesListing(conversation) {
		// Get conversation messages
		this._getMessages(conversation, this.limit, this.skip, (err, messages) => {
			if(err) return console.error(err);

			this.messages = messages;
			// Hide loader
			if(document.getElementById("ch_conv_loader_container"))
				document.getElementById("ch_conv_loader_container").remove();

			let messagesBox = document.getElementById("ch_messages_box");
			if(!messages.length) {
				// Create no message div
				let noMessageDivAttributes = [{"id":"ch_no_msg"},{"class":"ch-no-msg"}];
				this.utility.createElement("div", noMessageDivAttributes, LANGUAGE_PHRASES.NO_MESSAGES_FOUND, messagesBox);
				return;
			}

			this.messages.forEach(message => {
				// Update message object
				message = this._modifyMessage(message);
				this.previousUserId = message.ownerId;

				// Handle meta message
				if(message.contentType == 1) {
					// let metaMessageAttributes = [{"class":"ch-meta-msg"}];
					// this.utility.createElement("div", metaMessageAttributes, "Meta Message", messagesBox);
					return;
				}

				// Create message list
				let msgListAttributes = [{"id":message.id},{"class":"ch-msg-list"}];
				let msgList = this.utility.createElement("div", msgListAttributes, null, messagesBox);

				// Create sender name div
				if(conversation.isGroup && message.ownerId != window.userId) {
					let senderAttributes = [{"class":"ch-sender-name"}];
					this.utility.createElement("div", senderAttributes, message.owner.displayName, msgList);
				}

				// Create message container
				let msgContainerAttributes = [{"class":"ch-msg-container"}];
				let msgContainer = this.utility.createElement("div", msgContainerAttributes, null, msgList);

				// Create message more options
				let moreOptionAttributes = [{"class":"ch-msg-more-option"}];
				let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgList);
				moreOption.classList.add("material-icons");
				this._addListenerOnMoreOption(message, moreOption, msgList);

				// Create message div
				let msgDivAttributes = [{"id":"ch_message_"+message.id},{"class":"ch-message"}];
				let msgDiv = this.utility.createElement("div", msgDivAttributes, message.body, msgContainer);

				// Create media message frame
				this._createMediaMessageFrame(message);

				// Create message time span
				let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
				let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);

				if(message.ownerId == window.userId) {
					msgContainer.classList.add("right");
					moreOption.classList.add("left");
					// Create message read status
					let statusAttributes = [{"id":"ch_msg_status"}];
					let readIcon = message.readStatus == 3 ? "done_all" : "check";
					let msgStatus = this.utility.createElement("i", statusAttributes, readIcon, msgContainer);
					msgStatus.classList.add("material-icons", "ch-msg-status");
				}
				else{
					msgContainer.classList.add("left");
					moreOption.classList.add("right");
				}
			});
			messagesBox.scrollTop = messagesBox.scrollHeight;
		});
	}

	modifyConversation(conversation) {
		if(!conversation.isGroup) {
			// Set conversation title and image
			let member = conversation.membersList.find(member => member.userId != window.userId);
			conversation.title = member.user.displayName;
			conversation.profileImageUrl = member.user.profileImageUrl ? member.user.profileImageUrl : IMAGES.AVTAR;

			if(member.user.isOnline)
				conversation.status = LANGUAGE_PHRASES.ONLINE;
			else if(!member.user.isOnline && member.user.lastSeen)
				conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(member.user.lastSeen);
		}
		else {
			conversation.status = conversation.memberCount + " " + LANGUAGE_PHRASES.MEMBERS;

		}
		return conversation;
	}

	_loadMoreMessages() {
		++this.loadCount;
		this.skip = this.loadCount * this.limit;
		this._getMessages(this.conversation, this.limit, this.skip, (err, messages) => {
			if(err) return console.error(err);

			if(!messages && messages[0].chatId != this.conversation.id)
				return;

			messages.reverse();
			this.messages = this.messages.concat(messages);

			// Save first message to scroll
			let messagesBox = document.getElementById("ch_messages_box");
			let firstMessage = messagesBox.childNodes[0];

			messages.forEach(message => {

				// Remove meta message
				if(message.contentType == 1)
					return;

				// Update message object
				message = this._modifyMessage(message);

				// Create message list
				let msgListAttributes = [{"id":message.id},{"class":"ch-msg-list"}];
				let msgList = this.utility.createElement("div", msgListAttributes, null, null);

				// Create message container
				let msgContainerAttributes = [{"class":"ch-msg-container"}];
				let msgContainer = this.utility.createElement("div", msgContainerAttributes, null, msgList);

				// Create message more options
				let moreOptionAttributes = [{"class":"ch-msg-more-option"}];
				let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgList);
				moreOption.classList.add("material-icons");
				this._addListenerOnMoreOption(message, moreOption, msgList);

				// Create message div
				let msgDivAttributes = [{"id":"ch_message_"+message.id},{"class":"ch-message"}];
				let msgDiv = this.utility.createElement("div", msgDivAttributes, message.body, msgContainer);

				// Create media message frame
				this._createMediaMessageFrame(message);

				// Create message time span
				let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
				let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);

				if(message.ownerId == window.userId) {
					msgContainer.classList.add("right");
					moreOption.classList.add("left");
					// Create message read status
					let statusAttributes = [{"id":"ch_msg_status"}];
					let readIcon = message.readStatus == 3 ? "done_all" : "check";
					let msgStatus = this.utility.createElement("i", statusAttributes, readIcon, msgContainer);
					msgStatus.classList.add("material-icons", "ch-msg-status");
				}
				else {
					msgContainer.classList.add("left");
					moreOption.classList.add("right");
				}

				messagesBox.insertBefore(msgList, messagesBox.childNodes[0]);
			});
			if(firstMessage) {
				firstMessage.scrollIntoView();
			}
		});

	}

	_registerClickEventHandlers() {
		// Close conversation button listener
		let closeBtn = document.getElementById("ch_conv_close_btn");
		closeBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_window").remove();
			this.widget.convWindows.pop();
		});

		// Conversation option listener
		let optionBtn = document.getElementById("ch_conv_options");
		optionBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
		});

		// Conversation mute listener
		let muteBtn = document.getElementById("ch_conv_mute");
		muteBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
			this.muteConversation();
		});

		// Conversation clear listener
		let clearBtn = document.getElementById("ch_conv_clear");
		clearBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
			this.clearConversation();
		});

		// Conversation delete listener
		let deleteBtn = document.getElementById("ch_conv_delete");
		deleteBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
			this.deleteConversation();
		});

		// Member block listener
		let blockBtn = document.getElementById("ch_conv_block");
		if(blockBtn) {
			blockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.blockMember(this.conversation.member.userId, (err, res) => {
					if(err) return console.error(err);
				});
			});
		}

		// Member unblock listener
		let unblockBtn = document.getElementById("ch_conv_unblock");
		if(unblockBtn) {
			unblockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.unblockMember(this.conversation.member.userId, (err, res) => {
					if(err) return console.error(err);
				});
			});
		}

		// Send message on Enter press
		let input = document.getElementById("ch_input_box");
		input.addEventListener("keydown", (data) => {
			if(data.keyCode === 13) {
				data.preventDefault();
				this.sendMessage("text");
			}
		});

		// Send button listener
		let sendButton = document.getElementById("ch_send_button");
		sendButton.addEventListener("click", (data) => {
			this.sendMessage("text");
		});

		// Scroll message box listener
		let msgBox = document.getElementById("ch_messages_box");
		msgBox.addEventListener("scroll", (data) => {
			if(msgBox.scrollTop == 0)
				this._loadMoreMessages();
		});

		// Attachment button listener
		let attachmentBtn = document.getElementById("ch_attachment_btn");
		attachmentBtn.addEventListener("click", (data) => {
			document.getElementById("ch_media_docker").classList.toggle("ch-show-docker");
		});

		// Send message on image choose
		let imageInput = document.getElementById("ch_image_input");
		imageInput.addEventListener("change", (data) => {
			if(data.target.files[0].size > 25000000)
				this._showSnackbar(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
			else
				this.sendMessage("image");
		});

		// Send message on audio choose
		let audioInput = document.getElementById("ch_audio_input");
		audioInput.addEventListener("change", (data) => {
			if(data.target.files[0].size > 25000000)
				this._showSnackbar(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
			else
				this.sendMessage("audio");
		});

		// Send message on video choose
		let videoInput = document.getElementById("ch_video_input");
		videoInput.addEventListener("change", (data) => {
			if(data.target.files[0].size > 25000000)
				this._showSnackbar(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
			else
				this.sendMessage("video");
		});
	}

	_showSnackbar(text) {
		// Show size limit exceed message
		let snackbar = document.getElementById("ch_snackbar");
		snackbar.innerText = text;
		snackbar.className = "show";
		setTimeout(function() {
			snackbar.className = snackbar.className.replace("show", "");
		}, 3000);
	}

	sendMessage(msgType) {
		// Hide file picker
		document.getElementById("ch_media_docker").classList.remove("ch-show-docker");

		if(msgType == "text") {
			let inputValue = document.getElementById("ch_input_box").value;
			document.getElementById("ch_input_box").value = "";

			if(!inputValue.trim())
				return;

			if(this.conversation.isDummyObject) {
				this.chAdapter.sendTextMessageToUser(this.conversation.userId, inputValue, (err, res) => {
					if(err) return console.error(err);
				});
			}
			else {
				this.chAdapter.sendTextMessage(this.conversation, inputValue, [], (err, res) => {
					if(err) return console.error(err);
				});
			}
		}
		else if(msgType == "image") {
			let file = document.getElementById("ch_image_input").files[0];

			this.chAdapter.sendFileMessage(this.conversation, file, true, (err, message) => {
				if(err) return console.error(err);
			});
		}
		else if(msgType == "audio") {
			let file = document.getElementById("ch_audio_input").files[0];

			this.chAdapter.sendFileMessage(this.conversation, file, true, (err, message) => {
				if(err) return console.error(err);
			});
		}
		else if(msgType == "video") {
			let file = document.getElementById("ch_video_input").files[0];

			this.chAdapter.sendFileMessage(this.conversation, file, true, (err, message) => {
				if(err) return console.error(err);
			});
		}
	}

	muteConversation() {
		this.chAdapter.muteConversation(this.conversation, (err, res) => {
			if(err) return console.error(err);
		});
	}

	clearConversation() {
		this.chAdapter.clearConversation(this.conversation, (err, res) => {
			if(err) return console.error(err);
		});
	}

	deleteConversation() {
		this.chAdapter.deleteConversation(this.conversation, (err, res) => {
			if(err) return console.error(err);
		});
	}

	_getMessages(conversation, limit, skip, cb) {
		this.chAdapter.getMessages(conversation, limit, skip, (err, messages) => {
			if(err) return cb(err);

			messages.reverse();
			return cb(null, messages);
		});
	}

	_modifyMessage(message) {
		if(!message)
			return;

		let member = message.recipients.find(member => member.recipientId == window.userId);
    message.createdAt = this.utility.updateTimeFormat(member.createdAt);
    message.readStatus = member.status;

    if(message.isDeleted)
    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;

    return message;
  }

  _markAsRead(conversation) {
  	this.chAdapter.markAsReadConversation(conversation, (err, res) => {
  		if(err) return console.error(err);
  	});
  }

  addNewMessage(message) {
  	let messagesBox = document.getElementById("ch_messages_box");
		if(message.chatId != this.conversation.id || !messagesBox)
			return;

		message.createdAt = this.utility.updateTimeFormat(Date());

		// Remove no message tag
		if(messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_msg")
			messagesBox.firstChild.remove();

		// Create message list
		let msgListAttributes = [{"id":message.id},{"class":"ch-msg-list"}];
		let msgList = this.utility.createElement("div", msgListAttributes, null, messagesBox);

		// Create message container
		let msgContainerAttributes = [{"class":"ch-msg-container"}];
		let msgContainer = this.utility.createElement("div", msgContainerAttributes, null, msgList);

		// Create message more options
		let moreOptionAttributes = [{"class":"ch-msg-more-option"}];
		let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgList);
		moreOption.classList.add("material-icons");
		this._addListenerOnMoreOption(message, moreOption, msgList);

		// Create message div
		let msgDivAttributes = [{"id":"ch_message_"+message.id},{"class":"ch-message"}];
		let msgDiv = this.utility.createElement("div", msgDivAttributes, message.body, msgContainer);

		// Create media message frame
		this._createMediaMessageFrame(message);

		// Create message time span
		let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
		let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);


		if(message.ownerId == window.userId) {
			msgContainer.classList.add("right");
			moreOption.classList.add("left");
			// Create message read status
			let statusAttributes = [{"id":"ch_msg_status"}];
			let readIcon = message.readStatus == 3 ? "done_all" : "check";
			let msgStatus = this.utility.createElement("i", statusAttributes, readIcon, msgContainer);
			msgStatus.classList.add("material-icons", "ch-msg-status");
		}
		else {
			msgContainer.classList.add("left");
			moreOption.classList.add("right");

			// Message mark a read
			this._markAsRead(this.conversation);
		}

		// Scroll to new message
		if(messagesBox)
			messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  updateStatus(user) {
  	if(this.conversation.isGroup || (this.conversation.member && this.conversation.member.userId != user.id))
  		return;

  	if(user.isOnline) {
  		this.conversation.status = LANGUAGE_PHRASES.ONLINE;
  	}
  	else if(!user.isOnline && user.lastSeen) {
  		this.conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(user.lastSeen);
  	}
  	document.getElementById("ch_conv_status").innerText = this.conversation.status;
  }

	_createMediaMessageFrame(message) {
  	let messageBox = document.getElementById("ch_message_"+message.id);

  	// Create message div
  	if(!message.contentType && message.attachmentType != "text") {
  		let attachmentData = Object.keys(message.attachment).length != 0 ? message.attachment : message.fileData;

  		if(message.attachmentType == "audio") {
  			let audioMsgAttributes = [{"id":"ch_audio_message"},{"class":"ch-audio-message"},{"src":attachmentData.fileUrl}];
				let audioTag = this.utility.createElement("audio", audioMsgAttributes, null, messageBox);
				audioTag.setAttribute("controls",true);
  		}
  		else if(message.attachmentType == "video") {
  			let videoMsgAttributes = [{"id":"ch_video_message"},{"class":"ch-video-message"}];
				let videoMessage = this.utility.createElement("div", videoMsgAttributes, null, messageBox);
				videoMessage.style.backgroundImage = "url(" + attachmentData.thumbnailUrl + ")";

				// Create play icon
				let playIconAttributes = [{"id":"ch_play_icon"}];
				let playIcon = this.utility.createElement("i", playIconAttributes, "play_circle_outline", videoMessage);
				playIcon.classList.add("material-icons", "ch-play-icon");

				// Set video message listener
				videoMessage.addEventListener("click", data => {
					window.open(attachmentData.fileUrl, "_blank");
				});
  		}
  		else {
  			let imageMsgAttributes = [{"id":"ch_image_message"},{"class":"ch-image-message"}];
				let imageMsg = this.utility.createElement("div", imageMsgAttributes, null, messageBox);
				imageMsg.style.backgroundImage = "url(" + attachmentData.thumbnailUrl + ")";

				// Set image message listener
				imageMsg.addEventListener("click", data => {
					window.open(attachmentData.fileUrl, "_blank");
				});
  		}
  	}
  	else if(message.contentType == 2) {
  		let stickerMsgAttributes = [{"id":"ch_sticker_message"},{"class":"ch-sticker-message"}];
			let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, messageBox);
			stickerMsg.style.backgroundImage = "url(" + message.originalUrl + ")";

  	}
  	else if(message.contentType == 3) {
  		let locationSrc = SETTINGS.LOCATION_IMG_URL + "?center=" +
  		message.data.latitude + "," + message.data.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
  		message.data.latitude + "," + message.data.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;

  		let locationMsgAttributes = [{"id":"ch_location_message"},{"class":"ch-location-message"}];
		let locationMsg = this.utility.createElement("div", locationMsgAttributes, null, messageBox);
		locationMsg.style.backgroundImage = "url(" + locationSrc + ")";

		// Set location message listener
		locationMsg.addEventListener("click", data => {
			let mapUrl = "https://www.google.com/maps?z=15&t=m&q=loc:"+message.data.latitude+","+message.data.longitude;
			window.open(mapUrl, "_blank");
		});
  	}
  }

  _addListenerOnMoreOption(message, moreOption, msgList) {

		moreOption.addEventListener("click", (data) => {
			if(document.getElementById("ch_msg_option_container")) {
				document.getElementById("ch_msg_option_container").remove();
				return;
			}

			// Create message options container
			let msgOptionsContainerAttributes = [{"id":"ch_msg_option_container"},{"class":"ch-msg-option-container"}];
			let msgOptionsContainer = this.utility.createElement("div", msgOptionsContainerAttributes, null, msgList);

			if(message.ownerId == window.userId)
				msgOptionsContainer.style.left = "15px";
			else
				msgOptionsContainer.style.right = "15px";

			// Create delete message for me option
			let deleteMsgAttributes = [{"class":"ch-msg-delete-for-me"}];
			let deleteMsgOption = this.utility.createElement("div", deleteMsgAttributes, LANGUAGE_PHRASES.DELETE_FOR_ME, msgOptionsContainer);

			// Add listener on delete message for me
			deleteMsgOption.addEventListener("click", (data) => {
				msgOptionsContainer.remove();

				// Delete message for me
				this.chAdapter.deleteMessagesForMe([message.id], (err, res) => {
					if(err) console.error(err);
				})
			});

			if(!message.isDeleted && message.ownerId == window.userId) {
				// Create delete message for everyone option
				let deleteMsgEveryoneAttributes = [{"id":"ch_msg_delete_for_everyone"},{"class":"ch-msg-delete-for-everyone"}];
				let deleteMsgEveryoneOption = this.utility.createElement("div", deleteMsgEveryoneAttributes, LANGUAGE_PHRASES.DELETE_FOR_EVERYONE, msgOptionsContainer);

				// Add listener on delete message for everyone
				deleteMsgEveryoneOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();

					// Delete message for me
					this.chAdapter.deleteMessagesForEveryone([message.id], (err, res) => {
						if(err) console.error(err);
					})
				});
			}
		});
  }

  updateDeleteForEveryoneMsg(msgData) {
  	// Update text of deleted message
  	let convTargetMsg = document.getElementById("ch_message_" + msgData.deletedIds[0]);
			if(convTargetMsg) {
				convTargetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
			}

		// Update listener of deleted message
  	let deletedMsgOptionBtn = document.getElementById(msgData.deletedIds[0]).lastChild;
  	deletedMsgOptionBtn.addEventListener("click", data => {
  		// Remove delete for everyone option
  		let deleteForEveryoneBtn = document.getElementById("ch_msg_delete_for_everyone");
  		if(deleteForEveryoneBtn) {
  			deleteForEveryoneBtn.remove();
  		}
  	});
  }

  handleBlock(self, userId) {
  	document.getElementById("ch_conv_block").style.display = "none";;
  	document.getElementById("ch_conv_unblock").style.display = "block";
  	document.getElementById("ch_conv_status").style.visibility = "hidden";
		document.getElementById("ch_send_box").style.visibility = "hidden";
  }

  handleUnblock(self, userId) {
  	document.getElementById("ch_conv_unblock").style.display = "none";
  	document.getElementById("ch_conv_block").style.display = "block";
  	document.getElementById("ch_conv_status").style.visibility = "visible";
		document.getElementById("ch_send_box").style.visibility = "visible";
  }
}

export { ConversationWindow as default };