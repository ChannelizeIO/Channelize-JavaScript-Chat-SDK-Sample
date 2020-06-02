import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
import { LANGUAGE_PHRASES, IMAGES, SETTINGS, ICONS } from "../constants.js";

class ConversationWindow {

	constructor(widget) {
		// Initialize dependencies
		this.chAdapter = widget.chAdapter;
		this.widget = widget;
		this.utility = new Utility();

		this.loadCount = 0;
		this.limit = 25;
		this.skip = 0;
		this.allowThreadMessage = SETTINGS.ALLOW_MESSAGE_THREADING;
		this.messages = [];
		this.replyMessage = {};

		// Message reactions config
		this.reactionsSetting= SETTINGS.REACTION_SETTINGS;
		this.reactionsTypes = [];
		this.enableScrolling = false;
		this.scrollMenuWidth = 0;
	}

	init(conversation = null, data = null) {
		if (!conversation && data) {
			this._createDummyConversation(data);
			return;
		}

		this.conversation = this.modifyConversation(conversation);
		this._openConversationWindow(this.conversation, true);
		this._registerClickEventHandlers();
		this._markAsRead(this.conversation);
		this.widget.handleConversationEvents(this.conversation);
		this._createReactionScrollMenuData();
	}

	_createReactionScrollMenuData() {
		// Get Reaction types
		let reactionsTypes = [];
    for(var type of Object.keys(this.reactionsSetting.types)) {
      reactionsTypes.push({name: type, icon: this.reactionsSetting.types[type]})
    }
    this.reactionsTypes = reactionsTypes;

    // Get reaction menu width
		let scrollMenuWidth = this.reactionsTypes.length * 50;
		if(scrollMenuWidth > 200) {
			this.enableScrolling = true;
			scrollMenuWidth = 200;
		}
		this.scrollMenuWidth = scrollMenuWidth + "px";
	}

