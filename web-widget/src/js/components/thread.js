import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
import { LANGUAGE_PHRASES, SETTINGS, IMAGES } from "../constants.js";

class Thread {
	constructor(widget, parentMessage, conversation) {
		this.widget = widget;
		this.chAdapter = widget.chAdapter;

		this.parentMessage = new Channelize.core.Message.Model(parentMessage);
		this.conversation = conversation;

		this.utility = new Utility();
		
		this.loadCount = 0;
		this.limit = 25;
		this.skip = 0;
		this.threadMessages = [this.parentMessage];

		// Message reactions config
		this.reactionsSetting= SETTINGS.REACTION_SETTINGS;
		this.reactionsTypes = [];
		this.enableScrolling = false;
		this.scrollMenuWidth = 0;

		this._openThreadWindow();
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

	_openThreadWindow() {
		
		// Remove previous threads window if exist
		let olderThreadWindow = document.getElementById("ch_thread_window");
		if (olderThreadWindow) {
			olderThreadWindow.remove();
		}

		// Create threads box components
		let widget = document.getElementById("ch_frame");
		let threadWindowAttributes = [{"id": "ch_thread_window"},{"class":"ch-thread-window"}];
		let threadWindow = this.utility.createElement("div", threadWindowAttributes, null, widget);

		// Create threads header
		let threadHeaderAttributes = [{"id":"ch_thread_header"},{"class":"ch-header"}];
		let threadHeader = this.utility.createElement("div", threadHeaderAttributes, null, threadWindow);

		// Create threads close button
		let closeBtnAttributes = [{"id":"ch_thread_close_btn"}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "arrow_back", threadHeader);
		closeBtn.classList.add("material-icons", "ch-close-btn");

		// Create conversation details wrapper
		let detailsAttributes = [{"class":"ch-thread-header-details-wrapper"}];
		let detailsWrapper = this.utility.createElement("div", detailsAttributes, null, threadHeader);

		// Create threads header title
		let threadHeaderTitleAttributes = [{"id":"ch_thread_header_title"},{"class":"ch-header-title"}];
		let threadHeaderTitle = this.utility.createElement("div", threadHeaderTitleAttributes, LANGUAGE_PHRASES.THREAD, detailsWrapper);

		// Create threads header subtitle
		let threadHeaderSubtitleAttributes = [{"id":"ch_thread_header_subtitle"},{"class":"ch-header-subtitle"}];
		let threadHeaderSubtitle = this.utility.createElement("div", threadHeaderSubtitleAttributes, null, detailsWrapper);

		// Create threads header subtitle
		let threadHeaderReplyCountAttributes = [{"id":"ch_thread_header_reply_count"},{"class":"ch-header-reply-count"}];
		let threadHeaderReplyCount = this.utility.createElement("span", threadHeaderReplyCountAttributes, "...", threadHeaderSubtitle);

		// Create threads header subtitle
		let threadHeaderReplyAttributes = [{"class":"ch-header-reply"}];
		let threadHeaderReply = this.utility.createElement("span", threadHeaderReplyAttributes, LANGUAGE_PHRASES.REPLIES, threadHeaderSubtitle);

		// Create threads listing box
		let parentMessageBoxAttributes = [{"id":"ch_thread_parent_msg_box"},{"class":"ch-thread-parent-msg-box"}];
		this.utility.createElement("div", parentMessageBoxAttributes, null, threadWindow);
		
		// Create threads listing box
		let threadMesssagesBoxAttributes = [{"id":"ch_thread_messages_box"},{"class":"ch-thread-messages-box ch-send-box"}];
		let threadMesssagesBox = this.utility.createElement("div", threadMesssagesBoxAttributes, null, threadWindow);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_thread_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, threadMesssagesBox);
		loaderContainer.style.display = "block";

		// Create loader
		let loaderAttributes = [{"id":"ch_thread_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);
		

		// Create send as direct message view
		let sendDirectMsgBoxAttributes = [{"id":"ch_send_direct_msg_box"},{"class":"ch-send-direct-msg-box"}];
		let sendDirectMsgBox = this.utility.createElement("div", sendDirectMsgBoxAttributes, null, threadWindow);

		// Create checkbox
		let sendDirectMsgCheckboxAttributes = [{"id":"ch_send_direct_msg_checkbox"},{"class":"ch-send-direct-msg-checkbox"},{"type":"checkbox"}];
		let sendDirectMsgCheckbox = this.utility.createElement("input", sendDirectMsgCheckboxAttributes, null, sendDirectMsgBox);

		// Create checkbox
		let sendDirectMsgLabelAttributes = [{"id":"ch_send_direct_msg_label"},{"class":"ch-send-direct-msg-label"},{"for":"ch_send_direct_msg_checkbox"}];
		let sendDirectMsgLabel = this.utility.createElement("label", sendDirectMsgLabelAttributes, LANGUAGE_PHRASES.SEND_DIRECT_MESSAGE, sendDirectMsgBox);

		// Create threads listing box
		let threadSendBoxAttributes = [{"id":"ch_thread_send_box"},{"class":"ch-thread-send-box"}];
		let threadSendBox = this.utility.createElement("div", threadSendBoxAttributes, null, threadWindow);

		// Create input box
		let inputThreadsBoxAttributes = [{"id":"ch_thread_input_box"},{"class":"ch-thread-input-thread-box"}, {"type":"text"}, {"placeholder":LANGUAGE_PHRASES.SEND_MESSAGE}];
		this.utility.createElement("textarea", inputThreadsBoxAttributes, null, threadSendBox);

		// Create media messages docker
		let mediaThreadDockerAttributes = [{"id":"ch_thread_media_docker"},{"class":"ch-thread-media-docker"}];
		let mediaThreadDocker = this.utility.createElement("div", mediaThreadDockerAttributes, null, threadSendBox);

		// Create image messages option
		let imageOptionAttributes = [{"id":"ch_thread_image_option"},{"class":"ch-thread-image-option"}];
		let imageOption = this.utility.createElement("div", imageOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let imageIconSpanAttributes = [{"id":"ch_thread_image_icon_span"},{"class":"ch-thread-image-icon-span"}];
		let imageIconSpan = this.utility.createElement("span", imageIconSpanAttributes, null, imageOption);

		// Create image messages option icon
		let imageIconAttributes = [{"id":"ch_thread_image_option_icon"},{"class":"ch-thread-image-option-icon"},{"src":IMAGES.GALLERY_ICON}];
		this.utility.createElement("img", imageIconAttributes, null, imageIconSpan);

		// Create input for image
		let imageInputAttributes = [{"id":"ch_thread_image_input"},{"class":"ch-thread-image-input"},{"type":"file"},{"accept":"image/*"}];
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
		let audioIconAttributes = [{"id":"ch_thread_audio_option_icon"},{"class":"ch-thread-audio-option-icon"},{"src":IMAGES.AUDIO_ICON}];
		this.utility.createElement("img", audioIconAttributes, null, audioIconSpan);

		// Create input for audio
		let audioInputAttributes = [{"id":"ch_thread_audio_input"},{"class":"ch-thread-audio-input"},{"type":"file"},{"accept":"audio/*"}];
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
		let videoIconAttributes = [{"id":"ch_thread_video_option_icon"},{"class":"ch-thread-video-option-icon"},{"src":IMAGES.VIDEO_ICON}];
		this.utility.createElement("img", videoIconAttributes, null, videoIconSpan);

		// Create input for video
		let videoInputAttributes = [{"id":"ch_thread_video_input"},{"class":"ch-thread-video-input"},{"type":"file"},{"accept":"video/*"}];
		this.utility.createElement("input", videoInputAttributes, null, videoOption);

		// Create option name span for video
		let videoNameAttributes = [{"id":"ch_thread_video_option_name"},{"class":"ch-thread-video-option-name"}];
		this.utility.createElement("span", videoNameAttributes, LANGUAGE_PHRASES.VIDEO, videoOption);

		// Create attachment button
		let attachmentAttributes = [{"id":"ch_thread_attachment_btn"},{"title":LANGUAGE_PHRASES.SEND_ATTACHMENTS}];
		let attachment = this.utility.createElement("i", attachmentAttributes, "attachment", threadSendBox);
		attachment.classList.add("material-icons", "ch-thread-attachment-btn");

		// Create send button
		let sendButtonAttributes = [{"id":"ch_thread_send_button"},{"class":"ch-thread-send-button"}];
		let sendButton = this.utility.createElement("button", sendButtonAttributes, null, threadSendBox);

		// Create send icon
		let sendIconAttributes = [{"class":"ch-thread-send-icon"}];
		let sendIcon = this.utility.createElement("i", sendIconAttributes, "send", sendButton);
		sendIcon.classList.add("material-icons");

		// Hide send message box and status is blocked user
		if (this.conversation.blockedByUser || this.conversation.blockedByMember) {
			status.style.visibility = "hidden";
			threadSendBox.style.visibility = "hidden";
		}

		this._createThreadMessagesListing();
	}

	_createThreadMessagesListing() {
		
		// Get conversation messages
		this._getMessages(this.conversation, this.limit, this.skip, (err, messages) => {
			if (err) return console.error(err);

			if (messages.length) {
				this.threadMessages = this.threadMessages.concat(messages);
			}

			// Update replies count in header
			let parentMessageReplyCount = document.getElementById("ch_thread_header_reply_count");
			if (parentMessageReplyCount) {
				parentMessageReplyCount.innerHTML = this.parentMessage.replyCount;
			}

			// Hide loader
			if (document.getElementById("ch_thread_loader_container")) {
				document.getElementById("ch_thread_loader_container").remove();
			}

			let messagesBox = document.getElementById("ch_thread_messages_box");

			// Parent message div
			if (messages.length != this.limit) {
				this._createParentMessageViewFrame(this.parentMessage, messagesBox, false);
			}
			
			this.threadMessages.forEach(message => {
				if (message.id == this.parentMessage.id) {
					return;
				}
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

	_createParentMessageViewFrame(message, messagesBox, changePosition) {
		
		let threadStart = document.getElementById("ch_thread_start");
		if (!threadStart) {
			// Create message frame
			this._createMessageFrame(message, messagesBox, false);

			// Create a line breaker b/w parent and chid message.
			let threadStartAttributes = [{"id":"ch_thread_start"},{"class":"ch-thread-start ch-msg-list"}];
			let threadStart = this.utility.createElement("div", threadStartAttributes, LANGUAGE_PHRASES.START_OF_A_NEW_THREAD, messagesBox);

			// Set parent message and line breaker position
			if (changePosition) {
				let parentMessage = document.getElementById("thread_" + message.id);
				messagesBox.insertBefore(parentMessage, messagesBox.childNodes[0]);
				messagesBox.insertBefore(threadStart, messagesBox.childNodes[1]);
			}
		}
	}

	_createTextMessageFrame(message, parentDiv) {
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

	_modifyMessage(message) {
		if (!message) {
			return message;
		}
		
		// Set read status of message
		if (!this.conversation.isDummyObject) {
			message.readByAll = this.chAdapter.readByAllMembers(this.conversation, message);
		}

    message.createdAt = this.utility.updateTimeFormat(message.createdAt);

    if (message.isDeleted) {
    	message.body = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
    }

    return message;
	}

	_addListenerOnMoreOption(message, moreOption, msgList) {
		moreOption.addEventListener("click", (data) => {
			if (document.getElementById("ch_thread_msg_option_container")) {
				document.getElementById("ch_thread_msg_option_container").remove();
				return;
			}

			if (document.getElementById("ch_thread_scroll_menu_container")) {
				document.getElementById("ch_thread_scroll_menu_container").remove();
			}

			// Create message options container
			let msgOptionsContainerAttributes = [{"id":"ch_thread_msg_option_container"},{"class":"ch-msg-option-container"}];
			let msgOptionsContainer = this.utility.createElement("div", msgOptionsContainerAttributes, null, msgList);

			if (message.ownerId == this.widget.userId) {
				msgOptionsContainer.style.left = "15px";
			} else {
				msgOptionsContainer.style.right = "15px";
			}

			// Create delete message for me option
			let deleteMsgAttributes = [{"class":"ch-msg-delete-for-me"}];
			let deleteMsgOption = this.utility.createElement("div", deleteMsgAttributes, LANGUAGE_PHRASES.DELETE_FOR_ME, msgOptionsContainer);

			// Add listener on delete message for me
			deleteMsgOption.addEventListener("click", (data) => {
				msgOptionsContainer.remove();

				// Delete message for me
				this.chAdapter.deleteMessagesForMe([message.id], (err, res) => {
					if (err) console.error(err);
				})
			});

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
		});
	}

	_registerClickEventHandlers() {

		// Close search button listener
		let closeBtn = document.getElementById("ch_thread_close_btn");
		if (closeBtn) {
			closeBtn.addEventListener("click", (data) => {
				document.getElementById("ch_thread_window").remove();
				this.widget.threads.pop();
			});
		}

		// Send message on Enter press
		let input = document.getElementById("ch_thread_input_box");
		input.addEventListener("keydown", (data) => {
			if (data.keyCode === 13) {
				data.preventDefault();
				this.sendMessage("text");
			}
		});

		// Send button listener
		let sendButton = document.getElementById("ch_thread_send_button");
		sendButton.addEventListener("click", (data) => {
			this.sendMessage("text");
		});

		// Scroll message box listener
		let msgBox = document.getElementById("ch_thread_messages_box");
		msgBox.addEventListener("scroll", (data) => {
			if (msgBox.scrollTop == 0) {
				this._loadMoreMessages();
			}
		});

		// Attachment button listener
		let attachmentBtn = document.getElementById("ch_thread_attachment_btn");
		attachmentBtn.addEventListener("click", (data) => {
			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
		});

		// Send message on image choose
		let imageInput = document.getElementById("ch_thread_image_input");
		imageInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			} else {
				this.sendMessage("image");
			}
		});

		// Send message on audio choose
		let audioInput = document.getElementById("ch_thread_audio_input");
		audioInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			} else {
				this.sendMessage("audio");
			}
		});

		// Send message on video choose
		let videoInput = document.getElementById("ch_thread_video_input");
		videoInput.addEventListener("change", (data) => {
			if (data.target.files[0].size > 25000000) {
				this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				this.showMediaDocker(false);
			} else {
				this.sendMessage("video");
			}
		});
	}

	_loadMoreMessages() {
		++this.loadCount;
		this.skip = this.loadCount * this.limit;
		this._getMessages(this.conversation, this.limit, this.skip, (err, messages) => {
			if (err) return console.error(err);

			if (messages.length) {
				this.threadMessages = this.threadMessages.concat(messages);
			}

			let messagesBox = document.getElementById("ch_thread_messages_box");
			if (!messages.length) {
				this._createParentMessageViewFrame(this.parentMessage, messagesBox, true);
				return;
			}
			
			// Save first message to scroll
			let firstMessage = messagesBox.childNodes[0];

			messages.forEach(message => {
				// Update message object
				message = this._modifyMessage(message);
				
				// Create message frame
				this._createMessageFrame(message, messagesBox, false);

				let msgList = document.getElementById("thread_" + message.id);
				messagesBox.insertBefore(msgList, messagesBox.childNodes[0]);
			});

			if (firstMessage) {
				firstMessage.scrollIntoView();
			}
		});
	}

	sendMessage(msgType) {
		// Hide media docker
		this.showMediaDocker(false);

		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Show loader image if media message
		if (msgType != "text") {
			if (document.getElementById("ch_no_thread_msg")) {
				document.getElementById("ch_no_thread_msg").remove();
			}

			let msgLoaderAttributes = [{"id":"ch_thread_msg_loader"},{"class":"ch-msg-loader"}];
			let imageMsg = this.utility.createElement("div", msgLoaderAttributes, null, messagesBox);
			imageMsg.style.backgroundImage = "url(" + IMAGES.MESSAGE_LOADER + ")";
			imageMsg.scrollIntoView();
		}

		// Check value of checkbox
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
				let inputValue = document.getElementById("ch_thread_input_box").value;
				document.getElementById("ch_thread_input_box").value = "";

				if (!inputValue.trim()) {
					return;
				}

				data['body'] = inputValue;

				// Add pending message into list
				this.addPendingMessage(data);

				if (this.conversation.isDummyObject) {
					data['userId'] = this.conversation.userId;

					this.chAdapter.sendMessageToUser(data, (err, res) => {
						if (err) return console.error(err);
					});
				} else {
					this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
						if (err) return console.error(err);
					});
				}
				break;

			case "image":
				let imageFile = document.getElementById("ch_thread_image_input").files[0];

				// Upload file on channelize server
				this.chAdapter.uploadFile(imageFile, "image", true, (err, fileData) => {
					if (err) return console.error(err);

					fileData.type = fileData.attachmentType;
					data['attachments'] = [fileData];
					this._sendFileMessage(data);
				});
				break;

			case "audio":
				let audioFile = document.getElementById("ch_thread_audio_input").files[0];

				// Upload file on channelize server
				this.chAdapter.uploadFile(audioFile, "audio", true, (err, fileData) => {
					if (err) return console.error(err);

					fileData.type = fileData.attachmentType;
					data['attachments'] = [fileData];
					this._sendFileMessage(data);
				});
				break;

			case "video":
				let videoFile = document.getElementById("ch_thread_video_input").files[0];
				// Upload file on channelize server
				this.chAdapter.uploadFile(videoFile, "video", true, (err, fileData) => {
					if (err) return console.error(err);

					fileData.type = fileData.attachmentType;
					data['attachments'] = [fileData];
					this._sendFileMessage(data);
				});
				break;
		}
	}

