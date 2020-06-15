import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
import moment from 'moment';
import { LANGUAGE_PHRASES, IMAGES, SETTINGS, ICONS } from "../constants.js";

class Conversation {

	constructor(liveStream) {
		// Initialize dependencies
		this.chAdapter = liveStream.chAdapter;
		this.liveStream = liveStream;
		this.utility = new Utility();

		this.limit = 25;
		this.allowThreadMessage = SETTINGS.ALLOW_MESSAGE_THREADING;
		this.messages = [];
		this.replyMessage = {};

		// Message reactions config
		this.reactionsSetting= SETTINGS.REACTION_SETTINGS;
		this.reactionsTypes = [];
		this.enableScrolling = false;
		this.scrollMenuWidth = 0;
	}

	init(conversation) {
		this.conversation = conversation;
		this._createConversationLayout();
		this._registerClickEventHandlers();
		
		this._createReactionScrollMenuData();
		this.loginUser = this.chAdapter.getLoginUser();
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

	_createConversationLayout() {
		// Create Window frame
		let chFrame = document.getElementById("ch_frame");
		let conversationScreenAttributes = [{"id":"ch_conv_screen"},{"class":"ch-conv-screen"}];
		var conversationScreen = this.utility.createElement("div", conversationScreenAttributes, null, chFrame);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_conv_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, conversationScreen);
		
		// Create loader
		let loaderAttributes = [{"id":"ch_conv_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);

		// Create header
		let headerAttributes = [{"class":"ch-header"}];
		let header = this.utility.createElement("div", headerAttributes, null, conversationScreen);

		// Create header wrapper
		let headerWrapperAttributes = [{"class":"ch-header-wrapper"}];
		let headerWrapper = this.utility.createElement("div", headerWrapperAttributes, null, header);

		// Create header wrapper left
		let headerLeftAttributes = [{"class":"ch-header-left"}];
		let headerLeft = this.utility.createElement("div", headerLeftAttributes, null, headerWrapper);

		// Create header wrapper center
		let headerCenterAttributes = [{"class":"ch-header-center"}];
		let headerCenter = this.utility.createElement("div", headerCenterAttributes, null, headerWrapper);

		// Create header wrapper right
		let headerRightAttributes = [{"class":"ch-header-right"}];
		let headerRight = this.utility.createElement("div", headerRightAttributes, null, headerWrapper);

		// Create header header title
		let titleAttributes = [{"class":"ch-header-title"},{"title":this.conversation.title}];
		let headerTitle = this.utility.createElement("span", titleAttributes, this.conversation.title, headerCenter);
		
		// Create header header watcher count div
		let headerWatchersAttributes = [{"class":"ch-header-watchers"}];
		let headerWatchers = this.utility.createElement("div", headerWatchersAttributes, null, headerLeft);
		
		let headerWatchersIconAttributes = [{"class":"ch-header-watchers-icon"},{"title":LANGUAGE_PHRASES.WATCHERS_COUNT}];
		let headerWatchersIcon = this.utility.createElement("i", headerWatchersIconAttributes, 'visibility', headerWatchers);
		headerWatchersIcon.classList.add("material-icons");

		let headerWatchersCountAttributes = [{"id":"ch_header_watchers_count"},{"class":"ch-header-watchers-count"}];
		let headerWatchersCount = this.utility.createElement("span", headerWatchersCountAttributes, this.conversation.watchersCount, headerWatchers);

		// Create logout div
		let headerLogoutAttributes = [{"class":"ch-header-logout"}];
		let headerLogout = this.utility.createElement("div", headerLogoutAttributes, null, headerRight);
		
		let headerLogoutIconAttributes = [{"id":"ch_logout_btn"},{"class":"ch-header-logout-icon"},{"title":LANGUAGE_PHRASES.LOGOUT}];
		let headerLogoutIcon = this.utility.createElement("i", headerLogoutIconAttributes, 'power_settings_new', headerLogout);
		headerLogoutIcon.classList.add("material-icons");

		// Create message box
		let msgsBoxAttributes = [{"id":"ch_messages_box"},{"class":"ch-messages-box"}];
		let messagesBox = this.utility.createElement("div", msgsBoxAttributes, null, conversationScreen);

		// Create send message div
		let sendBoxAttributes = [{"id":"ch_send_box"},{"class":"ch-send-box"}];
		let sendBox = this.utility.createElement("div", sendBoxAttributes, null, conversationScreen);

		// Create send message container
		let sendBoxContainerAttributes = [{"class":"ch-send-box-container"}];
		let sendBoxContainer = this.utility.createElement("div", sendBoxContainerAttributes, null, sendBox);

		// Create input box
		let inputBoxAttributes = [{"id":"ch_input_box"},{"class":"ch-input-box"}, {"type":"text"}, {"placeholder":LANGUAGE_PHRASES.SEND_MESSAGE}];
		this.utility.createElement("textarea", inputBoxAttributes, null, sendBoxContainer);

		// Create reply container view
		let replyContainerAttributes = [{"id":"ch_reply_container"},{"class":"ch-reply-container"}];
		let replyContainer = this.utility.createElement("div", replyContainerAttributes, null, sendBoxContainer);

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
		let mediaDocker = this.utility.createElement("div", mediaDockerAttributes, null, sendBoxContainer);

		// Create image messages option
		let imageOptionAttributes = [{"id":"ch_image_option"},{"class":"ch-image-option"}];
		let imageOption = this.utility.createElement("div", imageOptionAttributes, null, mediaDocker);

		// Create option icon span
		let imageIconSpanAttributes = [{"id":"ch_image_icon_span"},{"class":"ch-image-icon-span"}];
		let imageIconSpan = this.utility.createElement("span", imageIconSpanAttributes, null, imageOption);

		// Create image messages option icon
		let imageIconAttributes = [{"id":"ch_image_option_icon"},{"class":"ch-image-option-icon"},{"src":IMAGES.GALLERY_ICON},{"title":LANGUAGE_PHRASES.IMAGE}];
		this.utility.createElement("img", imageIconAttributes, null, imageIconSpan);

		// Create input for image
		let imageInputAttributes = [{"id":"ch_image_input"},{"class":"ch-msg-input"},{"type":"file"},{"accept":"image/*"},{"data-msg-type":"image"}];
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
		let audioIconAttributes = [{"id":"ch_audio_option_icon"},{"class":"ch-audio-option-icon"},{"src":IMAGES.AUDIO_ICON},{"title":LANGUAGE_PHRASES.AUDIO}];
		this.utility.createElement("img", audioIconAttributes, null, audioIconSpan);

		// Create input for audio
		let audioInputAttributes = [{"id":"ch_audio_input"},{"class":"ch-msg-input"},{"type":"file"},{"accept":"audio/*"},{"data-msg-type":"audio"}];
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
		let videoIconAttributes = [{"id":"ch_video_option_icon"},{"class":"ch-video-option-icon"},{"src":IMAGES.VIDEO_ICON},{"title":LANGUAGE_PHRASES.VIDEO}];
		this.utility.createElement("img", videoIconAttributes, null, videoIconSpan);

		// Create input for video
		let videoInputAttributes = [{"id":"ch_video_input"},{"class":"ch-msg-input"},{"type":"file"},{"accept":"video/*"},{"data-msg-type":"video"}];
		this.utility.createElement("input", videoInputAttributes, null, videoOption);

		// Create option name span for video
		let videoNameAttributes = [{"id":"ch_video_option_name"},{"class":"ch-video-option-name"}];
		this.utility.createElement("span", videoNameAttributes, LANGUAGE_PHRASES.VIDEO, videoOption);

		// Create attachment button
		let attachmentAttributes = [{"id":"ch_attachment_btn"},{"title":LANGUAGE_PHRASES.SEND_ATTACHMENTS}];
		let attachment = this.utility.createElement("i", attachmentAttributes, "add", sendBoxContainer);
		attachment.classList.add("material-icons", "ch-attachment-btn");

		// Create send button
		let sendButtonAttributes = [{"id":"ch_send_button"},{"class":"ch-send-button"}];
		let sendButton = this.utility.createElement("button", sendButtonAttributes, null, sendBoxContainer);

		// Create send icon
		let sendIconAttributes = [{"class":"ch-send-icon"}];
		let sendIcon = this.utility.createElement("i", sendIconAttributes, "send", sendButton);
		sendIcon.classList.add("material-icons");

		this._renderMessages();
	}

	_renderMessages(loadMoreMessages = false) {
		// Show loaders
		if (!loadMoreMessages) {
			this._showLoading(true);
		}

		// Get conversation messages
		this._getMessages(this.conversation, this.limit, this.messages.length, (err, messages) => {
			// Hide loader
			this._showLoading(false);

			if (err) return console.error(err);

			if (!messages.length) {
				return;
			}
			
			// Remove the last message date time elements.
			if (loadMoreMessages) {
				let lastMessageDateTimeEle = document.getElementById("ch_msg_datetime_" + this.messages[this.messages.length - 1]['id']);
				if (lastMessageDateTimeEle) {
					lastMessageDateTimeEle.remove();
				}
			}

			this.messages = this.messages.concat(messages);

			let messagesBox = document.getElementById("ch_messages_box");
			let firstMessage = messagesBox.childNodes[0];

			messages.forEach((message) => {
				// Update message object
				message = this._modifyMessage(message);

				// Create message frame
				this._createMessageBubble(message, messagesBox);

				let msgBubbleEle = document.getElementById(message.id);
				messagesBox.insertBefore(msgBubbleEle, messagesBox.childNodes[0]);
			});
			if (loadMoreMessages) {
				firstMessage.scrollIntoView();
			} else {
				messagesBox.scrollTop = messagesBox.scrollHeight;
			}
		});
	}
	
	_registerClickEventHandlers() {

		let logoutBtn = document.getElementById("ch_logout_btn");
		logoutBtn.addEventListener("click", (data) => {
			// Show loader
			this._showLoading(true);

			// Disconnect from channelize server
			this.chAdapter.disconnect("", (err, res) => {
				if(err) return console.error(err);

				// Delete cookies
				this.liveStream.setCookie("ch_live_stream_user_id", "", -1);
				this.liveStream.setCookie("ch_live_stream_access_token", "", -1);

				// Destory the conversation screen
				this.liveStream.destroyConversation();
			});
		});

		// Hide scroll menu and more option popup on click outside.
		let convScreenEle = document.getElementById("ch_conv_screen");
		convScreenEle.addEventListener("click", (data) => {
			// Hide the scroll menu container
			if (document.getElementById("ch_scroll_menu_container")) {
				document.getElementById("ch_scroll_menu_container").remove();
			}

			// Hide the more option container
			if (document.getElementById("ch_msg_option_container")) {
				document.getElementById("ch_msg_option_container").remove();
			}
		});

		// Send message on Enter press
		let input = document.getElementById("ch_input_box");
		input.addEventListener("keydown", (data) => {
			if (data.keyCode === 13) {
				data.preventDefault();
				this._showMediaIconsDocker(false);
				this._sendMessage("text");
			}
		});

		// Send button listener
		let sendButton = document.getElementById("ch_send_button");
		sendButton.addEventListener("click", (data) => {
			this._showMediaIconsDocker(false);
			this._sendMessage("text");
		});

		// Scroll message box listener
		let msgBox = document.getElementById("ch_messages_box");
		msgBox.addEventListener("scroll", (data) => {
			if (msgBox.scrollTop == 0) {
				this._renderMessages(true);
			}
		});

		// Attachment button listener
		let attachmentBtn = document.getElementById("ch_attachment_btn");
		attachmentBtn.addEventListener("click", (data) => {
			// Hide reply container
			this._showReplyContainer(false);
			// Toggle media message docker
			document.getElementById("ch_media_docker").classList.toggle("ch-show-docker");
		});

		// Send message on image/audio/video choose
		let attachmentFilePicker = document.getElementsByClassName("ch-msg-input");
		Array.from(attachmentFilePicker).forEach(filePickerInput => {
			filePickerInput.addEventListener("change", (data) => {
				document.getElementById("ch_media_docker").classList.toggle("ch-show-docker");
				if (data.target.files[0].size > 25000000) {
					this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				} else {
					this._sendMessage(filePickerInput.dataset.msgType);
				}
			});
		});

		// Reply container close button listener
		let closeReplyComposer = document.getElementById("ch_reply_composer_close_btn");
		closeReplyComposer.addEventListener("click", (data) => {
			this._showReplyContainer(false);
		});

	}

	_sendMessage(msgType) {
		let data = {
			id : uuid(),
			type : "normal"
		};

		switch(msgType) {
			case "text":
				this._sendTextMessage(data);
				break;

			case "image": case "audio": case "video":
				this._sendFileMessage(data, msgType);
				break;
		}
	}

	_sendTextMessage(data) {
		let inputValue = document.getElementById("ch_input_box").value;
		document.getElementById("ch_input_box").value = "";

		if (!inputValue.trim())
			return;
		
		data['body'] = inputValue;
		
		// Add reply message data
		if (document.getElementsByClassName("ch-reply-container ch-show-reply-container").length) {
			data['parentId'] = this.replyMessage['id'];
			data['type'] = 'reply';
			data['parentMessage'] = this.replyMessage;
			
			// Hide reply container
			this._showReplyContainer(false);
		}

		// Add pending message into list
		this._addPendingMessage(data);

		// Scroll to newly added dummy message
		let messagesBox = document.getElementById("ch_messages_box");
		messagesBox.scrollTop = messagesBox.scrollHeight;

		this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
			if (err) return console.error(err);
		});
	}