	_createDummyConversation(member) {
		let dummyObject = {
			userId: member.id,
			profileImageUrl: member.profileImageUrl ? member.profileImageUrl : IMAGES.AVTAR,
			title: member.displayName,
			isGroup: false,
			isDummyObject: true
		}

		if (member.isOnline)
			dummyObject.status = "online";
		else if (!member.isOnline && member.lastSeen)
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

		if (this.conversation.isGroup) {
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
		let clearOption = this.utility.createElement("div", clearOptionAttributes, LANGUAGE_PHRASES.CLEAR_CONV, dropDown);
		clearOption.style.display = 'block';
		if(conversation.type != 'private') {
			clearOption.style.display = 'none';
		}

		// Create delete option
		let deleteOptionAttributes = [{"id":"ch_conv_delete"},{"class":"ch-conv-delete"}];
		this.utility.createElement("div", deleteOptionAttributes, LANGUAGE_PHRASES.DELETE_CONV, dropDown);

		// Create leave conversation option
		let leaveOptionAttributes = [{"id":"ch_conv_leave"},{"class":"ch-conv-leave"}];
		let leaveOption = this.utility.createElement("div", leaveOptionAttributes, LANGUAGE_PHRASES.LEAVE_CONV, dropDown);
		leaveOption.style.display = "none";
		if(conversation.isGroup && conversation.isActive) {
			leaveOption.style.display = "block";
		}

		// Create block user option
		let blockOptionAttributes = [{"id":"ch_conv_block"}];
		let blockOption = this.utility.createElement("div", blockOptionAttributes, LANGUAGE_PHRASES.BLOCK_USER, dropDown);
		blockOption.style.display = "none";

		// Create unblock user option
		let unblockOptionAttributes = [{"id":"ch_conv_unblock"}];
		let unblockOption = this.utility.createElement("div", unblockOptionAttributes, LANGUAGE_PHRASES.UNBLOCK_USER, dropDown);
		unblockOption.style.display = "none";

		if (!conversation.isGroup) {
			if (conversation.blockedByUser) 
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

		if (loadMessages) {
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

		// Create reply container view
		let replyContainerAttributes = [{"id":"ch_reply_container"},{"class":"ch-reply-container"}];
		let replyContainer = this.utility.createElement("div", replyContainerAttributes, null, sendBox);

		// Create reply comppser view
		let replyComposerAttributes = [{"id":"ch_reply_composer"},{"class":"ch-reply-composer"}];
		let replyComposer = this.utility.createElement("div", replyComposerAttributes, null, replyContainer);

		// Create reply composer left view
		let replyComposerLeftAttributes = [{"id":"ch_reply_composer_left"},{"class":"ch-reply-composer-left"}];
		let replyComposerLeft = this.utility.createElement("div", replyComposerLeftAttributes, null, replyComposer);

		// Create reply composer thumbnail view
		let replyMessageThumbnailAttributes = [{"id":"ch_reply_message_thumbnail"},{"class":"ch-reply-message-thumbnail"}];
		this.utility.createElement("img", replyMessageThumbnailAttributes, null, replyComposerLeft);

		// Create reply composer right view
		let replyComposerRightAttributes = [{"id":"ch_reply_composer_right"},{"class":"ch-reply-composer-right"}];
		let replyComposerRight = this.utility.createElement("div", replyComposerRightAttributes, null, replyComposer);

		// Create reply composer parent message owner name view
		let replyTitleAttributes = [{"id":"ch_reply_msg_owner_name"},{"class":"ch-reply-msg-owner-name"}];
		this.utility.createElement("p", replyTitleAttributes, null, replyComposerRight);

		// Create reply composer parent message attachment icon view
		let replyMessageIconAttributes = [{"id":"ch_reply_msg_icon"}];
		let replyMessageIcon = this.utility.createElement("i", replyMessageIconAttributes, null, replyComposerRight);
		replyMessageIcon.classList.add("material-icons", "ch-reply-msg-icon");

		// Create reply composer parent message attachment message duration view
		let replyMessageDurationAttributes = [{"id":"ch_reply_msg_duration"},{"class":"ch-reply-msg-duration"}];
		this.utility.createElement("span", replyMessageDurationAttributes, null, replyComposerRight);

		// Create reply composer parent message body view
		let replyMessageAttributes = [{"id":"ch_reply_msg_body"},{"class":"ch-reply-msg-body"}];
		this.utility.createElement("p", replyMessageAttributes, null, replyComposerRight);

		// Create reply composer close icon
		let replyComposerCloseBtnAttributes = [{"id":"ch_reply_composer_close_btn"},{"title":LANGUAGE_PHRASES.CLOSE}];
		let replyComposerCloseBtn = this.utility.createElement("i", replyComposerCloseBtnAttributes, "close", replyComposer);
		replyComposerCloseBtn.classList.add("material-icons", "ch-reply-composer-close-btn");

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
		if(conversation.blockedByUser || conversation.blockedByMember || !conversation.isActive) {
			status.style.visibility = "hidden";
 			sendBox.style.visibility = "hidden";
		}

		// Create join conversation button
		let footerAttributes = [{"id":"ch_footer"},{"class":"ch-footer"}];
		let footer = this.utility.createElement("div", footerAttributes, null, windowDiv);

		let joinButtonAttributes = [{"id":"ch_conv_join"},{"class":"ch-conv-join"}];
		let joinButton = this.utility.createElement("button", joinButtonAttributes, LANGUAGE_PHRASES.JOIN_CONV, footer);
		joinButton.style.visibility = "hidden";
		if(conversation.isGroup && conversation.type === 'public' && !conversation.isActive) {
			joinButton.style.visibility = "visible";
		}

		if (loadMessages)
			this._createMessagesListing(conversation);
	}

	_createMessagesListing(conversation) {
		// Get conversation messages
		this._getMessages(conversation, this.limit, this.skip, (err, messages) => {
			if (err) return console.error(err);

			this.messages = messages;
			// Hide loader
			if (document.getElementById("ch_conv_loader_container"))
				document.getElementById("ch_conv_loader_container").remove();

			let messagesBox = document.getElementById("ch_messages_box");
			if (!messages.length) {
				// Create no message div
				let noMessageDivAttributes = [{"id":"ch_no_msg"},{"class":"ch-no-msg"}];
				this.utility.createElement("div", noMessageDivAttributes, LANGUAGE_PHRASES.NO_MESSAGES_FOUND, messagesBox);
				return;
			}

			this.messages.forEach(message => {
				// Update message object
				message = this._modifyMessage(message);

				// Create message frame
				this._createMessageFrame(message, messagesBox, false);
			});
			if (messagesBox) {
				messagesBox.scrollTop = messagesBox.scrollHeight;
			}
		});
	}

	modifyConversation(conversation) {
		if (!conversation || conversation.isModified)
			return conversation;

		if (!conversation.isGroup && conversation.user && Object.entries(conversation.user).length === 0) {
			conversation.title = LANGUAGE_PHRASES.DELETED_MEMBER;
			conversation.profileImageUrl = IMAGES.AVTAR;
			return conversation;
    	}

	    // Set profile Image, title and status of conversation
		if (conversation.isGroup) {
			conversation.profileImageUrl = conversation.profileImageUrl ? conversation.profileImageUrl : IMAGES.GROUP;
			conversation.status = conversation.memberCount + " " + LANGUAGE_PHRASES.MEMBERS;
		}
		else {
			conversation.profileImageUrl = conversation.user.profileImageUrl ? conversation.user.profileImageUrl : IMAGES.AVTAR;
			conversation.title = conversation.user.displayName;

			// Set block user status
			let member = conversation.members.find(member => member.userId == conversation.user.id);
			conversation.blockedByMember = member ? false : true;

			if (!conversation.isActive) {
				conversation.blockedByUser = true;
			}

			if (conversation.user.isOnline) {
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
		this._getMessages(this.conversation, this.limit, this.skip, (err, messages) => {
			if (err) return console.error(err);

			if (!messages.length) {
				return;
			}

			this.messages = this.messages.concat(messages);

			// Save first message to scroll
			let messagesBox = document.getElementById("ch_messages_box");
			let firstMessage = messagesBox.childNodes[0];

			messages.forEach(message => {
				// Update message object
				message = this._modifyMessage(message);

				// Create message frame
				this._createMessageFrame(message, messagesBox, false);

				let msgList = document.getElementById(message.id);
				messagesBox.insertBefore(msgList, messagesBox.childNodes[0]);
			});
			if (firstMessage) {
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

		// Conversation leave button listener
		let leaveBtn = document.getElementById("ch_conv_leave");
		if(leaveBtn) {
			leaveBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.leaveConversation();
			});
		}

		// Conversation leave button listener
		let joinBtn = document.getElementById("ch_conv_join");
		if(joinBtn) {
			joinBtn.addEventListener("click", (data) => {
				this.joinConversation();
			});
		}

		// Member block  button listener
		let blockBtn = document.getElementById("ch_conv_block");
		if (blockBtn) {
			blockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.blockUser(this.conversation.user.id, (err, res) => {
					if (err) return console.error(err);
				});
			});
		}

		// Member unblock button listener
		let unblockBtn = document.getElementById("ch_conv_unblock");
		if (unblockBtn) {
			unblockBtn.addEventListener("click", (data) => {
				document.getElementById("ch_conv_drop_down").classList.toggle("ch-show-element");
				this.chAdapter.unblockUser(this.conversation.user.id, (err, res) => {
					if (err) return console.error(err);
				});
			});
		}

		// Send message on Enter press
		let input = document.getElementById("ch_input_box");
		input.addEventListener("keydown", (data) => {
			if (data.keyCode === 13) {
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
			if (msgBox.scrollTop == 0)
				this._loadMoreMessages();
		});

		// Attachment button listener
		let attachmentBtn = document.getElementById("ch_attachment_btn");
		attachmentBtn.addEventListener("click", (data) => {
			// Hide reply container
			this.showReplyContainer(false);
			// Toggle media message docker
			document.getElementById("ch_media_docker").classList.toggle("ch-show-docker");
		});

		// Send message on image choose
		let imageInput = document.getElementById("ch_image_input");
		imageInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			}
			else
				this.sendMessage("image");
		});

		// Send message on audio choose
		let audioInput = document.getElementById("ch_audio_input");
		audioInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			}
			else
				this.sendMessage("audio");
		});