	_sendFileMessage(data) {
		// Send file message as attachment
		if (this.conversation.isDummyObject) {
			data['userId'] = this.conversation.userId;
			this.chAdapter.sendMessageToUser(data, (err, message) => {
				if (err) return console.error(err);
			});
		} else {
			this.chAdapter.sendMessage(this.conversation, data, (err, message) => {
				if (err) return console.error(err);
			});
		}
	}

	addPendingMessage(msgData) {
		msgData["ownerId"] = this.widget.userId;
		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Remove no message tag
		if (messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_thread_msg") {
			messagesBox.firstChild.remove();
		}

		// Create message frame
		this._createMessageFrame(msgData, messagesBox, true);
		
		// Scroll to newly added dummy message
		messagesBox.scrollTop = messagesBox.scrollHeight;
	}

	
	_markAsRead(conversation) {
		let currentDate = new Date();
		let timestamp = currentDate.toISOString();
	  	this.chAdapter.markAsReadConversation(conversation, timestamp, (err, res) => {
	  		if (err) return console.error(err);
	  	});
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
		this.threadMessages.push(message);

		// Remove pending dummy message
		let dummyMessage = document.getElementById("thread_" + message.id);
		if (dummyMessage) {
			dummyMessage.remove();
		}

		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Hide message loader
		if (document.getElementById("ch_thread_msg_loader") && message.ownerId == this.widget.userId) {
			document.getElementById("ch_thread_msg_loader").remove();
		}

		if (message.conversationId != this.conversation.id || !messagesBox)
			return;

		message.createdAt = this.utility.updateTimeFormat(Date());

		// Remove no message tag
		if (messagesBox.firstChild && messagesBox.firstChild.id == "ch_no_thread_msg") {
			messagesBox.firstChild.remove();
		}

		// Create message frame
		this._createMessageFrame(message, messagesBox, false);

		if (message.ownerId != this.widget.userId) {
			// Message mark a read
			this._markAsRead(this.conversation);
		}

		// Scroll to new message
		if (messagesBox) {
			messagesBox.scrollTop = messagesBox.scrollHeight;
		}
	}