	_sendFileMessage(data, msgType) {
		// Show loading image
		let messagesBox = document.getElementById("ch_messages_box");
		let msgLoaderAttributes = [{"id":"ch_msg_loader"},{"class":"ch-msg-loader"}];
		let imageMsg = this.utility.createElement("div", msgLoaderAttributes, null, messagesBox);
		imageMsg.style.backgroundImage = "url(" + IMAGES.MESSAGE_LOADER + ")";
		imageMsg.scrollIntoView();


		let inputFile = document.getElementById("ch_" + msgType + "_input").files[0];

		// Upload file on channelize server
		this.chAdapter.uploadFile(inputFile, msgType, true, (err, fileData) => {
			if (err) return console.error(err);

			fileData.type = fileData.attachmentType;
			data['attachments'] = [fileData];

			// Send file message as attachment
			this.chAdapter.sendMessage(this.conversation, data, (err, message) => {
				if (err) return console.error(err);
			});
		});
	}

	_addPendingMessage(msgData) {
		msgData["ownerId"] = this.liveStream.userId;
		msgData['owner'] = this.loginUser;

		let messagesBox = document.getElementById("ch_messages_box");

		// Create message frame
		this._createMessageBubble(msgData, messagesBox, false, true);
	}

	_getMessages(conversation, limit, skip, cb) {
		let showInConversation = null;

		// If thread messing enable then only show message whose 'showInConversation' value is true.
		if (this.allowThreadMessage) {
			showInConversation = true;
		}
		
		this.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, null, showInConversation, (err, messages) => {
			if (err) return cb(err);
      
			return cb(null, messages);
		});
	}

	_modifyMessage(message) {
		if (!message) {
			return message;
		}

    if (message.isDeleted) {
    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
    }
    
    return message;
	}

	addNewMessage(message, newConversation) {
		// Convert message object to message model
		message = new Channelize.core.Message.Model(message);
		
		// No meta message show on live stream.
		if (message.type == "admin") {
			return;
		}

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

		/* Only add a new message on the conversation screen if thread messaging is disabled and
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

		// Hide message loader
		if (document.getElementById("ch_msg_loader") && message.ownerId == this.liveStream.userId) {
			document.getElementById("ch_msg_loader").remove();
		}

		if (message.conversationId != this.conversation.id || !messagesBox) {
			return;
		}

		message.createdAt = new Date();
		
		// Create message frame
		this._createMessageBubble(message, messagesBox, false);
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
				
				let msgReactionItemAttributes = [{"class":"ch-msg-reaction-item"},{"title":type}];
				let msgReactionItem = this.utility.createElement("li", msgReactionItemAttributes, null, msgReactionList);
				
				// Set the border radius
				msgReactionItem.style['border-radius'] = (message.reactionsCount[type] > 1) ? '15px' : '50%';
				
				// Create reaction icons span like 👍, 👎, 🌟.
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

	_createTextMessageInMessageBubble(message, parentDiv) {
		if (message.type == 'reply') {
			this._attachParentMessageInMessageBubble(message, parentDiv);
		}
		
		let msgBodyAttributes = [{"id":"ch_message_body_" + message.id},{"class":"ch-message-body"}];
		this.utility.createElement("p", msgBodyAttributes, message.body, parentDiv);
	}
	
	_attachParentMessageInMessageBubble(message, parentDiv) {
		let parentMessage = message.parentMessage;
		parentMessage = this._modifyMessage(parentMessage);

		// Show 'Reply of thread' if thread messaging is enabled and message showInConversation value is true
		if (this.allowThreadMessage && message.showInConversation) {
			let parentMessageAttachment = parentMessage.attachments && parentMessage.attachments[0];
  		let attachmentType = parentMessageAttachment ? parentMessageAttachment.type : '';
  		let parentMessageBody = parentMessage.body ? parentMessage.body : LANGUAGE_PHRASES[attachmentType.toLocaleUpperCase()];

  		let mainMessageAttachment = message.attachments && message.attachments[0];
			let msgSendConversationAttributes = [{"class": mainMessageAttachment ? 
						 "ch-attachments-message-reply-thread" : "ch-text-message-reply-thread"}];
			let msgSendConversationEle = this.utility.createElement("p", msgSendConversationAttributes, null, parentDiv);

			let replyOfThreadAttributes = [{"class": "ch-reply-of-thread"}];
			this.utility.createElement("span", replyOfThreadAttributes, LANGUAGE_PHRASES.REPLY_OF_THREAD + ": ", msgSendConversationEle);

			let parentMessageBodyAttributes = [{"class": "ch-parent-msg-body-" + parentMessage.id}];
			this.utility.createElement("span", parentMessageBodyAttributes, parentMessageBody, msgSendConversationEle);

			msgSendConversationEle.addEventListener("click", (data) => {
				this.liveStream.renderThreads(parentMessage, this.conversation);
			});
		}

		// Create reply message view container if thread messaging is disabled
		if (!this.allowThreadMessage && !message.isDeleted) {
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
			
			// Create reply container view
			let replyMsgContainerAttributes = [{"id":"ch_reply_msg_container_" + message.id},{"class": attachmentType ? "ch-reply-msg-container-attachment" : "ch-reply-msg-container"}];
			let replyContainer = this.utility.createElement("div", replyMsgContainerAttributes, null, parentDiv);

			// Create parent message owner name in reply message view
			let replyTitle = (parentMessage.ownerId == this.liveStream.userId) ? LANGUAGE_PHRASES.YOU : parentMessage.owner.displayName;
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
			let parentMsgBodyAttributes = [{"class":"ch-parent-msg"}];
			let parentMsgBodyEle = this.utility.createElement("p", parentMsgBodyAttributes, null, replyContainer);
			
			let parentMessageBodyAttributes = [{"class": "ch-parent-msg-body-" + parentMessage.id}];
			this.utility.createElement("span", parentMessageBodyAttributes, parentMessageBody, parentMsgBodyEle);

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
	}

	_createAttachmentCard(message, parentDiv) {
  	// Create message div
  	if (!message.body && Object.keys(message.attachments).length != 0) {
  		message.attachments.forEach(attachment => {
  			switch(attachment.type) {
  				case "image":
						let imageMsgAttributes = [{"class":"ch-image-message"}];
						let imageMsg = this.utility.createElement("div", imageMsgAttributes, null, parentDiv);
						imageMsg.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

						// Set image message listener
						imageMsg.addEventListener("click", event => {
							this.utility.openAttachmentFileInModel(attachment.fileUrl, "image");
						});
						break;
						
  				case "audio":
						let audioMsgAttributes = [{"class":"ch-audio-message"},{"src":attachment.fileUrl}];
						let audioTag = this.utility.createElement("audio", audioMsgAttributes, null, parentDiv);
						audioTag.setAttribute("controls",true);
					break;

					case "video":
						let videoMsgAttributes = [{"class":"ch-video-message"}];
						let videoMessage = this.utility.createElement("div", videoMsgAttributes, null, parentDiv);
						videoMessage.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

						// Create play icon
						let playIconAttributes = [{"id":"ch_play_icon"}];
						let playIcon = this.utility.createElement("i", playIconAttributes, "play_circle_outline", videoMessage);
						playIcon.classList.add("material-icons", "ch-play-icon");

						// Set video message listener
						videoMessage.addEventListener("click", data => {
							this.utility.openAttachmentFileInModel(attachment.fileUrl, "video");
						});
						break;

					case "sticker":
						let stickerMsgAttributes = [{"class":"ch-sticker-message"}];
						let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, parentDiv);
						stickerMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
						break;

					case "gif":
						let gifMsgAttributes = [{"class":"ch-sticker-message"}];
						let gifMsg = this.utility.createElement("div", gifMsgAttributes, null, parentDiv);
						gifMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
						break;

					case "location":
						let locationSrc = SETTINGS.LOCATION_IMG_URL + "?center=" +
				  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
				  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;

				  		let locationMsgAttributes = [{"class":"ch-location-message"}];
							let locationMsg = this.utility.createElement("div", locationMsgAttributes, null, parentDiv);
							locationMsg.style.backgroundImage = "url(" + locationSrc + ")";

							// Set location message listener
							locationMsg.addEventListener("click", data => {
								let mapUrl = "https://www.google.com/maps?z=15&t=m&q=loc:" + attachment.latitude + "," + attachment.longitude;
								window.open(mapUrl, "_blank");
							});
						break;
  			}
	  	});
  	}
	}

	_registerReactionClickEvent(message, addReactionEle, msgBubbleEle) {
		addReactionEle.addEventListener("click", (event) => {
			event.stopPropagation();
			this._createReactionsListing(message, msgBubbleEle);
		});
	}
	
	_createReactionsListing(message, msgBubbleEle) {
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
		let scrollMenuContainer = this.utility.createElement("div", scrollMenuContainerAttributes, null, msgBubbleEle);

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
			if (reactionTypeObj && reactionTypeObj.indexOf(this.liveStream.userId) != -1) {
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
            if (reactionTypeObj && reactionTypeObj.indexOf(this.liveStream.userId) != -1) {
				// Update message reactions
				var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(this.liveStream.userId);
				if (memberIndex != -1) {
					this.messages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
					this.messages[messageIndex]["reactionsCount"][reactionType] --;
				}

				this.chAdapter.removeReaction(message, { type: reactionType }, (err, res) => {
        		});
			} else {
				// Update message reactions
				if(this.messages[messageIndex]["reactions"][reactionType]) {
					var memberIndex = this.messages[messageIndex]["reactions"][reactionType].indexOf(this.liveStream.userId);
					if (memberIndex == -1) {
						this.messages[messageIndex]["reactions"][reactionType].push(this.liveStream.userId);
						this.messages[messageIndex]["reactionsCount"][reactionType] ++;
					}
				} else {
					const reactionData = this.messages[messageIndex]["reactions"];
					reactionData[reactionType] = [this.liveStream.userId];
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

	_registerMoreOptionClickEvent(message, moreOption, msgBubbleEle) {
		moreOption.addEventListener("click", (event) => {
			event.stopPropagation();
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
			let msgOptionsContainer = this.utility.createElement("div", msgOptionsContainerAttributes, null, msgBubbleEle);

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

			if (!message.isDeleted && message.ownerId == this.liveStream.userId) {
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
				let replyMsgOption = this.utility.createElement("div", replyMsgAttributes, LANGUAGE_PHRASES.REPLY, msgOptionsContainer);
				
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
					this.liveStream.renderThreads(message, this.conversation);
				});
			}

			if (this.allowThreadMessage && message.replyCount) {
				// Create view thread option
				let viewThreadAttributes = [{"id":"ch_msg_view_thread"},{"class":"ch-msg-view-thread"}];
				let viewThreadOption = this.utility.createElement("div", viewThreadAttributes, LANGUAGE_PHRASES.VIEW_THREAD, msgOptionsContainer);
				
				// Add listener on view thread
				viewThreadOption.addEventListener("click", (data) => {
					msgOptionsContainer.remove();
					this.liveStream.renderThreads(message, this.conversation);
				});
			}
		});
	}

	openReplyMessageComposerBox(message) {
		// Hide media docker
		this._showMediaIconsDocker(false);
		// Show reply container
		this._showReplyContainer(true);

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
		let replyTitle = (message.ownerId == this.liveStream.userId) ? LANGUAGE_PHRASES.YOU : message.owner.displayName;
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
	
	_isDateDiffShown(messageId) {
		const messageIndex = this.messages.findIndex(message => message.id == messageId);
    if (messageIndex == -1) {
    	return false;
    }

  	if (!this.messages[messageIndex + 1]) {
  		return true;
  	}

  	const currentMsgDate = moment(new Date(this.messages[messageIndex].createdAt)).format('DD/MM/YYYY');
  	const nextMsgDate = moment(new Date(this.messages[messageIndex + 1].createdAt)).format('DD/MM/YYYY');
  	
  	if (currentMsgDate != nextMsgDate) {
  		return true;
  	}
  	return false
	}

	_createMessageBubble(message, messagesBox, showDateDiff = true, isPendingMessage = false) {
		// Create message list
		let msgBubbleEleAttributes = [{"id":message.id},{"class":"ch-msg-bubble"}];
		let msgBubbleEle = this.utility.createElement("div", msgBubbleEleAttributes, null, messagesBox);

		if(showDateDiff && this._isDateDiffShown(message.id)) {
			let msgDateTimeAttributes = [{"id":"ch_msg_datetime_" + message.id},{"class":"ch-msg-datetime"}];
			this.utility.createElement("div", msgDateTimeAttributes, this.utility.formatDate(message.createdAt), msgBubbleEle);
		}
		
		// Create message owner info div
		let msgInfoAttributes = [{"class":"ch-msg-info"}];
		let msgInfo = this.utility.createElement("div", msgInfoAttributes, null, msgBubbleEle);

		// Create message owner name span
		let msgOwnerNameAttributes = [{"class":"ch-msg-owner-name"}];
		let msgOwnerName = this.utility.createElement("span", msgOwnerNameAttributes, message.owner.displayName, msgInfo);

		// Create message time span
		let createdAt = message.createdAt;
		if (!createdAt) {
			createdAt = new Date();
		}
		let msgTimeAttributes = [{"class":"ch-msg-time"}];
		if (isPendingMessage) {
			let msgTime = this.utility.createElement("i", msgTimeAttributes, "schedule", msgInfo);
			msgTime.classList.add("material-icons");
		} else {
			let msgTime = this.utility.createElement("span", msgTimeAttributes, moment(new Date(createdAt)).format('hh:mm A'), msgInfo);
		}
		
		// Create message container
		let msgContainerAttributes = [{"class":"ch-msg-container ch-left"}];
		let msgContainer = this.utility.createElement("div", msgContainerAttributes, null, msgBubbleEle);

		// Create message more options
		let moreOptionAttributes = [{"class":"ch-msg-more-option ch-right"},{"title":LANGUAGE_PHRASES.MORE_OPTIONS}];
		let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgBubbleEle);
		moreOption.classList.add("material-icons");

		// Add event listiner on more option
		this._registerMoreOptionClickEvent(message, moreOption, msgBubbleEle);

		// Create message div
		let msgDivAttributes = [{"id":"ch_message_" + message.id},{"class":"ch-message"}];
		let msgDiv = this.utility.createElement("div", msgDivAttributes, null, msgContainer);

		// Create add reaction div.
		if (this.reactionsSetting.enable && message.ownerId != this.liveStream.userId && !message.isDeleted) {
			let addReactionEleAttributes = [{"class":"ch-add-reaction-option"},{"title":LANGUAGE_PHRASES.REACT_TO_THIS_MESSAGE}];
			let addReactionEle = this.utility.createElement("i", addReactionEleAttributes, "insert_emoticon", msgBubbleEle);
			addReactionEle.classList.add("material-icons");

			// Add event listiner on add reaction option
			this._registerReactionClickEvent(message, addReactionEle, msgBubbleEle);
		}

		// Create message and reply message frame
		this._createTextMessageInMessageBubble(message, msgDiv);

		// Create media message frame
		this._createAttachmentCard(message, msgDiv);

		// Create added message reaction view
		if (this.reactionsSetting.enable && !message.isDeleted) {
			this._createMessageReactionFrame(message, msgDiv);
		}

		// Create message reply count container
		let msgReplyCountContainerAttributes = [{"id":"ch_reply_count_container_" + message.id},{"class":"ch-msg-reply-count-container"}];
		let msgReplyCountContainer = this.utility.createElement("div", msgReplyCountContainerAttributes, null, msgContainer);
		
		// Create message reply count icon view
		let msgReplyIconAttributes = [{"class":"ch-msg-reply-count-icon"}];
		let msgReplyIcon = this.utility.createElement("i", msgReplyIconAttributes, "subdirectory_arrow_right", msgReplyCountContainer);
		msgReplyIcon.classList.add("material-icons");

		// Create message reply count span
		let msgReplyCountAttributes = [{"id":"ch_reply_count_" + message.id},{"class":"ch-msg-reply-count"}];
		let msgReplyCount = this.utility.createElement("span", msgReplyCountAttributes, null, msgReplyCountContainer);

		msgReplyCount.addEventListener("click", (data) => {
			this.liveStream.renderThreads(message, this.conversation);
		});

		// Set reply icon and count
		if (this.allowThreadMessage && message.replyCount) {
			msgReplyCountContainer.classList.add("show");
			msgReplyCount.innerHTML = message.replyCount  + " " + LANGUAGE_PHRASES.REPLIES;
		}
	}

	updateDeleteForEveryoneMsg(data) {
		if (this.conversation.id != data.conversation.id) {
			return;
		}

		const messageId = data.messages[0].id;
    const messageIndex = this.messages.findIndex(message => message.id == messageId);
    if (messageIndex == -1) {
    	return;
    }

    this.messages[messageIndex]['isDeleted'] = true;
    this.messages[messageIndex] = this._modifyMessage(this.messages[messageIndex]);

  	// Update text of deleted message
  	let convTargetMsg = document.getElementById("ch_message_" + messageId);
		if (convTargetMsg) {
			convTargetMsg.innerHTML = this.messages[messageIndex]['body'];
		}

		// If the deleted message is child of any message then update the child message.
		let parentMsgBody = document.getElementsByClassName("ch-parent-msg-body-" + messageId);
		parentMsgBody = Array.from(parentMsgBody);
		if (parentMsgBody.length) {
			Array.from(parentMsgBody).forEach(item => {
			  item.innerHTML = this.messages[messageIndex]['body'];
			});
		}

		// Update listener of deleted message
  	let targetMessage = document.getElementById(messageId)
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

	handleStartWatching(data) {
		if (data.conversation.id != this.conversation.id) {
			return;
		}
		let conversation = data.conversation;
		this.conversation.watchersCount = conversation.watchersCount;
		let headerWatchersCount = document.getElementById("ch_header_watchers_count");
		if (headerWatchersCount) {
			headerWatchersCount.innerText = this.conversation.watchersCount;
		}
	}

	handleStopWatching(data) {
		if (data.conversation.id != this.conversation.id) {
			return;
		}
		let conversation = data.conversation;
		this.conversation.watchersCount = conversation.watchersCount;
		let headerWatchersCount = document.getElementById("ch_header_watchers_count");
		if (headerWatchersCount) {
			headerWatchersCount.innerText = this.conversation.watchersCount;
		}
	}

	_showMediaIconsDocker(value) {
		if (value) {
			document.getElementById("ch_media_docker").classList.add("ch-show-docker");
		} else {
			document.getElementById("ch_media_docker").classList.remove("ch-show-docker");
		}
	}

	_showReplyContainer(value) {
		if (value) {
			document.getElementById("ch_reply_container").classList.add('ch-show-reply-container');
		} else {
			document.getElementById("ch_reply_container").classList.remove('ch-show-reply-container');
		}
	}

	_showLoading(show) {
		if (show) {
			document.getElementById("ch_conv_loader_container").style.display = "block";
		} else {
			document.getElementById("ch_conv_loader_container").style.display = "none";
		}
	}
}

export { Conversation as default };