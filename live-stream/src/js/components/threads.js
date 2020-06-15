import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
import moment from 'moment';
import { LANGUAGE_PHRASES, SETTINGS, IMAGES } from "../constants.js";

class Threads {
	constructor(liveStream, parentMessage, conversation) {
		this.liveStream = liveStream;
		this.chAdapter = liveStream.chAdapter;

		this.parentMessage = new Channelize.core.Message.Model(parentMessage);
		this.conversation = conversation;

		this.utility = new Utility();
		
		this.loadCount = 0;
		this.limit = 25;
		this.skip = 0;
		this.threadsMessages = [this.parentMessage];
		this.loginUser = this.chAdapter.getLoginUser();

		// Message reactions config
		this.reactionsSetting= SETTINGS.REACTION_SETTINGS;
		this.reactionsTypes = [];
		this.enableScrolling = false;
		this.scrollMenuWidth = 0;

		this._createThreadsLayout();
		this._registerClickEventHandlers();
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

	_createThreadsLayout() {
		// Remove previous threads screen if exist
		let olderThreadScreen = document.getElementById("ch_thread_screen");
		if (olderThreadScreen) {
			olderThreadScreen.remove();
		}

		// Create threads box components
		let chFrame = document.getElementById("ch_frame");
		let threadScreenAttributes = [{"id": "ch_thread_screen"},{"class":"ch-thread-screen"}];
		let threadScreen = this.utility.createElement("div", threadScreenAttributes, null, chFrame);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_thread_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, threadScreen);
		
		// Create loader
		let loaderAttributes = [{"id":"ch_thread_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);
		
		// Create header
		let headerAttributes = [{"class":"ch-header"}];
		let header = this.utility.createElement("div", headerAttributes, null, threadScreen);

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

		// Create header header close btn
		let headerThreadCloseBtnAttributes = [{"id":"ch_thread_close_btn"},{"title":LANGUAGE_PHRASES.BACK}];
		let headerThreadCloseBtn = this.utility.createElement("i", headerThreadCloseBtnAttributes, "arrow_back", headerLeft);
		headerThreadCloseBtn.classList.add("material-icons", "ch-header-close-btn");

		// Create threads header title
		let threadHeaderTitleAttributes = [{"class":"ch-header-title"}];
		let threadHeaderTitle = this.utility.createElement("span", threadHeaderTitleAttributes, LANGUAGE_PHRASES.THREAD, headerCenter);

		// Create threads header subtitle
		let threadHeaderSubtitleAttributes = [{"class":"ch-header-subtitle"}];
		let threadHeaderSubtitle = this.utility.createElement("div", threadHeaderSubtitleAttributes, null, headerCenter);

		// Create threads header reply count
		let threadHeaderReplyCountAttributes = [{"id":"ch_thread_header_reply_count"},{"class":"ch-header-reply-count"}];
		let threadHeaderReplyCount = this.utility.createElement("span", threadHeaderReplyCountAttributes, this.parentMessage.replyCount, threadHeaderSubtitle);

		// Create threads header reply title
		let threadHeaderReplyAttributes = [{"class":"ch-header-reply"}];
		let threadHeaderReply = this.utility.createElement("span", threadHeaderReplyAttributes, LANGUAGE_PHRASES.REPLIES, threadHeaderSubtitle);

		// Create threads listing box
		let parentMessageBoxAttributes = [{"id":"ch_thread_parent_msg_box"},{"class":"ch-thread-parent-msg-box"}];
		this.utility.createElement("div", parentMessageBoxAttributes, null, threadScreen);
		
		// Create threads listing box
		let threadMesssagesBoxAttributes = [{"id":"ch_thread_messages_box"},{"class":"ch-thread-messages-box ch-messages-box"}];
		let threadMesssagesBox = this.utility.createElement("div", threadMesssagesBoxAttributes, null, threadScreen);

		// Create send as direct message view
		let sendDirectMsgBoxAttributes = [{"id":"ch_send_direct_msg_box"},{"class":"ch-send-direct-msg-box"}];
		let sendDirectMsgBox = this.utility.createElement("div", sendDirectMsgBoxAttributes, null, threadScreen);

		// Create checkbox
		let sendDirectMsgCheckboxAttributes = [{"id":"ch_send_direct_msg_checkbox"},{"class":"ch-send-direct-msg-checkbox"},{"type":"checkbox"}];
		let sendDirectMsgCheckbox = this.utility.createElement("input", sendDirectMsgCheckboxAttributes, null, sendDirectMsgBox);

		// Create checkbox
		let sendDirectMsgLabelAttributes = [{"id":"ch_send_direct_msg_label"},{"class":"ch-send-direct-msg-label"},{"for":"ch_send_direct_msg_checkbox"}];
		let sendDirectMsgLabel = this.utility.createElement("label", sendDirectMsgLabelAttributes, LANGUAGE_PHRASES.SEND_DIRECT_MESSAGE, sendDirectMsgBox);

		// Create threads listing box
		let threadSendBoxAttributes = [{"id":"ch_thread_send_box"},{"class":"ch-thread-send-box"}];
		let threadSendBox = this.utility.createElement("div", threadSendBoxAttributes, null, threadScreen);

		// Create send message container
		let sendBoxContainerAttributes = [{"class":"ch-thread-send-box-container"}];
		let sendBoxContainer = this.utility.createElement("div", sendBoxContainerAttributes, null, threadSendBox);

		// Create input box
		let inputThreadsBoxAttributes = [{"id":"ch_thread_input_box"},{"class":"ch-thread-input-thread-box"}, {"type":"text"}, {"placeholder":LANGUAGE_PHRASES.SEND_MESSAGE}];
		this.utility.createElement("textarea", inputThreadsBoxAttributes, null, sendBoxContainer);

		// Create media messages docker
		let mediaThreadDockerAttributes = [{"id":"ch_thread_media_docker"},{"class":"ch-thread-media-docker"}];
		let mediaThreadDocker = this.utility.createElement("div", mediaThreadDockerAttributes, null, sendBoxContainer);

		// Create image messages option
		let imageOptionAttributes = [{"id":"ch_thread_image_option"},{"class":"ch-thread-image-option"}];
		let imageOption = this.utility.createElement("div", imageOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let imageIconSpanAttributes = [{"id":"ch_thread_image_icon_span"},{"class":"ch-thread-image-icon-span"}];
		let imageIconSpan = this.utility.createElement("span", imageIconSpanAttributes, null, imageOption);

		// Create image messages option icon
		let imageIconAttributes = [{"id":"ch_thread_image_option_icon"},{"class":"ch-thread-image-option-icon"},{"src":IMAGES.GALLERY_ICON},{"title":LANGUAGE_PHRASES.IMAGE}];
		this.utility.createElement("img", imageIconAttributes, null, imageIconSpan);

		// Create input for image
		let imageInputAttributes = [{"id":"ch_thread_image_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"image/*"},{"data-msg-type":"image"}];
		this.utility.createElement("input", imageInputAttributes, null, imageOption);

		// Create option name span for image
		let imageNameAttributes = [{"id":"ch_thread_image_option_name"},{"class":"ch-thread-image-option-name"}];
		this.utility.createElement("span", imageNameAttributes, LANGUAGE_PHRASES.IMAGE, imageOption);

		// Create audio messages option
		let audioOptionAttributes = [{"id":"ch_thread_audio_option"},{"class":"ch-thread-audio-option"}];
		let audioOption = this.utility.createElement("div", audioOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let audioIconSpanAttributes = [{"id":"ch_thread_audio_icon_span"},{"class":"ch-thread-audio-icon-span"}];
		let audioIconSpan = this.utility.createElement("span", audioIconSpanAttributes, null, audioOption);

		// Create audio messages option icon
		let audioIconAttributes = [{"id":"ch_thread_audio_option_icon"},{"class":"ch-thread-audio-option-icon"},{"src":IMAGES.AUDIO_ICON},{"title":LANGUAGE_PHRASES.AUDIO}];
		this.utility.createElement("img", audioIconAttributes, null, audioIconSpan);

		// Create input for audio
		let audioInputAttributes = [{"id":"ch_thread_audio_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"audio/*"},{"data-msg-type":"audio"}];
		this.utility.createElement("input", audioInputAttributes, null, audioOption);

		// Create option name span for audio
		let audioNameAttributes = [{"id":"ch_thread_audio_option_name"},{"class":"ch-thread-audio-option-name"}];
		this.utility.createElement("span", audioNameAttributes, LANGUAGE_PHRASES.AUDIO, audioOption);

		// Create video messages option
		let videoOptionAttributes = [{"id":"ch_thread_video_option"},{"class":"ch-thread-video-option"}];
		let videoOption = this.utility.createElement("div", videoOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let videoIconSpanAttributes = [{"id":"ch_thread_video_icon_span"},{"class":"ch-thread-video-icon-span"}];
		let videoIconSpan = this.utility.createElement("span", videoIconSpanAttributes, null, videoOption);

		// Create video messages option icon
		let videoIconAttributes = [{"id":"ch_thread_video_option_icon"},{"class":"ch-thread-video-option-icon"},{"src":IMAGES.VIDEO_ICON},{"title":LANGUAGE_PHRASES.VIDEO}];
		this.utility.createElement("img", videoIconAttributes, null, videoIconSpan);

		// Create input for video
		let videoInputAttributes = [{"id":"ch_thread_video_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"video/*"},{"data-msg-type":"video"}];
		this.utility.createElement("input", videoInputAttributes, null, videoOption);

		// Create option name span for video
		let videoNameAttributes = [{"id":"ch_thread_video_option_name"},{"class":"ch-thread-video-option-name"}];
		this.utility.createElement("span", videoNameAttributes, LANGUAGE_PHRASES.VIDEO, videoOption);

		// Create attachment button
		let attachmentAttributes = [{"id":"ch_thread_attachment_btn"},{"title":LANGUAGE_PHRASES.SEND_ATTACHMENTS}];
		let attachment = this.utility.createElement("i", attachmentAttributes, "add", sendBoxContainer);
		attachment.classList.add("material-icons", "ch-thread-attachment-btn");

		// Create send button
		let sendButtonAttributes = [{"id":"ch_thread_send_button"},{"class":"ch-thread-send-button"}];
		let sendButton = this.utility.createElement("button", sendButtonAttributes, null, sendBoxContainer);

		// Create send icon
		let sendIconAttributes = [{"class":"ch-thread-send-icon"}];
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
		this._getMessages(this.conversation, this.limit, this.threadsMessages.length - 1, (err, messages) => {
			// Hide loader
			this._showLoading(false);

			if (err) return console.error(err);

			let messagesBox = document.getElementById("ch_thread_messages_box");
			if (!messages.length) {
				this._createParentMessageBubble(this.parentMessage, messagesBox);
				return;
			}

			// Remove the last message date time elements.
			let lastMessageDateTimeEle = document.getElementById("ch_thread_msg_datetime_" + 
				this.threadsMessages[this.threadsMessages.length - 1]['id']);
			if (lastMessageDateTimeEle) {
				lastMessageDateTimeEle.remove();
			}

			this.threadsMessages = this.threadsMessages.concat(messages);

			let firstMessage = messagesBox.childNodes[0];
			
			messages.forEach((message) => {
				if (message.id == this.parentMessage.id) {
					return;
				}
				// Update message object
				message = this._modifyMessage(message);

				// Create message frame
				this._createMessageBubble(message, messagesBox);

				let msgBubbleEle = document.getElementById("thread_" + message.id);
				messagesBox.insertBefore(msgBubbleEle, messagesBox.childNodes[0]);
			});

			// Parent message div
			if (messages.length != this.limit) {
				this._createParentMessageBubble(this.parentMessage, messagesBox);
			}

			if (loadMoreMessages) {
				firstMessage.scrollIntoView();
			} else {
				messagesBox.scrollTop = messagesBox.scrollHeight;
			}
		});
	}
	
	_createParentMessageBubble(message, messagesBox) {
		
		let threadStart = document.getElementById("ch_thread_start");
		if (!threadStart) {
			// Create message frame
			this._createMessageBubble(message, messagesBox, false);

			// Create a line breaker b/w parent and chid message.
			let threadStartAttributes = [{"id":"ch_thread_start"},{"class":"ch-thread-start ch-msg-bubble"}];
			let threadStart = this.utility.createElement("div", threadStartAttributes, null, messagesBox);

			let threadLineSpanAttributes = [];
			let threadLineSpan = this.utility.createElement("span", threadLineSpanAttributes, LANGUAGE_PHRASES.START_OF_A_NEW_THREAD, threadStart);

			// Set parent message and line breaker position
			let parentMessage = document.getElementById("thread_" + message.id);
			messagesBox.insertBefore(parentMessage, messagesBox.childNodes[0]);
			messagesBox.insertBefore(threadStart, messagesBox.childNodes[1]);

			// Add date time on the top of the parent message.
			let msgDateTimeAttributes = [{"id":"ch_thread_msg_datetime_" + message.id},{"class":"ch-msg-datetime"}];
			let msgDateTimeEle = this.utility.createElement("div", msgDateTimeAttributes, this.utility.formatDate(message.createdAt), null);
			messagesBox.insertBefore(msgDateTimeEle, messagesBox.childNodes[0]);
		}
	}

	_createTextMessageInMessageBubble(message, parentDiv) {
		// Create Also sent to the conversation
		if (message.id != this.parentMessage.id && message.showInConversation) {
			let attachment = message.attachments && message.attachments[0];
			
			let msgSendConversationAttributes = [{"class": attachment ? 
						 "ch-attachments-message-sent-conversation" : "ch-text-message-sent-conversation"}];

			this.utility.createElement("p", msgSendConversationAttributes, LANGUAGE_PHRASES.SEND_TO_CONVERSATION, parentDiv);
		}
		
		// Create message body view
		let msgBodyAttributes = [{"id":"ch_thread_message_body_" + message.id},{"class":"ch-message-body"}];
		this.utility.createElement("p", msgBodyAttributes, message.body, parentDiv);
	}

	_createAttachmentCard(message, parentDiv) {
	  	// Create message div
	  	if (!message.body && Object.keys(message.attachments).length != 0) {
	  		message.attachments.forEach(attachment => {

	  			switch(attachment.type) {
	  				case "image":
							let imageMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-image-message"}];
							let imageMsg = this.utility.createElement("div", imageMsgAttributes, null, parentDiv);
							imageMsg.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

							// Set image message listener
							imageMsg.addEventListener("click", data => {
								this.utility.openAttachmentFileInModel(attachment.fileUrl, "image");
							});
							break;
							
	  				case "audio":
	  					let audioMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-audio-message"},{"src":attachment.fileUrl}];
							let audioTag = this.utility.createElement("audio", audioMsgAttributes, null, parentDiv);
							audioTag.setAttribute("controls",true);
						break;

						case "video":
							let videoMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-video-message"}];
							let videoMessage = this.utility.createElement("div", videoMsgAttributes, null, parentDiv);
							videoMessage.style.backgroundImage = "url(" + attachment.thumbnailUrl + ")";

							// Create play icon
							let playIconAttributes = [{"class":"ch-video-icon"}];
							let playIcon = this.utility.createElement("i", playIconAttributes, "play_circle_outline", videoMessage);
							playIcon.classList.add("material-icons", "ch-play-icon");

							// Set video message listener
							videoMessage.addEventListener("click", data => {
								this.utility.openAttachmentFileInModel(attachment.fileUrl, "video");
							});
							break;

						case "sticker":
							let stickerMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-sticker-message"}];
							let stickerMsg = this.utility.createElement("div", stickerMsgAttributes, null, parentDiv);
							stickerMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
							break;

						case "gif":
							let gifMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-sticker-message"}];
							let gifMsg = this.utility.createElement("div", gifMsgAttributes, null, parentDiv);
							gifMsg.style.backgroundImage = "url(" + attachment.originalUrl + ")";
							break;

						case "location":
							let locationSrc = SETTINGS.LOCATION_IMG_URL + "?center=" +
					  		attachment.latitude + "," + attachment.longitude + "&zoom=15&size=208x100&maptype=roadmap&markers=color:red%7C" +
					  		attachment.latitude + "," + attachment.longitude + "&key=" + SETTINGS.LOCATION_API_KEY;

				  		let locationMsgAttributes = [{"id":"ch_thread_attachment_card_" + message.id},{"class":"ch-location-message"}];
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

	_modifyMessage(message) {
		if (!message) {
			return message;
		}

    if (message.isDeleted) {
    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
    }

    return message;
	}

	_registerMoreOptionClickEvent(message, moreOption, msgBubbleEle) {
		moreOption.addEventListener("click", (event) => {
			event.stopPropagation();
			if (document.getElementById("ch_thread_msg_option_container")) {
				document.getElementById("ch_thread_msg_option_container").remove();
				return;
			}

			if (document.getElementById("ch_thread_scroll_menu_container")) {
				document.getElementById("ch_thread_scroll_menu_container").remove();
			}

			// Create delete message for everyone option
			if (!message.isDeleted && message.ownerId == this.liveStream.userId) {
				// Create message options container
				let msgOptionsContainerAttributes = [{"id":"ch_thread_msg_option_container"},{"class":"ch-msg-option-container"}];
				let msgOptionsContainer = this.utility.createElement("div", msgOptionsContainerAttributes, null, msgBubbleEle);

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
		});
	}

	_registerClickEventHandlers() {

		// Hide scroll menu and more option popup on click outside this popup.
		let threadScreenEle = document.getElementById("ch_thread_screen");
		threadScreenEle.addEventListener("click", (data) => {
			// Hide the scroll menu container
			if (document.getElementById("ch_thread_scroll_menu_container")) {
				document.getElementById("ch_thread_scroll_menu_container").remove();
			}

			// Hide the more option container
			if (document.getElementById("ch_thread_msg_option_container")) {
				document.getElementById("ch_thread_msg_option_container").remove();
			}
		});

		// Close search button listener
		let closeBtn = document.getElementById("ch_thread_close_btn");
		if (closeBtn) {
			closeBtn.addEventListener("click", (data) => {
				this.liveStream.destroyThreads();
			});
		}

		// Send message on Enter press
		let input = document.getElementById("ch_thread_input_box");
		input.addEventListener("keydown", (data) => {
			if (data.keyCode === 13) {
				data.preventDefault();
				this._showMediaIconsDocker(false);
				this._sendMessage("text");
			}
		});

		// Send button listener
		let sendButton = document.getElementById("ch_thread_send_button");
		sendButton.addEventListener("click", (data) => {
			this._showMediaIconsDocker(false);
			this._sendMessage("text");
		});

		// Scroll message box listener
		let msgBox = document.getElementById("ch_thread_messages_box");
		msgBox.addEventListener("scroll", (data) => {
			if (msgBox.scrollTop == 0) {
				this._renderMessages(true);
			}
		});

		// Attachment button listener
		let attachmentBtn = document.getElementById("ch_thread_attachment_btn");
		attachmentBtn.addEventListener("click", (data) => {
			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
		});

		// Send message on image/audio/video choose
		let attachmentFilePicker = document.getElementsByClassName("ch-thread-msg-input");
		Array.from(attachmentFilePicker).forEach(filePickerInput => {
			filePickerInput.addEventListener("change", (data) => {
				document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
				if (data.target.files[0].size > 25000000) {
					this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				} else {
					this._sendMessage(filePickerInput.dataset.msgType);
				}
			});
		});
	}

	_sendMessage(msgType) {
		// Uncheck the checkbox
		let showInConversation = document.getElementById("ch_send_direct_msg_checkbox").checked;
		if (showInConversation) {
			document.getElementById("ch_send_direct_msg_checkbox").checked = false;
		}

		let data = {
			id : uuid(),
			type : "reply",
			parentId: this.parentMessage.id,
			parentMessage : this.parentMessage,
			showInConversation
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
		let inputValue = document.getElementById("ch_thread_input_box").value;
		document.getElementById("ch_thread_input_box").value = "";

		if (!inputValue.trim()) {
			return;
		}

		data['body'] = inputValue;

		// Add pending message into list
		this._addPendingMessage(data);

		// Scroll to newly added dummy message
		let messagesBox = document.getElementById("ch_thread_messages_box");
		messagesBox.scrollTop = messagesBox.scrollHeight;

		this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
			if (err) return console.error(err);
		});
	}

	_sendFileMessage(data, msgType) {
		// Show loading image
		let messagesBox = document.getElementById("ch_thread_messages_box");
		let msgLoaderAttributes = [{"id":"ch_thread_msg_loader"},{"class":"ch-msg-loader"}];
		let imageMsg = this.utility.createElement("div", msgLoaderAttributes, null, messagesBox);
		imageMsg.style.backgroundImage = "url(" + IMAGES.MESSAGE_LOADER + ")";
		imageMsg.scrollIntoView();

		let inputFile = document.getElementById("ch_thread_" + msgType + "_input").files[0];

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

		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Create message frame
		this._createMessageBubble(msgData, messagesBox, false, true);
	}

	addNewMessage(message, newConversation) {
		/* Only add a new message on the threads if a new message is a reply and parent message-id 
		match to currently open thread parent message-id. */
		if (message.type != "reply" || message.parentMessage.id != this.parentMessage.id) {
			return;
		}

		// Change parent message count or Change header reply count.return
		document.getElementById("ch_thread_header_reply_count").innerHTML = message.parentMessage.replyCount;

		// Set new conversation to replace dummy conversation
		if (newConversation) {
			this.conversation = newConversation;
		}
		// Convert message object to message model
		message = new Channelize.core.Message.Model(message);

		message = this._modifyMessage(message);
		this.threadsMessages.push(message);

		// Remove pending dummy message
		let dummyMessage = document.getElementById("thread_" + message.id);
		if (dummyMessage) {
			dummyMessage.remove();
		}

		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Hide message loader
		if (document.getElementById("ch_thread_msg_loader") && message.ownerId == this.liveStream.userId) {
			document.getElementById("ch_thread_msg_loader").remove();
		}

		if (message.conversationId != this.conversation.id || !messagesBox)
			return;

		message.createdAt = new Date();

		// Create message frame
		this._createMessageBubble(message, messagesBox, false);
	}

	_getMessages(conversation, limit, skip, cb) {
		this.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, this.parentMessage.id, null, (err, messages) => {
			if (err) return cb(err);

			return cb(null, messages);
		});
	}

	_isDateDiffShown(messageId) {
  	const messageIndex = this.threadsMessages.findIndex(message => message.id == messageId);
    if (messageIndex == -1) {
    	return false;
    }

  	if (!this.threadsMessages[messageIndex + 1]) {
  		return true;
  	}

  	const currentMsgDate = moment(new Date(this.threadsMessages[messageIndex].createdAt)).format('DD/MM/YYYY');
  	const nextMsgDate = moment(new Date(this.threadsMessages[messageIndex + 1].createdAt)).format('DD/MM/YYYY');
  	
  	if (currentMsgDate != nextMsgDate) {
  		return true;
  	}
  	return false
	}

	_createMessageBubble(message, messagesBox, showDateDiff = true, isPendingMessage = false) {
		// Create message list
		let msgBubbleEleAttributes = [{"id":"thread_" + message.id},{"class":"ch-msg-bubble"}];
		let msgBubbleEle = this.utility.createElement("div", msgBubbleEleAttributes, null, messagesBox);

		if(showDateDiff && this._isDateDiffShown(message.id)) {
			let msgDateTimeAttributes = [{"id":"ch_thread_msg_datetime_" + message.id},{"class":"ch-msg-datetime"}];
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
		if ((message.ownerId == this.liveStream.userId) && !message.isDeleted) {
			let moreOptionAttributes = [{"class":"ch-msg-more-option ch-right"},{"title":LANGUAGE_PHRASES.MORE_OPTIONS}];
			let moreOption = this.utility.createElement("i", moreOptionAttributes, "more_vert", msgBubbleEle);
			moreOption.classList.add("material-icons");

			// Add event listiner on more option
			this._registerMoreOptionClickEvent(message, moreOption, msgBubbleEle);
		}

		// Create message div
		let msgDivAttributes = [{"id":"ch_thread_message_" + message.id},{"class":"ch-message"}];
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

		
	}

	updateDeleteForEveryoneMsg(data) {
		if (this.conversation.id != data.conversation.id) {
			return;
		}

  	// Update text of deleted message
  	let targetMsgBody = document.getElementById("ch_thread_message_body_" + data.messages[0].id);
		if (targetMsgBody) {
			targetMsgBody.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
		}

		let targetAttachmentCard = document.getElementById("ch_thread_attachment_card_" + data.messages[0].id);
		if (targetAttachmentCard) {
			targetAttachmentCard.remove();
		}

		// Update listener of deleted message
		let targetMessage = document.getElementById("thread_" + data.messages[0].id);
		if (targetMessage) {
			let deletedMsgOptionBtn = targetMessage.lastChild;
			deletedMsgOptionBtn.addEventListener("click", data => {
				// Remove delete for everyone option
				let deleteForEveryoneBtn = document.getElementById("ch_msg_delete_for_everyone");
				if (deleteForEveryoneBtn) {
					deleteForEveryoneBtn.remove();
				}
			});
		}
	}

	handleAddReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}

		const messageId = data.message.id;
    const messageIndex = this.threadsMessages.findIndex(message => message.id == messageId);
    if (messageIndex != -1) {
			const reactionType = data.reaction.type;
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;

			if(this.threadsMessages[messageIndex]["reactions"][reactionType]) {
				var memberIndex = this.threadsMessages[messageIndex]["reactions"][reactionType].indexOf(userId);
				if (memberIndex == -1) {
					this.threadsMessages[messageIndex]["reactions"][reactionType].push(userId);
				}
				this.threadsMessages[messageIndex]["reactionsCount"] = reactionsCount;
			} else {
				const reactionData = this.threadsMessages[messageIndex]["reactions"];
				reactionData[reactionType] = [userId];
				this.threadsMessages[messageIndex]["reactions"] = reactionData;
				this.threadsMessages[messageIndex]["reactionsCount"] = reactionsCount;
			}

			let msgDiv = document.getElementById("ch_thread_message_" + messageId);
			this._createMessageReactionFrame(this.threadsMessages[messageIndex], msgDiv);
    }
	}

	handleRemoveReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}
		
		const messageId = data.message.id;
		const reactionType = data.reaction.type;
		const messageIndex = this.threadsMessages.findIndex(message => message.id == messageId);
		if (messageIndex != -1 && this.threadsMessages[messageIndex]["reactions"][reactionType]) {
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;
			var memberIndex = this.threadsMessages[messageIndex]["reactions"][reactionType].indexOf(userId);
			if (memberIndex != -1) {
				this.threadsMessages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
			}
			this.threadsMessages[messageIndex]["reactionsCount"] = reactionsCount;
			
			let msgDiv = document.getElementById("ch_thread_message_" + messageId);
			this._createMessageReactionFrame(this.threadsMessages[messageIndex], msgDiv);
		}
	}

	_createMessageReactionFrame(message, parentDiv) {
		if (!message.reactions) {
			return;
		}
		
		if (document.getElementById("ch_thread_reaction_" + message.id)) {
			document.getElementById("ch_thread_reaction_" + message.id).remove();
		}

		let threadMessageDiv = document.getElementById("ch_thread_message_" + message.id);
		if (threadMessageDiv) {
			threadMessageDiv.classList.remove("reaction-space");
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
		threadMessageDiv.classList.add("reaction-space");

		// Create reaction container
		let msgReactionContainerAttributes = [{"id":"ch_thread_reaction_" + message.id},{"class":"ch-msg-reaction-container"}];
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
		});
	}