	updateMsgStatus(data) {
		if (data.conversation.id != this.conversation.id || this.conversation.isGroup) {
			return;
		}
		
		// Check read status of second last message
		if (this.threadMessages.slice(-2, -1) && this.threadMessages.slice(-2, -1).readByAll) {
			let lastMessage = this.threadMessages[this.threadMessages.length-1];
			lastMessage.readByAll = true;

			// Update read tag icon
			let msgDiv = document.getElementById("thread_" + lastMessage.id);
			if (msgDiv) {
				let statusDiv = msgDiv.querySelector("#ch_thread_msg_status");

				if (statusDiv) {
					statusDiv.innerHTML = "done_all";
				}
			}
		} else {
			this.threadMessages.forEach(msg => {
				msg.readByAll = true;

				// Update read tag icon
				let msgDiv = document.getElementById("thread_" + msg.id);
				if (msgDiv) {
					let statusDiv = msgDiv.querySelector("#ch_thread_msg_status");

					if (statusDiv) {
						statusDiv.innerHTML = "done_all";
					}
				}
			});
		}
	}

	showMediaDocker(value) {
		if (value) {
			document.getElementById("ch_thread_media_docker").classList.add("ch-thread-show-docker");
		} else {
			document.getElementById("ch_thread_media_docker").classList.remove("ch-thread-show-docker");
		}
	}


