import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
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
		this.messages = [];
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
		let headerTitle = this.utility.createElement("div", titleAttributes, conversation.title, detailsWrapper);

		if(this.conversation.isGroup) {
			headerTitle.addEventListener("click", (data) => {
				this.widget.loadConversationMembers(this.conversation.id);
			});
		}

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

		// Create clear option
		let clearOptionAttributes = [{"id":"ch_conv_clear"},{"class":"ch-conv-clear"}];
		this.utility.createElement("div", clearOptionAttributes, LANGUAGE_PHRASES.CLEAR_CONV, dropDown);

		// Create delete option
		let deleteOptionAttributes = [{"id":"ch_conv_delete"},{"class":"ch-conv-delete"}];
		this.utility.createElement("div", deleteOptionAttributes, LANGUAGE_PHRASES.DELETE_CONV, dropDown);

		// Create block user option
		let blockOptionAttributes = [{"id":"ch_conv_block"}];
		let blockOption = this.utility.createElement("div", blockOptionAttributes, LANGUAGE_PHRASES.BLOCK_USER, dropDown);
		blockOption.style.display = "none";

		// Create unblock user option
		let unblockOptionAttributes = [{"id":"ch_conv_unblock"}];
		let unblockOption = this.utility.createElement("div", unblockOptionAttributes, LANGUAGE_PHRASES.UNBLOCK_USER, dropDown);
		unblockOption.style.display = "none";

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
		this._getMessages(conversation, this.limit, this.skip, null, null, null, null, (err, messages) => {
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

				if(message.type == "admin") {
					let metaMessageAttributes = [{"class":"ch-admin-msg"}];
					this.utility.createElement("div", metaMessageAttributes, message.body, messagesBox);
					return;
				}

				// Create message list
				let msgListAttributes = [{"id":message.id},{"class":"ch-msg-list"}];
				let msgList = this.utility.createElement("div", msgListAttributes, null, messagesBox);

				// Create sender name div
				if(conversation.isGroup && message.ownerId != this.widget.userId) {
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
				this._createMediaMessageFrame(message, msgDiv);

				// Create message time span
				let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
				let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);

				if(message.ownerId == this.widget.userId) {
					msgContainer.classList.add("right");
					moreOption.classList.add("left");
					// Create message read status
					let statusAttributes = [{"id":"ch_msg_status"}];
					let readIcon = message.readByAll ? "done_all" : "check";
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
		if(!conversation || conversation.isModified)
			return conversation;

		if (!conversation.isGroup && conversation.user && Object.entries(conversation.user).length === 0) {
			conversation.title = LANGUAGE_PHRASES.DELETED_MEMBER;
			conversation.profileImageUrl = IMAGES.AVTAR;
			return conversation;
    	}

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
			conversation.blockedByMember = member ? false : true;

			if(!conversation.isActive) {
				conversation.blockedByUser = true;
			}

			if(conversation.user.isOnline) {
				conversation.status = LANGUAGE_PHRASES.ONLINE;
			}
			else {
				conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(member.user.lastSeen);
			}
		}
		return conversation;
	}

	_loadMoreMessages() {
		++this.loadCount;
		this.skip = this.loadCount * this.limit;
		this._getMessages(this.conversation, this.limit, this.skip, null, null, null, null, (err, messages) => {
			if(err) return console.error(err);

			if(!messages && messages[0].conversationId != this.conversation.id)
				return;

			this.messages = this.messages.concat(messages);

			// Save first message to scroll
			let messagesBox = document.getElementById("ch_messages_box");
			let firstMessage = messagesBox.childNodes[0];

			messages.forEach(message => {

				// Update message object
				message = this._modifyMessage(message);

				if(message.type == "admin") {
					let metaMessageAttributes = [{"class":"ch-admin-msg"}];
					this.utility.createElement("div", metaMessageAttributes, message.body, messagesBox);
					return;
				}

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
				this._createMediaMessageFrame(message, msgDiv);

				// Create message time span
				let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
				let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);

				if(message.ownerId == this.widget.userId) {
					msgContainer.classList.add("right");
					moreOption.classList.add("left");
					// Create message read status
					let statusAttributes = [{"id":"ch_msg_status"}];
					let readIcon = message.readByAll ? "done_all" : "check";
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

		// Conversation option button listener
		let optionBtn = document.getElementById("ch_conv_options");
		optionBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
		});

		// Conversation clear button listener
		let clearBtn = document.getElementById("ch_conv_clear");
		clearBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
			this.clearConversation();
		});

		// Conversation delete button listener
		let deleteBtn = document.getElementById("ch_conv_delete");
		deleteBtn.addEventListener("click", (data) => {
			document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
			this.deleteConversation();
		});

		// Member block  button listener
		let blockBtn = document.getElementById("ch_conv_block");
		if(blockBtn) {
			blockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.blockMember(this.conversation.user.id, (err, res) => {
					if(err) return console.error(err);
				});
			});
		}

		// Member unblock button listener
		let unblockBtn = document.getElementById("ch_conv_unblock");
		if(unblockBtn) {
			unblockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.unblockMember(this.conversation.user.id, (err, res) => {
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
			if(data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
			}
			else
				this.sendMessage("image");
		});

		// Send message on audio choose
		let audioInput = document.getElementById("ch_audio_input");
		audioInput.addEventListener("change", (data) => {
			if(data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
			}
			else
				this.sendMessage("audio");
		});

		// Send message on video choose
		let videoInput = document.getElementById("ch_video_input");
		videoInput.addEventListener("change", (data) => {
			if(data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
			}
			else
				this.sendMessage("video");
		});
	}

	sendMessage(msgType) {
		// Hide file picker
		document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
		let messagesBox = document.getElementById("ch_messages_box");

		// Show loader image if media message
		if(msgType != "text") {
			if(document.getElementById("ch_no_msg"))
				document.getElementById("ch_no_msg").remove();

			let msgLoaderAttributes = [{"id":"ch_msg_loader"},{"class":"ch-msg-loader"}];
			let imageMsg = this.utility.createElement("div", msgLoaderAttributes, null, messagesBox);
			imageMsg.style.backgroundImage = "url(" + IMAGES.MESSAGE_LOADER + ")";
			imageMsg.scrollIntoView();
		}

		if(msgType == "text") {
			let inputValue = document.getElementById("ch_input_box").value;
			document.getElementById("ch_input_box").value = "";

			if(!inputValue.trim())
				return;

			let data = {
				id : uuid(),
				type : "normal",
				body : inputValue
			}

			// Add pending message into list
			this.addPendingMessage(data);

			if(this.conversation.isDummyObject) {
				data['userId'] = this.conversation.userId;

				this.chAdapter.sendMessageToUser(data, (err, res) => {
					if(err) return console.error(err);
				});
			}
			else {
				this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
					if(err) return console.error(err);
				});
			}
		}
		else if(msgType == "image") {
			let file = document.getElementById("ch_image_input").files[0];

			// Upload file on channelize server
			this.chAdapter.uploadFile(file, true, (err, fileData) => {
				if(err) return console.error(err);

				this._sendFileMessage(fileData);
			});
		}
		else if(msgType == "audio") {
			let file = document.getElementById("ch_audio_input").files[0];

			// Upload file on channelize server
			this.chAdapter.uploadFile(file, true, (err, fileData) => {
				if(err) return console.error(err);

				this._sendFileMessage(fileData);
			});
		}
		else if(msgType == "video") {
			let file = document.getElementById("ch_video_input").files[0];
			// Upload file on channelize server
			this.chAdapter.uploadFile(file, true, (err, fileData) => {
				if(err) return console.error(err);

				this._sendFileMessage(fileData);
			});
		}
	}

	_sendFileMessage(fileData) {
		fileData.type = fileData.attachmentType;

		let data = {
			id : uuid(),
			type : "normal",
			attachments : [fileData]
		}

		// Send file message as attachment
		if(this.conversation.isDummyObject) {
			data['userId'] = this.conversation.userId;
			this.chAdapter.sendMessageToUser(data, (err, message) => {
				if(err) return console.error(err);
			});
		}
		else {
			this.chAdapter.sendMessage(this.conversation, data, (err, message) => {
				if(err) return console.error(err);
			});
		}
	}

	addPendingMessage(msgData) {
		msgData["ownerId"] = this.widget.userId;
		let messagesBox = document.getElementById("ch_messages_box");

		// Remove no message tag
		if(messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_msg") {
			messagesBox.firstChild.remove();
		}

		// Create message list
		let msgListAttributes = [{"id":msgData.id},{"class":"ch-msg-list"}];
		let msgList = this.utility.createElement("div", msgListAttributes, null, messagesBox);

		// Create message container
		let msgContainerAttributes = [{"class":"ch-msg-container"}];
		let msgContainer = this.utility.createElement("div", msgContainerAttributes, null, msgList);
		msgContainer.classList.add("right");

		// Create message more options
		let moreOptionAttributes = [{"class":"ch-msg-more-option"}];
		let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgList);
		moreOption.classList.add("material-icons", "left");
		this._addListenerOnMoreOption(msgData, moreOption, msgList);

		// Create message div
		let msgDivAttributes = [{"id":"ch_message_"+msgData.id},{"class":"ch-message"}];
		let msgDiv = this.utility.createElement("div", msgDivAttributes, msgData.body, msgContainer);

		// Create message time span
		let date = new Date();
		date = date.toISOString();
		let createdAt = this.utility.updateTimeFormat(date);
		let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
		let msgTime = this.utility.createElement("span", msgTimeAttributes, createdAt, msgContainer);		
		
		// Create message read status
		let statusAttributes = [{"id":"ch_msg_status"}];
		let msgStatus = this.utility.createElement("i", statusAttributes, "schedule", msgContainer);
		msgStatus.classList.add("material-icons", "ch-msg-status");

		// Scroll to newly added dummy message
		messagesBox.scrollTop = messagesBox.scrollHeight;
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

	_getMessages(conversation, limit, skip, ids, types, attachmentTypes, ownerIds, cb) {
		this.chAdapter.getMessages(conversation, limit, skip,  ids, types, attachmentTypes, ownerIds, (err, messages) => {
			if(err) return cb(err);

			messages.reverse();
			return cb(null, messages);
		});
	}

	_modifyMessage(message) {
		if(!message)
			return message;

		// Handle meta message
		if(message.type == "admin") {

			// adminMessageType
			switch(message.body) {
				case "admin_group_create" :
					message.body = LANGUAGE_PHRASES.GROUP_CREATED;
					break;

				case "admin_group_change_photo" :
					message.body = LANGUAGE_PHRASES.GROUP_PHOTO_CHANGED;
					break;

				case "admin_group_change_title" :
					message.body = LANGUAGE_PHRASES.GROUP_TITLE_CHANGED;
					break;

				case "admin_group_add_members" :
					message.body = LANGUAGE_PHRASES.GROUP_MEMBER_ADDED;
					break;

				case "admin_group_remove_members" :
					message.body = LANGUAGE_PHRASES.GROUP_MEMBER_REMOVED;
					break;

				case "admin_group_make_admin" :
					message.body = LANGUAGE_PHRASES.GROUP_ADMIN_UPDATED;
					break;
			}
			return message;
		}

		// Set read status of message
		if(!this.conversation.isDummyObject) {
			message.readByAll = this.chAdapter.readByAllMembers(this.conversation, message);
		}

	    message.createdAt = this.utility.updateTimeFormat(message.createdAt);

	    if(message.isDeleted) {
	    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
	    }

	    return message;
	}

	_markAsRead(conversation) {
		let currentDate = new Date();
		let timestamp = currentDate.toISOString();
	  	this.chAdapter.markAsReadConversation(conversation, timestamp, (err, res) => {
	  		if(err) return console.error(err);
	  	});
	}

	addNewMessage(message, newConversation) {
		// Set new conversation to replace dummy conversation
		if(newConversation) {
			this.conversation = newConversation;
		}

		message = this._modifyMessage(message);
		this.messages.push(message);

		// Remove pending dummy message
		let dummyMessage = document.getElementById(message.id);
		if(dummyMessage) {
			dummyMessage.remove();
		}

		let messagesBox = document.getElementById("ch_messages_box");
		if(message.type == "admin") {
			let metaMessageAttributes = [{"class":"ch-admin-msg"}];
			this.utility.createElement("div", metaMessageAttributes, message.body, messagesBox);
			return;
		}

		// Hide message loader
		if(document.getElementById("ch_msg_loader") && message.ownerId == this.widget.userId) {
			document.getElementById("ch_msg_loader").remove();
		}

		if(message.conversationId != this.conversation.id || !messagesBox)
			return;

		message.createdAt = this.utility.updateTimeFormat(Date());

		// Remove no message tag
		if(messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_msg") {
			messagesBox.firstChild.remove();
		}

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
		this._createMediaMessageFrame(message, msgDiv);

		// Create message time span
		let msgTimeAttributes = [{"id":"ch_msg_time"},{"class":"ch-msg-time"}];
		let msgTime = this.utility.createElement("span", msgTimeAttributes, message.createdAt, msgContainer);


		if(message.ownerId == this.widget.userId) {
			msgContainer.classList.add("right");
			moreOption.classList.add("left");
			// Create message read status
			let statusAttributes = [{"id":"ch_msg_status"}];
			let readIcon = message.readByAll ? "done_all" : "check";
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

	updateMsgStatus(data) {
		if(data.conversation.id != this.conversation.id)
			return;

		if(!this.conversation.isGroup) {
			if(this.messages[this.messages.length-2].readByAll) {
				let lastMessage = this.messages[this.messages.length-1];
				lastMessage.readByAll = true;

				// Update read tag icon
				let msgDiv = document.getElementById(lastMessage.id);
				if(msgDiv) {
					let statusDiv = msgDiv.querySelector("#ch_msg_status");

					if(statusDiv) {
						statusDiv.innerHTML = "done_all";
					}
				}
			}
			else {
				this.messages.forEach(msg => {
					msg.readByAll = true;

					// Update read tag icon
					let msgDiv = document.getElementById(msg.id);
					if(msgDiv) {
						let statusDiv = msgDiv.querySelector("#ch_msg_status");

						if(statusDiv) {
							statusDiv.innerHTML = "done_all";
						}
					}
				});
			}
		}
	}

	updateUserStatus(user) {
		if(this.conversation.isGroup || !this.conversation.user || (this.conversation.user.id != user.id))
			return;

		if(user.isOnline) {
			this.conversation.status = LANGUAGE_PHRASES.ONLINE;
		}
		else if(!user.isOnline && user.lastSeen) {
			this.conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(user.lastSeen);
		}
		document.getElementById("ch_conv_status").innerText = this.conversation.status;
	}

	_createMediaMessageFrame(message, parentDiv) {

	  	// Create message div
	  	if(!message.body && Object.keys(message.attachments).length != 0) {
	  		message.attachments.forEach(attachment => {

		  		if(attachment.type == "audio") {
		  			let audioMsgAttributes = [{"id":"ch_audio_message"},{"class":"ch-audio-message"},{"src":attachment.fileUrl}];
					let audioTag = this.utility.createElement("audio", audioMsgAttributes, null, parentDiv);
					audioTag.setAttribute("controls",true);
		  		}
		  		else if(attachment.type == "video") {
		  			let videoMsgAttributes = [{"id":"ch_video_message"},{"class":"ch-video-message"}];
					let videoMessage = this.utility.createElement("div", videoMsgAttributes, null, parentDiv);
					videoMessage.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

					// Create play icon
					let playIconAttributes = [{"id":"ch_play_icon"}];
					let playIcon = this.utility.createElement("i", playIconAttributes, "play_circle_outline", videoMessage);
					playIcon.classList.add("material-icons", "ch-play-icon");

					// Set video message listener
					videoMessage.addEventListener("click", data => {
						window.open(attachment.fileUrl, "_blank");
					});
		  		}
		  		else if(attachment.type == "sticker") {
		  			let stickerMsgAttributes = [{"id":"ch_sticker_message"},{"class":"ch-sticker-message"}];
					let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, parentDiv);
					stickerMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
		  		}
		  		else if(attachment.type == "gif") {
		  			let stickerMsgAttributes = [{"id":"ch_gif_message"},{"class":"ch-sticker-message"}];
					let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, parentDiv);
					stickerMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
		  		}
		  		else if(attachment.type == "location") {
		  			let locationSrc = SETTINGS.LOCATION_IMG_URL + "?center=" +
			  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
			  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;

			  		let locationMsgAttributes = [{"id":"ch_location_message"},{"class":"ch-location-message"}];
					let locationMsg = this.utility.createElement("div", locationMsgAttributes, null, parentDiv);
					locationMsg.style.backgroundImage = "url(" + locationSrc + ")";

					// Set location message listener
					locationMsg.addEventListener("click", data => {
						let mapUrl = "https://www.google.com/maps?z=15&t=m&q=loc:"+attachment.latitude+","+attachment.longitude;
						window.open(mapUrl, "_blank");
					});
		  		}
		  		else {
		  			let imageMsgAttributes = [{"id":"ch_image_message"},{"class":"ch-image-message"}];
					let imageMsg = this.utility.createElement("div", imageMsgAttributes, null, parentDiv);
					imageMsg.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

					// Set image message listener
					imageMsg.addEventListener("click", data => {
						window.open(attachment.fileUrl, "_blank");
					});
		  		}
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

			if(message.ownerId == this.widget.userId)
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

			if(!message.isDeleted && message.ownerId == this.widget.userId) {
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

	updateDeleteForEveryoneMsg(data) {
		if(this.conversation.id != data.conversation.id)
			return;

	  	// Update text of deleted message
	  	let convTargetMsg = document.getElementById("ch_message_" + data.messages[0].id);
		if(convTargetMsg) {
			convTargetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
		}

		// Update listener of deleted message
	  	let deletedMsgOptionBtn = document.getElementById(data.messages[0].id).lastChild;
	  	deletedMsgOptionBtn.addEventListener("click", data => {
	  		// Remove delete for everyone option
	  		let deleteForEveryoneBtn = document.getElementById("ch_msg_delete_for_everyone");
	  		if(deleteForEveryoneBtn) {
	  			deleteForEveryoneBtn.remove();
	  		}
	  	});
	}

	handleBlock(data) {
		if(this.conversation.isGroup)
			return;

		if(this.conversation.user.id == data.blockee.id) {
			document.getElementById("ch_conv_block").style.display = "none";;
			document.getElementById("ch_conv_unblock").style.display = "block";
		}

		// Hide status and input field
		document.getElementById("ch_conv_status").style.visibility = "hidden";
		document.getElementById("ch_send_box").style.visibility = "hidden";
	}

	handleUnblock(data) {
		if(this.conversation.isGroup)
			return;

		if(this.conversation.user.id == data.unblockee.id) {
			document.getElementById("ch_conv_unblock").style.display = "none";
	  		document.getElementById("ch_conv_block").style.display = "block";
		}

		// Show status and input field
		document.getElementById("ch_conv_status").style.visibility = "visible";
		document.getElementById("ch_send_box").style.visibility = "visible";
	}

  	handleClearConversation(conv) {
  		if(conv.id != this.conversation.id)
  			return;

  		document.getElementById("ch_messages_box").innerHTML = "";
  	}
}

export { ConversationWindow as default };