	_registerReactionClickEvent(message, addReactionEle, msgBubbleEle) {
		addReactionEle.addEventListener("click", (event) => {
			event.stopPropagation();
			this._createReactionsListing(message, msgBubbleEle);
		});
	}

	_createReactionsListing(message, msgBubbleEle) {
		if (document.getElementById("ch_thread_scroll_menu_container")) {
			document.getElementById("ch_thread_scroll_menu_container").remove();
			return;
		}

		// Hide the more option container
		if (document.getElementById("ch_thread_msg_option_container")) {
			document.getElementById("ch_thread_msg_option_container").remove();
		}

		// Create message reaction container
		let scrollMenuContainerAttributes = [{"id":"ch_thread_scroll_menu_container"},{"class":"ch-scroll-menu-container"}];
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
			if (document.getElementById("ch_thread_scroll_menu_container")) {
				document.getElementById("ch_thread_scroll_menu_container").remove();
			}

			const messageIndex = this.threadsMessages.findIndex(message => message.id == messageId);
			if (messageIndex == -1) {
				return;
			}

			const message = this.threadsMessages[messageIndex];
			const reactionType = reactionMenuListItem.title;

			const reactionTypeObj = message.reactions[reactionType];
			if (reactionTypeObj && reactionTypeObj.indexOf(this.liveStream.userId) != -1) {
				// Update message reactions
				var memberIndex = this.threadsMessages[messageIndex]["reactions"][reactionType].indexOf(this.liveStream.userId);
				if (memberIndex != -1) {
					this.threadsMessages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
					this.threadsMessages[messageIndex]["reactionsCount"][reactionType] --;
				}

				this.chAdapter.removeReaction(message, { type: reactionType }, (err, res) => {
				});
			} else {
				// Update message reactions
				if(this.threadsMessages[messageIndex]["reactions"][reactionType]) {
					var memberIndex = this.threadsMessages[messageIndex]["reactions"][reactionType].indexOf(this.liveStream.userId);
					if (memberIndex == -1) {
						this.threadsMessages[messageIndex]["reactions"][reactionType].push(this.liveStream.userId);
						this.threadsMessages[messageIndex]["reactionsCount"][reactionType] ++;
					}
				} else {
					const reactionData = this.threadsMessages[messageIndex]["reactions"];
					reactionData[reactionType] = [this.liveStream.userId];
					this.threadsMessages[messageIndex]["reactions"] = reactionData;

					const reactionCountData = this.threadsMessages[messageIndex]["reactionsCount"];
					reactionCountData[reactionType] = 1;
					this.threadsMessages[messageIndex]["reactionsCount"] = reactionCountData;
				}

				this.chAdapter.addReaction(message, { type: reactionType }, (err, res) => {
				});
			}

		});
	}

	_showMediaIconsDocker(value) {
		if (value) {
			document.getElementById("ch_thread_media_docker").classList.add("ch-thread-show-docker");
		} else {
			document.getElementById("ch_thread_media_docker").classList.remove("ch-thread-show-docker");
		}
	}

	_showLoading(show) {
		if (show) {
			document.getElementById("ch_thread_loader_container").style.display = "block";
		} else {
			document.getElementById("ch_thread_loader_container").style.display = "none";
		}
	}

}

export { Threads as default }