		// Send message on video choose
		let videoInput = document.getElementById("ch_video_input");
		videoInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			}
			else
				this.sendMessage("video");
		});

		// Reply container close button listener
		let closeReplyComposer = document.getElementById("ch_reply_composer_close_btn");
		closeReplyComposer.addEventListener("click", (data) => {
			this.showReplyContainer(false);
		});

	}

	sendMessage(msgType) {
		// Hide media docker
		this.showMediaDocker(false);

		let messagesBox = document.getElementById("ch_messages_box");

		// Show loader image if media message
		if (msgType != "text") {
			if (document.getElementById("ch_no_msg"))
				document.getElementById("ch_no_msg").remove();

			let msgLoaderAttributes = [{"id":"ch_msg_loader"},{"class":"ch-msg-loader"}];
			let imageMsg = this.utility.createElement("div", msgLoaderAttributes, null, messagesBox);
			imageMsg.style.backgroundImage = "url(" + IMAGES.MESSAGE_LOADER + ")";
			imageMsg.scrollIntoView();
		}

		switch(msgType) {
			case "text":
				let inputValue = document.getElementById("ch_input_box").value;
				document.getElementById("ch_input_box").value = "";

				if (!inputValue.trim())
					return;

				let data = {
					id : uuid(),
					type : "normal",
					body : inputValue
				};
				// Add reply message data
				if (document.getElementsByClassName("ch-reply-container ch-show-reply-container").length) {
					data['parentId'] = this.replyMessage['id'];
					data['type'] = 'reply';
					data['parentMessage'] = this.replyMessage;
					
					// Hide reply container
					this.showReplyContainer(false);
				}

				// Add pending message into list
				this.addPendingMessage(data);

				if (this.conversation.isDummyObject) {
					data['userId'] = this.conversation.userId;

					this.chAdapter.sendMessageToUser(data, (err, res) => {
						if (err) return console.error(err);
					});
				}
				else {
					this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
						if (err) return console.error(err);
					});
				}
				break;

			case "image":
				let imageFile = document.getElementById("ch_image_input").files[0];

				// Upload file on channelize server
				this.chAdapter.uploadFile(imageFile, "image", true, (err, fileData) => {
					if (err) return console.error(err);

					this._sendFileMessage(fileData);
				});
				break;

			case "audio":
				let audioFile = document.getElementById("ch_audio_input").files[0];

				// Upload file on channelize server
				this.chAdapter.uploadFile(audioFile, "audio", true, (err, fileData) => {
					if (err) return console.error(err);

					this._sendFileMessage(fileData);
				});
				break;

			case "video":
				let videoFile = document.getElementById("ch_video_input").files[0];
				// Upload file on channelize server
				this.chAdapter.uploadFile(videoFile, "video", true, (err, fileData) => {
					if (err) return console.error(err);

					this._sendFileMessage(fileData);
				});
				break;
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
		if (this.conversation.isDummyObject) {
			data['userId'] = this.conversation.userId;
			this.chAdapter.sendMessageToUser(data, (err, message) => {
				if (err) return console.error(err);
			});
		}
		else {
			this.chAdapter.sendMessage(this.conversation, data, (err, message) => {
				if (err) return console.error(err);
			});
		}
	}

	addPendingMessage(msgData) {
		msgData["ownerId"] = this.widget.userId;
		let messagesBox = document.getElementById("ch_messages_box");

		// Remove no message tag
		if (messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_msg") {
			messagesBox.firstChild.remove();
		}

		// Create message frame
		this._createMessageFrame(msgData, messagesBox, true);
		
		// Scroll to newly added dummy message
		messagesBox.scrollTop = messagesBox.scrollHeight;
	}

	clearConversation() {
		this.chAdapter.clearConversation(this.conversation, (err, res) => {
			if (err) return console.error(err);
		});
	}

	deleteConversation() {
		this.chAdapter.deleteConversation(this.conversation, (err, res) => {
			if (err) return console.error(err);
		});
	}

	leaveConversation() {
		this.chAdapter.leaveConversation(this.conversation, (err, res) => {
			if(err) return console.error(err);
		});
	}

	joinConversation() {
		this.chAdapter.joinConversation(this.conversation, (err, res) => {
			if(err) return console.error(err);
		});
	}

	_getMessages(conversation, limit, skip, cb) {
		let showInConversation = null;

		// If thread messing enable then only show message whose 'showInConversation' value is true.
		if (this.allowThreadMessage) {
			showInConversation = true;
		}
		
		this.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, null, showInConversation, (err, messages) => {
			if (err) return cb(err);
      
			messages.reverse();
			return cb(null, messages);
		});
	}

	_modifyMessage(message) {
		if (!message)
			return message;

		// Handle meta message
		if (message.type == "admin") {

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
		if(!this.conversation.isDummyObject && this.chAdapter.getConversationConfig(this.conversation, 'read_events')) {
			message.readByAll = this.chAdapter.readByAllMembers(this.conversation, message);
		}

	    message.createdAt = this.utility.updateTimeFormat(message.createdAt);

	    if (message.isDeleted) {
	    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
	    }

	    return message;
	}

	_markAsRead(conversation) {
		if(!this.chAdapter.getConversationConfig(conversation, 'read_events')) return;
		let currentDate = new Date();
		let timestamp = currentDate.toISOString();
	  	this.chAdapter.markAsReadConversation(conversation, timestamp, (err, res) => {
	  		if (err) return console.error(err);
	  	});
	}

	addNewMessage(message, newConversation) {
		// Convert message object to message model
		message = new Channelize.core.Message.Model(message);
		
		// Update reply count
		if (this.allowThreadMessage && message.type == "reply") {
			let parentMessage = message.parentMessage;
			let parentMessageId = parentMessage.id;
            let messageIndex = this.messages.findIndex(message => message.id == parentMessageId);
			if (messageIndex != -1) {
				// Update parent message reply count
				this.messages[messageIndex]['replyCount'] = parentMessage.replyCount;
				document.getElementById("ch_reply_count_" + parentMessageId).innerHTML = parentMessage.replyCount + " " + LANGUAGE_PHRASES.REPLIES;

				// Show the reply container
				document.getElementById("ch_reply_count_container_" + parentMessageId).classList.add("show");
			}
		}

		/* Only add a new message on the conversation window if thread messaging is disabled and
		 new message showInConversation is true. */
		if (this.allowThreadMessage && !message.showInConversation) {
			return;
		}

		// Set new conversation to replace dummy conversation
		if (newConversation) {
			this.conversation = newConversation;
		}

		message = this._modifyMessage(message);
		this.messages.push(message);

		// Remove pending dummy message
		let dummyMessage = document.getElementById(message.id);
		if (dummyMessage) {
			dummyMessage.remove();
		}

		let messagesBox = document.getElementById("ch_messages_box");
		if (message.type == "admin") {
			let metaMessageAttributes = [{"class":"ch-admin-msg"}];
			this.utility.createElement("div", metaMessageAttributes, message.body, messagesBox);
			return;
		}

		// Hide message loader
		if (document.getElementById("ch_msg_loader") && message.ownerId == this.widget.userId) {
			document.getElementById("ch_msg_loader").remove();
		}

		if (message.conversationId != this.conversation.id || !messagesBox)
			return;

		message.createdAt = this.utility.updateTimeFormat(Date());

		// Remove no message tag
		if (messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_msg") {
			messagesBox.firstChild.remove();
		}

		// Create message frame
		this._createMessageFrame(message, messagesBox, false);

		if (message.ownerId != this.widget.userId) {
			// Message mark a read
			this._markAsRead(this.conversation);
		}

		// Scroll to new message
		if (messagesBox)
			messagesBox.scrollTop = messagesBox.scrollHeight;
	}

	updateMsgStatus(data) {
		if (data.conversation.id != this.conversation.id || this.conversation.isGroup) {
			return;
		}

		// Check read status of second last message
		if (this.messages.slice(-2, -1) && this.messages.slice(-2, -1).readByAll) {
			let lastMessage = this.messages[this.messages.length-1];
			lastMessage.readByAll = true;

			// Update read tag icon
			let msgDiv = document.getElementById(lastMessage.id);
			if (msgDiv) {
				let statusDiv = msgDiv.querySelector("#ch_msg_status");

				if (statusDiv) {
					statusDiv.innerHTML = "done_all";
				}
			}
		}
		else {
			this.messages.forEach(msg => {
				msg.readByAll = true;

				// Update read tag icon
				let msgDiv = document.getElementById(msg.id);
				if (msgDiv) {
					let statusDiv = msgDiv.querySelector("#ch_msg_status");

					if (statusDiv) {
						statusDiv.innerHTML = "done_all";
					}
				}
			});
		}
	}

	updateUserStatus(user) {
		if (this.conversation.isGroup || !this.conversation.user || (this.conversation.user.id != user.id))
			return;

		if (user.isOnline) {
			this.conversation.status = LANGUAGE_PHRASES.ONLINE;
		}
		else if (!user.isOnline && user.lastSeen) {
			this.conversation.status = LANGUAGE_PHRASES.LAST_SEEN + this.utility.updateTimeFormat(user.lastSeen);
		}
		document.getElementById("ch_conv_status").innerText = this.conversation.status;
	}

	_createMessageReactionFrame(message, parentDiv) {
		if (!message.reactions) {
			return;
		}

		if (document.getElementById("ch_reaction_" + message.id)) {
			document.getElementById("ch_reaction_" + message.id).remove();
		}

        let messageDiv = document.getElementById("ch_message_" + message.id);
        if (messageDiv) {
        	messageDiv.classList.remove("reaction-space");
        }

		// Get total reaction counts
		let totalReactionCounts = 0
        if (message.reactionsCount) {
            Object.keys(message.reactionsCount).forEach((type) => {
                totalReactionCounts += message.reactionsCount[type];
            });
        }

        // If no reaction on message then return
        if (totalReactionCounts == 0) {
        	return;
        }

        // Add class reaction-space
        messageDiv.classList.add("reaction-space");

        // Create reaction container
		let msgReactionContainerAttributes = [{"id":"ch_reaction_" + message.id},{"class":"ch-msg-reaction-container"}];
		let msgReactionContainer = this.utility.createElement("div", msgReactionContainerAttributes, null, parentDiv);
		
		let msgReactionAttributes = [{"class":"ch-msg-reaction"}];
		let msgReaction = this.utility.createElement("div", msgReactionAttributes, null, msgReactionContainer);
	
		// Create message reaction listing
		let msgReactionListAttributes = [{"class":"ch-msg-reaction-list"}];
		let msgReactionList = this.utility.createElement("ul", msgReactionListAttributes, null, msgReaction);
		
		Object.keys(message.reactions).forEach((type) => {
			
			if (this.reactionsSetting.types && this.reactionsSetting.types[type] && message.reactionsCount[type]) {
				
				let msgReactionItemAttributes = [{"class":"ch-msg-reaction-item"}];
				let msgReactionItem = this.utility.createElement("li", msgReactionItemAttributes, null, msgReactionList);
				
				// Set the border radius
				msgReactionItem.style['border-radius'] = (message.reactionsCount[type] > 1) ? '15px' : '50%';
				
				// Create reaction icons span like 👍, 👎.
				let msgReactionNameAttributes = [{"class":"ch-msg-reaction-name"}];
				let msgReactionName = this.utility.createElement("span", msgReactionNameAttributes, this.reactionsSetting.types[type], msgReactionItem);

				// Create reaction count span
				if (message.reactionsCount[type] > 1) {
					let msgReactionCountAttributes = [{"class":"ch-msg-reaction-count"}];
					let msgReactionCount = this.utility.createElement("span", msgReactionCountAttributes, message.reactionsCount[type], msgReactionItem);
				}
			}
		})
		
	}

	_createTextMessageFrame(message, parentDiv) {
		// Create reply message view container
		if (message.type == 'reply' && !message.isDeleted && !this.allowThreadMessage) {
			
			let parentMessage = message.parentMessage;
			let attachment = parentMessage.attachments && parentMessage.attachments[0];
	    	let attachmentType = attachment ? attachment.type : '';

			let formatedMessageImg = '';
		 	switch(attachmentType) {
		      	case "image":
			        formatedMessageImg = attachment.thumbnailUrl  ? attachment.thumbnailUrl : attachment.fileUrl;
			        break;

		      	case "video":
			        formatedMessageImg = attachment.thumbnailUrl  ? attachment.thumbnailUrl : '';
			        break;

			    case "sticker": case "gif":
					formatedMessageImg = attachment.stillUrl;
					break;

				case "location":
					formatedMessageImg = SETTINGS.LOCATION_IMG_URL + "?center=" +
				  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
				  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;
					break;
			}
			
			// Create reply conatiner view
			let replyMsgContainerAttributes = [{"id":"ch_reply_msg_container_" + message.id},{"class": attachmentType ? "ch-reply-msg-container-attachment" : "ch-reply-msg-container"}];
			let replyContainer = this.utility.createElement("div", replyMsgContainerAttributes, null, parentDiv);

			// Create parent message owner name in reply message view
			let replyTitle = (parentMessage.ownerId == this.widget.userId) ? LANGUAGE_PHRASES.YOU : parentMessage.owner.displayName;
			let parentMsgOwnerNameAttributes = [{"class":"ch-parent-msg-owner-name"}];
			this.utility.createElement("p", parentMsgOwnerNameAttributes, replyTitle, replyContainer);
			
			// Create parent message icon in reply message view
			if (attachmentType) {
				let parentMsgIconAttributes = [{"class":"ch-parent-msg-icon"}];
				let parentMsgIcon = this.utility.createElement("i", parentMsgIconAttributes, ICONS[attachmentType], replyContainer);
				parentMsgIcon.classList.add("material-icons");
			}

			// Create parent message duration in reply message view
			if (attachmentType && ['audio','video'].includes(attachmentType)) {
				let parentMsgDurationAttributes = [{"class":"ch-parent-msg-duration"}];
				this.utility.createElement("span", parentMsgDurationAttributes, this.utility.formatDuration(attachment.duration), replyContainer);
			}

			// Create parent message body in reply message view
			let parentMessageBody = parentMessage.body ? parentMessage.body : LANGUAGE_PHRASES[attachmentType.toLocaleUpperCase()];
			let parentMsgBodyAttributes = [{"class":"ch-parent-msg-body"}];
			this.utility.createElement("p", parentMsgBodyAttributes, parentMessageBody, replyContainer);

			// Create container right view
			if (formatedMessageImg) {
				let replyMsgContainerRightAttributes = [{"class":"ch-reply-msg-container-right"}];
				let replyMsgContainerRight = this.utility.createElement("div", replyMsgContainerRightAttributes, null, replyContainer);

				// Create parent message thumbnail in reply message view
				let parentMsgBodyThumbnailAttributes = [{"class":"ch-parent-msg-thumbnail"},{"src":formatedMessageImg}];
				this.utility.createElement("img", parentMsgBodyThumbnailAttributes, null, replyMsgContainerRight);
			}

			// Add an event listener to the reply container. Go to parent message on click replied message..
			replyContainer.addEventListener("click", (data) => {
				let parentMessageElement = document.getElementById(parentMessage.id);
		      	if (parentMessageElement) {
			        parentMessageElement.scrollIntoView(true);
			        return;
	      		}
			});
		}

		// Show 'Reply of thread' if thread messagin is enabled and message showInConversation value is true
		if (this.allowThreadMessage && message.type == "reply" && message.showInConversation) {
			let parentMessage = message.parentMessage;
			// Update message object
			parentMessage = this._modifyMessage(parentMessage);

			let attachment = parentMessage.attachments && parentMessage.attachments[0];
    		let attachmentType = attachment ? attachment.type : '';
    		let parentMessageBody = parentMessage.body ? parentMessage.body : LANGUAGE_PHRASES[attachmentType.toLocaleUpperCase()];

			let msgSendConversationAttributes = [{"class": attachment ? 
						 "ch-attachments-message-reply-thread" : "ch-text-message-reply-thread"}];
			let msgSendConversation = this.utility.createElement("p", msgSendConversationAttributes, 
				LANGUAGE_PHRASES.REPLY_OF_THREAD + ": " + parentMessageBody, parentDiv);

			msgSendConversation.addEventListener("click", (data) => {
				this.widget.loadThread(parentMessage, this.conversation);
			});
		}

		// Create message body view
		if (message.type == "reply" && !message.body) {
			let msgBodyAttributes = [{"id":"ch_message_body_" + message.id}];
			this.utility.createElement("p", msgBodyAttributes, null, parentDiv);
		} else {
			let msgBodyAttributes = [{"id":"ch_message_body_" + message.id},{"class":"ch-message-body"}];
			this.utility.createElement("p", msgBodyAttributes, message.body, parentDiv);
		}
		
	}

	_createMediaMessageFrame(message, parentDiv) {

	  	// Create message div
	  	if (!message.body && Object.keys(message.attachments).length != 0) {
	  		message.attachments.forEach(attachment => {

	  			switch(attachment.type) {
	  				case "audio":
	  					let audioMsgAttributes = [{"id":"ch_audio_message"},{"class":"ch-audio-message"},{"src":attachment.fileUrl}];
						let audioTag = this.utility.createElement("audio", audioMsgAttributes, null, parentDiv);
						audioTag.setAttribute("controls",true);
						break;

					case "video":
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
						break;

					case "sticker":
						let stickerMsgAttributes = [{"id":"ch_sticker_message"},{"class":"ch-sticker-message"}];
						let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, parentDiv);
						stickerMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
						break;

					case "gif":
						let gifMsgAttributes = [{"id":"ch_gif_message"},{"class":"ch-sticker-message"}];
						let gifMsg = this.utility.createElement("div", gifMsgAttributes, null, parentDiv);
						gifMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
						break;

					case "location":
						let locationSrc = SETTINGS.LOCATION_IMG_URL + "?center=" +
				  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
				  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;

				  		let locationMsgAttributes = [{"id":"ch_location_message"},{"class":"ch-location-message"}];
						let locationMsg = this.utility.createElement("div", locationMsgAttributes, null, parentDiv);
						locationMsg.style.backgroundImage = "url(" + locationSrc + ")";

						// Set location message listener
						locationMsg.addEventListener("click", data => {
							let mapUrl = "https://www.google.com/maps?z=15&t=m&q=loc:" + attachment.latitude + "," + attachment.longitude;
							window.open(mapUrl, "_blank");
						});
						break;

					default:
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

	_addListenerOnAddReactionOption(message, addReaction, msgList) {
		addReaction.addEventListener("click", (data) => {
			if (document.getElementById("ch_scroll_menu_container")) {
				document.getElementById("ch_scroll_menu_container").remove();
				return;
			}

			// Hide the more option container
			if (document.getElementById("ch_msg_option_container")) {
				document.getElementById("ch_msg_option_container").remove();
			}

			// Create message reaction container
			let scrollMenuContainerAttributes = [{"id":"ch_scroll_menu_container"},{"class":"ch-scroll-menu-container"}];
			let scrollMenuContainer = this.utility.createElement("div", scrollMenuContainerAttributes, null, msgList);

			// Create message reaction listing
			let scrollMenuAttributes = [{"class":"ch-scroll-menu"}];
			let scrollMenu = this.utility.createElement("div", scrollMenuAttributes, null, scrollMenuContainer);
			scrollMenu.style.width = this.scrollMenuWidth;

			// Create scroll left arrow
			if (this.enableScrolling) {
				let scrollMenuLeftAttributes = [{"class":"ch-scroll-menu-arrow ch-scroll-menu-arrow-left"}];
				let scrollMenuLeft = this.utility.createElement("i", scrollMenuLeftAttributes, "keyboard_arrow_left", scrollMenuContainer);
				scrollMenuLeft.classList.add("material-icons");

				// Add event listiner
				scrollMenuLeft.addEventListener("click", (data) => {
					scrollMenu.scrollLeft -= 200;
				});
			}
			
			// Create message reaction listing
			let reactionListingAttributes = [{"class":"ch-reaction-listing"}];
			let reactionListing = this.utility.createElement("ul", reactionListingAttributes, null, scrollMenu);

			// Create message reaction menu listing
			this.reactionsTypes.forEach((type) => {
				let reactionTypeObj = message.reactions[type.name];
				var reactionMenuListAttributes = [{"class":"ch-reaction-menu-list"}];
				if (reactionTypeObj && reactionTypeObj.indexOf(this.widget.userId) != -1) {
					reactionMenuListAttributes = [{"class":"ch-reaction-menu-list reaction-selected"},{"title":type.name},{"name":type.name}];
				}
				let reactionMenuList = this.utility.createElement("li", reactionMenuListAttributes, null, reactionListing);
				
				let reactionMenuListItemAttributes = [{"class":"ch-reaction-menu-list-item"},{"title":type.name},{"name":type.name}];
				let reactionMenuListItem = this.utility.createElement("span", reactionMenuListItemAttributes, type.icon, reactionMenuList);
				
				// Add event listiner on reaction menu item
				this._updateReaction(message.id, reactionMenuListItem);
			});
			
			// Create scroll right arrow
			if (this.enableScrolling) {
				let scrollMenuRightAttributes = [{"class":"ch-scroll-menu-arrow ch-scroll-menu-arrow-right"}];
				let scrollMenuRight = this.utility.createElement("i", scrollMenuRightAttributes, "keyboard_arrow_right", scrollMenuContainer);
				scrollMenuRight.classList.add("material-icons");

				// Add event listiner
				scrollMenuRight.addEventListener("click", (data) => {
					scrollMenu.scrollLeft += 200;
				});
			}
			
		});
	}

	_updateReaction(messageId, reactionMenuListItem) {
		reactionMenuListItem.addEventListener("click", (data) => {
			// Close the reaction container
			if (document.getElementById("ch_scroll_menu_container")) {
				document.getElementById("ch_scroll_menu_container").remove();
			}

			const messageIndex = this.messages.findIndex(message => message.id == messageId);
			if (messageIndex == -1) {
				return;
			}

			const message = this.messages[messageIndex];
			const reactionType = reactionMenuListItem.title;

			const reactionTypeObj = message.reactions[reactionType];
            if (reactionTypeObj && reactionTypeObj.indexOf(this.widget.userId) != -1) {
				// Update message reactions
				var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(this.widget.userId);
				if (memberIndex != -1) {
					this.messages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
					this.messages[messageIndex]["reactionsCount"][reactionType] --;
				}

				this.chAdapter.removeReaction(message, { type: reactionType }, (err, res) => {
        		});
			} else {
				// Update message reactions
				if(this.messages[messageIndex]["reactions"][reactionType]) {
					var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(this.widget.userId);
					if (memberIndex == -1) {
						this.messages[messageIndex]["reactions"][reactionType].push(this.widget.userId);
						this.messages[messageIndex]["reactionsCount"][reactionType] ++;
					}
				} else {
					const reactionData = this.messages[messageIndex]["reactions"];
					reactionData[reactionType] = [this.widget.userId];
					this.messages[messageIndex]["reactions"] = reactionData;

					const reactionCountData = this.messages[messageIndex]["reactionsCount"];
					reactionCountData[reactionType] = 1;
					this.messages[messageIndex]["reactionsCount"] = reactionCountData;
				}

				this.chAdapter.addReaction(message, { type: reactionType }, (err, res) => {
        		});
			}

		});
	}

	_addListenerOnMoreOption(message, moreOption, msgList) {
		moreOption.addEventListener("click", (data) => {
			if (document.getElementById("ch_msg_option_container")) {
				document.getElementById("ch_msg_option_container").remove();
				return;
			}

			// Hide the add reaction container
			if (document.getElementById("ch_scroll_menu_container")) {
				document.getElementById("ch_scroll_menu_container").remove();
			}

			// Create message options container
			let msgOptionsContainerAttributes = [{"id":"ch_msg_option_container"},{"class":"ch-msg-option-container"}];
			let msgOptionsContainer = this.utility.createElement("div", msgOptionsContainerAttributes, null, msgList);

			if (message.ownerId == this.widget.userId) {
				msgOptionsContainer.style.left = "15px";
			} else {
				msgOptionsContainer.style.right = "15px";
			}

			// Create delete message for me option
			if(this.conversation.type === 'private') {
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
			}

			if (!message.isDeleted && message.ownerId == this.widget.userId) {
				// Create delete message for everyone option
				let deleteMsgEveryoneAttributes = [{"id":"ch_msg_delete_for_everyone"},{"class":"ch-msg-delete-for-everyone"}];
				let deleteMsgEveryoneOption = this.utility.createElement("div", deleteMsgEveryoneAttributes, LANGUAGE_PHRASES.DELETE_FOR_EVERYONE, msgOptionsContainer);

				// Add listener on delete message for everyone
				deleteMsgEveryoneOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();

					// Delete message for me
					this.chAdapter.deleteMessagesForEveryone([message.id], (err, res) => {
						if (err) console.error(err);
					})
				});
			}
			
			if (!message.isDeleted && !this.allowThreadMessage) {
				// Create reply message option
				let replyMsgAttributes = [{"class":"ch-msg-reply"}];
				let replyMsgOption = this.utility.createElement("div", replyMsgAttributes, LANGUAGE_PHRASES.REPLIES, msgOptionsContainer);
				
				// Add listener on reply
				replyMsgOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();
					this.replyMessage = message;
					this.openReplyMessageComposerBox(message);
				});
			}

			if (!message.isDeleted && this.allowThreadMessage && message.replyCount == 0) {
				// Create Reply in Thread option
				let startThreadAttributes = [{"id":"ch_msg_start_thread"},{"class":"ch-msg-start-thread"}];
				let startThreadOption = this.utility.createElement("div", startThreadAttributes, LANGUAGE_PHRASES.REPLY_IN_THREAD, msgOptionsContainer);
				
				// Add listener on Reply in Thread
				startThreadOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();
					this.widget.loadThread(message, this.conversation);
				});
			}

			if (this.allowThreadMessage && message.replyCount) {
				// Create view thread option
				let viewThreadAttributes = [{"id":"ch_msg_view_thread"},{"class":"ch-msg-view-thread"}];
				let viewThreadOption = this.utility.createElement("div", viewThreadAttributes, LANGUAGE_PHRASES.VIEW_THREAD, msgOptionsContainer);
				
				// Add listener on view thread
				viewThreadOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();
					this.widget.loadThread(message, this.conversation);
				});
			}
		});
	}

	openReplyMessageComposerBox(message) {
		// Hide media docker
		this.showMediaDocker(false);
		// Show reply container
		this.showReplyContainer(true);

		/* Set reply composer params */
		let attachment = message.attachments && message.attachments[0];
    	let attachmentType = attachment ? attachment.type : '';

    	let formatedMessageImg = '';
		switch(attachmentType) {
		  	case "image":
		        formatedMessageImg = attachment.thumbnailUrl  ? attachment.thumbnailUrl : attachment.fileUrl;
		        break;

		  	case "video":
		        formatedMessageImg = attachment.thumbnailUrl  ? attachment.thumbnailUrl : '';
		        break;

		    case "sticker": case "gif":
				formatedMessageImg = attachment.stillUrl;
				break;

			case "location":
				formatedMessageImg = SETTINGS.LOCATION_IMG_URL + "?center=" +
			  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
			  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;
				break;
		}

		// Set parent message owner name in reply composer
		let replyTitle = (message.ownerId == this.widget.userId) ? LANGUAGE_PHRASES.YOU : message.owner.displayName;
		document.getElementById('ch_reply_msg_owner_name').innerHTML = replyTitle;
		
		// Set parent message icon in reply composer
		if (attachmentType) {
			document.getElementById('ch_reply_msg_icon').innerHTML = ICONS[attachmentType];
			document.getElementById('ch_reply_msg_icon').style.display = 'block';
		} else {
			document.getElementById('ch_reply_msg_icon').innerHTML = '';
			document.getElementById('ch_reply_msg_icon').style.display = 'none';
		}

		// Set parent message duration in reply composer
		if (attachmentType && ['audio','video'].includes(attachmentType)) {
			document.getElementById('ch_reply_msg_duration').innerHTML = this.utility.formatDuration(attachment.duration);
			document.getElementById('ch_reply_msg_duration').style.display = 'block';
		} else {
			document.getElementById('ch_reply_msg_duration').innerHTML = '';
			document.getElementById('ch_reply_msg_duration').style.display = 'none';
		}

		// Set parent message body in reply composer
		let replyMessage = message.body ? message.body : LANGUAGE_PHRASES[attachmentType.toLocaleUpperCase()];
		document.getElementById('ch_reply_msg_body').innerHTML = replyMessage;

		// Set parent message thumbnail in reply composer
		if (formatedMessageImg) {
			document.getElementById('ch_reply_message_thumbnail').src = formatedMessageImg;
			document.getElementById('ch_reply_message_thumbnail').style.display = 'block';
		} else {
			document.getElementById('ch_reply_message_thumbnail').src = '';
			document.getElementById('ch_reply_message_thumbnail').style.display = 'none';
		}
	}

	_createMessageFrame(message, messagesBox, isPendingMessage) {
		
		// Create admin message view
		if (message.type == "admin") {
			let metaMessageAttributes = [{"class":"ch-admin-msg"}];
			this.utility.createElement("div", metaMessageAttributes, message.body, messagesBox);
			return;
		}

		// Create message list
		let msgListAttributes = [{"id":message.id},{"class":"ch-msg-list"}];
		let msgList = this.utility.createElement("div", msgListAttributes, null, messagesBox);

		// Create sender name div
		if (this.conversation.isGroup && message.ownerId != this.widget.userId) {
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

		// Add event listiner on more option
		this._addListenerOnMoreOption(message, moreOption, msgList);

		// Create message div
		let msgDivAttributes = [{"id":"ch_message_" + message.id},{"class":"ch-message"}];
		let msgDiv = this.utility.createElement("div", msgDivAttributes, null, msgContainer);

		// Create add reaction div.
		if (this.reactionsSetting.enable && message.ownerId != this.widget.userId && !message.isDeleted) {
			let addReactionAttributes = [{"class":"ch-add-reaction-option"}];
			let addReaction = this.utility.createElement("i", addReactionAttributes, "insert_emoticon", msgList);
			addReaction.classList.add("material-icons");

			// Add event listiner on add reaction option
			this._addListenerOnAddReactionOption(message, addReaction, msgList);
		}

		// Create message and reply message frame
		this._createTextMessageFrame(message, msgDiv);

		// Create media message frame
		this._createMediaMessageFrame(message, msgDiv);

		// Create added message reaction view
		if (this.reactionsSetting.enable && !message.isDeleted) {
			this._createMessageReactionFrame(message, msgDiv);
		}

		// Create message reply count container
		let msgReplyCountContainerAttributes = [{"id":"ch_reply_count_container_" + message.id},{"class":"ch-msg-reply-count-container"}];
		let msgReplyCountContainer = this.utility.createElement("div", msgReplyCountContainerAttributes, null, msgContainer);
		
		// Create message reply count icon view
		let arrowIcon = (message.ownerId == this.widget.userId) ? "subdirectory_arrow_left" : "subdirectory_arrow_right";
		let msgReplyIconAttributes = [{"class":"ch-msg-reply-count-icon"}];
		let msgReplyIcon = this.utility.createElement("i", msgReplyIconAttributes, arrowIcon, msgReplyCountContainer);
		msgReplyIcon.classList.add("material-icons");

		// Create message reply count span
		let msgReplyCountAttributes = [{"id":"ch_reply_count_" + message.id},{"class":"ch-msg-reply-count"}];
		let msgReplyCount = this.utility.createElement("span", msgReplyCountAttributes, null, msgReplyCountContainer);

		msgReplyCount.addEventListener("click", (data) => {
			this.widget.loadThread(message, this.conversation);
		});

		// Set reply icon and count
		if (this.allowThreadMessage && message.replyCount) {
			msgReplyCountContainer.classList.add("show");
			msgReplyCount.innerHTML = message.replyCount  + " " + LANGUAGE_PHRASES.REPLIES;
		}

		// Create message time span
		let createdAt = message.createdAt;
		if (!createdAt) {
			let date = new Date();
			date = date.toISOString();
			createdAt = this.utility.updateTimeFormat(date);
		}
		let msgTimeAttributes = [{"class":"ch-msg-time"}];
		let msgTime = this.utility.createElement("span", msgTimeAttributes, createdAt, msgContainer);

		if (message.ownerId == this.widget.userId) {
			msgContainer.classList.add("right");
			moreOption.classList.add("left");
			// Create message read status
			let statusAttributes = [{"id":"ch_msg_status"}];
			let readIcon = message.readByAll ? "done_all" : "check";
			let msgStatus = this.utility.createElement("i", statusAttributes, isPendingMessage ? "schedule" : readIcon, msgContainer);
			msgStatus.classList.add("material-icons", "ch-msg-status");
		}
		else{
			msgContainer.classList.add("left");
			moreOption.classList.add("right");
		}
	}

	updateDeleteForEveryoneMsg(data) {
		if (this.conversation.id != data.conversation.id)
			return;

	  	// Update text of deleted message
	  	let convTargetMsg = document.getElementById("ch_message_" + data.messages[0].id);
		if (convTargetMsg) {
			convTargetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
		}

		// Update listener of deleted message
	  	let targetMessage = document.getElementById(data.messages[0].id)
	  	if (targetMessage) {
	  		let deletedMsgOptionBtn = targetMessage.lastChild;
	  		deletedMsgOptionBtn.addEventListener("click", data => {
		  		// Remove delete for everyone option
		  		let deleteForEveryoneBtn = document.getElementById("ch_msg_delete_for_everyone");
		  		if (deleteForEveryoneBtn) {
		  			deleteForEveryoneBtn.remove();
		  		}

		  		// Remove Reply in Thread option
		  		let deleteStartThread = document.getElementById("ch_msg_start_thread");
		  		if (deleteStartThread) {
		  			deleteStartThread.remove();
		  		}
		  	});
	  	}
	}

	handleBlock(data) {
		if (this.conversation.isGroup)
			return;

		if (this.conversation.user.id == data.blockee.id) {
			document.getElementById("ch_conv_block").style.display = "none";;
			document.getElementById("ch_conv_unblock").style.display = "block";
		}

		// Hide status and input field
		document.getElementById("ch_conv_status").style.visibility = "hidden";
		document.getElementById("ch_send_box").style.visibility = "hidden";
	}

	handleUnblock(data) {
		if (this.conversation.isGroup)
			return;

		if (this.conversation.user.id == data.unblockee.id) {
			document.getElementById("ch_conv_unblock").style.display = "none";
	  		document.getElementById("ch_conv_block").style.display = "block";
		}

		// Show status and input field
		document.getElementById("ch_conv_status").style.visibility = "visible";
		document.getElementById("ch_send_box").style.visibility = "visible";
	}

  	handleClearConversation(conversation) {
  		if (conversation.id != this.conversation.id) {
  			return;
  		}
  		let messagesBox = document.getElementById("ch_messages_box");
  		if (messagesBox) {
  			messagesBox.innerHTML = "";
  		}
  	}

	handleDeleteConversation(conversation) {
  		if (conversation.id != this.conversation.id) {
  			return;
  		}

  		let conversationWindow = document.getElementById("ch_conv_window");
  		if (conversationWindow) {
  			conversationWindow.remove();
  		}
  	}

	handleUserJoined(data) {
  	if(data.conversation.id != this.conversation.id) return;
		this.conversation.isActive = true;
		document.getElementById("ch_send_box").style.visibility = "visible";
		document.getElementById("ch_conv_leave").style.display = "block";
		if(this.conversation.type === 'public') {
			document.getElementById("ch_conv_join").style.visibility = "hidden";
		}
	}

	handleUserRemoved(data) {
    if(data.conversation.id != this.conversation.id) return;
		this.conversation.isActive = false;
		document.getElementById("ch_send_box").style.visibility = "hidden";
		document.getElementById("ch_conv_leave").style.display = "none";
		if(this.conversation.type === 'public') {
			document.getElementById("ch_conv_join").style.visibility = "visible";
		}
	}

	handleAddReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}

		const messageId = data.message.id;
    const messageIndex = this.messages.findIndex(message => message.id == messageId);
    if (messageIndex != -1) {
			const reactionType = data.reaction.type;
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;

			if(this.messages[messageIndex]["reactions"][reactionType]) {
				var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(userId);
				if (memberIndex == -1) {
					this.messages[messageIndex]["reactions"][reactionType].push(userId);
				}
				this.messages[messageIndex]["reactionsCount"] = reactionsCount;
			} else {
				const reactionData = this.messages[messageIndex]["reactions"];
				reactionData[reactionType] = [userId];
				this.messages[messageIndex]["reactions"] = reactionData;
				this.messages[messageIndex]["reactionsCount"] = reactionsCount;
			}

			let msgDiv = document.getElementById("ch_message_" + messageId);
			this._createMessageReactionFrame(this.messages[messageIndex], msgDiv);
        }
	}

	handleRemoveReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}
		
		const messageId = data.message.id;
		const reactionType = data.reaction.type;
		const messageIndex = this.messages.findIndex(message => message.id == messageId);
		if (messageIndex != -1 && this.messages[messageIndex]["reactions"][reactionType]) {
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;
			var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(userId);
			if (memberIndex != -1) {
				this.messages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
			}
			this.messages[messageIndex]["reactionsCount"] = reactionsCount;
			
			let msgDiv = document.getElementById("ch_message_" + messageId);
			this._createMessageReactionFrame(this.messages[messageIndex], msgDiv);
		}
	}

	showMediaDocker(value) {
		if (value) {
			document.getElementById("ch_media_docker").classList.add("ch-show-docker");
		} else {
			document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
		}
	}

	showReplyContainer(value) {
		if (value) {
			document.getElementById("ch_reply_container").classList.add('ch-show-reply-container');
		} else {
			document.getElementById("ch_reply_container").classList.remove('ch-show-reply-container');
		}
	}
}

export { ConversationWindow as default };