	_getMessages(conversation, limit, skip, cb) {
		this.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, this.parentMessage.id, null, (err, messages) => {
			if (err) return cb(err);

			messages.reverse();
			return cb(null, messages);
		});
	}

	_createMessageFrame(message, messagesBox, isPendingMessage) {
		// Create message list
		let msgListAttributes = [{"id":"thread_" + message.id},{"class":"ch-msg-list"}];
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
		this._addListenerOnMoreOption(message, moreOption, msgList);

		// Create message div
		let msgDivAttributes = [{"id":"ch_thread_message_" + message.id},{"class":"ch-message"}];
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
			let statusAttributes = [{"id":"ch_thread_msg_status"}];
			let readIcon = message.readByAll ? "done_all" : "check";
			var msgStatus = this.utility.createElement("i", statusAttributes, isPendingMessage ? "schedule" : readIcon, msgContainer);
			msgStatus.classList.add("material-icons", "ch-msg-status");
		} else {
			msgContainer.classList.add("left");
			moreOption.classList.add("right");
		}
	}

	handleDeleteForMe(data) {
		data.messages.forEach(message => {
			let targetMsg = document.getElementById("thread_" + message.id);

			// Remove the message if the message is not this thread parent message.
			if (targetMsg && this.parentMessage.id != message.id) {
				targetMsg.remove();
			}
		});
	}

	updateDeleteForEveryoneMsg(data) {
		if (this.conversation.id != data.conversation.id)
			return;

  	// Update text of deleted message
  	let targetMsg = document.getElementById("ch_thread_message_" + data.messages[0].id);
		if (targetMsg) {
			targetMsg.innerHTML = "<i>" + LANGUAGE_PHRASES.MESSAGE_DELETED;
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

	handleClearConversation(conversation) {
  		if (conversation.id != this.conversation.id) {
  			return;
  		}

  		let threadWindow = document.getElementById("ch_thread_window");
  		if (threadWindow) {
  			threadWindow.remove();
  		}
  	}

	handleDeleteConversation(conversation) {
  		if (conversation.id != this.conversation.id) {
  			return;
  		}

  		let threadWindow = document.getElementById("ch_thread_window");
  		if (threadWindow) {
  			threadWindow.remove();
  		}
  	}

	handleBlock(data) {
		if (this.conversation.isGroup) {
			return;
		}

		// Hide checkbox and input field
		document.getElementById("ch_send_direct_msg_box").style.visibility = "hidden";
		document.getElementById("ch_thread_send_box").style.visibility = "hidden";
	}

	handleUnblock(data) {
		if (this.conversation.isGroup) {
			return;
		}

		// Show checkbox and input field
		document.getElementById("ch_send_direct_msg_box").style.visibility = "visible";
		document.getElementById("ch_thread_send_box").style.visibility = "visible";
	}

	handleAddReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}

		const messageId = data.message.id;
    const messageIndex = this.threadMessages.findIndex(message => message.id == messageId);
    if (messageIndex != -1) {
			const reactionType = data.reaction.type;
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;

			if(this.threadMessages[messageIndex]["reactions"][reactionType]) {
				var memberIndex = this.threadMessages[messageIndex]["reactions"][reactionType].indexOf(userId);
				if (memberIndex == -1) {
					this.threadMessages[messageIndex]["reactions"][reactionType].push(userId);
				}
				this.threadMessages[messageIndex]["reactionsCount"] = reactionsCount;
			} else {
				const reactionData = this.threadMessages[messageIndex]["reactions"];
				reactionData[reactionType] = [userId];
				this.threadMessages[messageIndex]["reactions"] = reactionData;
				this.threadMessages[messageIndex]["reactionsCount"] = reactionsCount;
			}

			let msgDiv = document.getElementById("ch_thread_message_" + messageId);
			this._createMessageReactionFrame(this.threadMessages[messageIndex], msgDiv);
    }
	}

	handleRemoveReaction(data) {
		if (data.message.conversationId != this.conversation.id) {
			return;
		}
		
		const messageId = data.message.id;
		const reactionType = data.reaction.type;
		const messageIndex = this.threadMessages.findIndex(message => message.id == messageId);
		if (messageIndex != -1 && this.threadMessages[messageIndex]["reactions"][reactionType]) {
			const userId = data.user.id;
			const reactionsCount = data.message.reactionsCount;
			var memberIndex = this.threadMessages[messageIndex]["reactions"][reactionType].indexOf(userId);
			if (memberIndex != -1) {
				this.threadMessages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
			}
			this.threadMessages[messageIndex]["reactionsCount"] = reactionsCount;
			
			let msgDiv = document.getElementById("ch_thread_message_" + messageId);
			this._createMessageReactionFrame(this.threadMessages[messageIndex], msgDiv);
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
		});
	}

	_addListenerOnAddReactionOption(message, addReaction, msgList) {
		addReaction.addEventListener("click", (data) => {
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
			if (document.getElementById("ch_thread_scroll_menu_container")) {
				document.getElementById("ch_thread_scroll_menu_container").remove();
			}

			const messageIndex = this.threadMessages.findIndex(message => message.id == messageId);
			if (messageIndex == -1) {
				return;
			}

			const message = this.threadMessages[messageIndex];
			const reactionType = reactionMenuListItem.title;

			const reactionTypeObj = message.reactions[reactionType];
			if (reactionTypeObj && reactionTypeObj.indexOf(this.widget.userId) != -1) {
				// Update message reactions
				var memberIndex = this.threadMessages[messageIndex]["reactions"][reactionType].indexOf(this.widget.userId);
				if (memberIndex != -1) {
					this.threadMessages[messageIndex]["reactions"][reactionType].splice(memberIndex, 1);
					this.threadMessages[messageIndex]["reactionsCount"][reactionType] --;
				}

				this.chAdapter.removeReaction(message, { type: reactionType }, (err, res) => {
				});
			} else {
				// Update message reactions
				if(this.threadMessages[messageIndex]["reactions"][reactionType]) {
					var memberIndex = this.threadMessages[messageIndex]["reactions"][reactionType].indexOf(this.widget.userId);
					if (memberIndex == -1) {
						this.threadMessages[messageIndex]["reactions"][reactionType].push(this.widget.userId);
						this.threadMessages[messageIndex]["reactionsCount"][reactionType] ++;
					}
				} else {
					const reactionData = this.threadMessages[messageIndex]["reactions"];
					reactionData[reactionType] = [this.widget.userId];
					this.threadMessages[messageIndex]["reactions"] = reactionData;

					const reactionCountData = this.threadMessages[messageIndex]["reactionsCount"];
					reactionCountData[reactionType] = 1;
					this.threadMessages[messageIndex]["reactionsCount"] = reactionCountData;
				}

				this.chAdapter.addReaction(message, { type: reactionType }, (err, res) => {
				});
			}

		});
	}

}

export { Thread as default }