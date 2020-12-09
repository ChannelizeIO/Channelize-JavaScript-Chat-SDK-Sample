import Utility from "../utility.js";
import { v4 as uuid } from 'uuid';
import moment from 'moment';
import { LANGUAGE_PHRASES, SETTINGS, IMAGES } from "../constants.js";
import EmojiButton from '@joeattardi/emoji-button';

class Threads {
	constructor(liveStream, parentMessage, conversation) {
		this.liveStream = liveStream;
		this.chAdapter = liveStream.chAdapter;

		this.parentMessage = new Channelize.core.Message.Model(this.chAdapter.channelize, parentMessage);
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

		// Sticker and Gifs config
		this.stickers = [];
		this.gifs = [];
		this.ativeStickerGifPickerTabName = '';

		// Location config
		this.locationData = {
			latitude : 38.89766356093496,
			longitude : -77.03657390000001,
			place : "The White House",
			address : "Pennsylvania Avenue Northwest, Washington, DC, USA"
		}
		this.googleMap = {};
		this.googleMapMarker = {};
		this.isGoogleMapReady = false;

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
		let imageIconAttributes = [{"id":"ch_thread_image_option_icon"},{"class":"ch-thread-image-option-icon"},{"src":IMAGES.GALLERY_ICON}];
		this.utility.createElement("img", imageIconAttributes, null, imageIconSpan);

		// Create input for image
		let imageInputAttributes = [{"id":"ch_thread_image_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"image/*"},{"data-msg-type":"image"},{"title":LANGUAGE_PHRASES.IMAGE}];
		this.utility.createElement("input", imageInputAttributes, null, imageOption);

		// Create option name span for image
		let imageNameAttributes = [{"id":"ch_thread_image_option_name"},{"class":"ch-thread-image-option-name"}];
		this.utility.createElement("span", imageNameAttributes, LANGUAGE_PHRASES.IMAGE, imageOption);

		// Create sticker messages option
		let stickerOptionAttributes = [{"id":"ch_thread_sticker_option"},{"class":"ch-thread-sticker-option"},{"title":LANGUAGE_PHRASES.STICKER}];
		let stickerOption = this.utility.createElement("div", stickerOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let stickerIconSpanAttributes = [{"id":"ch_thread_sticker_icon_span"},{"class":"ch-thread-sticker-icon-span"}];
		let stickerIconSpan = this.utility.createElement("span", stickerIconSpanAttributes, null, stickerOption);

		// Create sticker messages option icon
		let stickerIconAttributes = [{"id":"ch_thread_sticker_option_icon"},{"class":"ch-thread-sticker-option-icon"},{"src":IMAGES.STICKER_ICON}];
		this.utility.createElement("img", stickerIconAttributes, null, stickerIconSpan);

		// Create option name span for sticker
		let stickerNameAttributes = [{"id":"ch_thread_sticker_option_name"},{"class":"ch-thread-sticker-option-name"}];
		this.utility.createElement("span", stickerNameAttributes, LANGUAGE_PHRASES.STICKER, stickerOption);

		// Create gif messages option
		let gifOptionAttributes = [{"id":"ch_thread_gif_option"},{"class":"ch-thread-gif-option"},{"title":LANGUAGE_PHRASES.GIF}];
		let gifOption = this.utility.createElement("div", gifOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let gifIconSpanAttributes = [{"id":"ch_thread_gif_icon_span"},{"class":"ch-thread-gif-icon-span"}];
		let gifIconSpan = this.utility.createElement("span", gifIconSpanAttributes, null, gifOption);

		// Create gif messages option icon
		let gifIconAttributes = [{"id":"ch_thread_gif_option_icon"},{"class":"ch-thread-gif-option-icon"},{"src":IMAGES.GIF_ICON}];
		this.utility.createElement("img", gifIconAttributes, null, gifIconSpan);

		// Create option name span for gif
		let gifNameAttributes = [{"id":"ch_thread_gif_option_name"},{"class":"ch-thread-gif-option-name"}];
		this.utility.createElement("span", gifNameAttributes, LANGUAGE_PHRASES.GIF, gifOption);

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
		let audioInputAttributes = [{"id":"ch_thread_audio_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"audio/*"},{"data-msg-type":"audio"},{"title":LANGUAGE_PHRASES.AUDIO}];
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
		let videoInputAttributes = [{"id":"ch_thread_video_input"},{"class":"ch-thread-msg-input"},{"type":"file"},{"accept":"video/*"},{"data-msg-type":"video"},{"title":LANGUAGE_PHRASES.VIDEO}];
		this.utility.createElement("input", videoInputAttributes, null, videoOption);

		// Create option name span for video
		let videoNameAttributes = [{"id":"ch_thread_video_option_name"},{"class":"ch-thread-video-option-name"}];
		this.utility.createElement("span", videoNameAttributes, LANGUAGE_PHRASES.VIDEO, videoOption);
		
		// Create location messages option
		let locationOptionAttributes = [{"id":"ch_thread_location_option"},{"class":"ch-thread-location-option"},{"title":LANGUAGE_PHRASES.LOCATION}];
		let locationOption = this.utility.createElement("div", locationOptionAttributes, null, mediaThreadDocker);

		// Create option icon span
		let locationIconSpanAttributes = [{"id":"ch_thread_location_icon_span"},{"class":"ch-thread-location-icon-span"}];
		let locationIconSpan = this.utility.createElement("span", locationIconSpanAttributes, null, locationOption);

		// Create location messages option icon
		let locationIconAttributes = [{"id":"ch_thread_location_option_icon"},{"class":"ch-thread-location-option-icon"},{"src":IMAGES.LOCATION_ICON}];
		this.utility.createElement("img", locationIconAttributes, null, locationIconSpan);

		// Create option name span for location
		let locationNameAttributes = [{"id":"ch_thread_location_option_name"},{"class":"ch-thread-location-option-name"}];
		this.utility.createElement("span", locationNameAttributes, LANGUAGE_PHRASES.LOCATION, locationOption);

		// Create attachment button
		let attachmentAttributes = [{"id":"ch_thread_attachment_btn"},{"title":LANGUAGE_PHRASES.SEND_ATTACHMENTS}];
		let attachment = this.utility.createElement("i", attachmentAttributes, "add", sendBoxContainer);
		attachment.classList.add("material-icons", "ch-thread-attachment-btn");

		// Create emoji picker button
		let emojiPickerBtnAttributes = [{"id":"ch_thread_emoji_picker_btn"},{"title":LANGUAGE_PHRASES.SHARE_EMOJIS}];
		let emojiPickerBtn = this.utility.createElement("i", emojiPickerBtnAttributes, "insert_emoticon", sendBoxContainer);
		emojiPickerBtn.classList.add("material-icons", "ch-thread-emoji-btn");

		// Create send button
		let sendButtonAttributes = [{"id":"ch_thread_send_button"},{"class":"ch-thread-send-button"}];
		let sendButton = this.utility.createElement("button", sendButtonAttributes, null, sendBoxContainer);

		// Create send icon
		let sendIconAttributes = [{"class":"ch-thread-send-icon"}];
		let sendIcon = this.utility.createElement("i", sendIconAttributes, "send", sendButton);
		sendIcon.classList.add("material-icons");

		// Create Stickers-Gifs layout
		let pickerModelAttributes = [{"id":"ch_thread_sticker_gif_picker"},{"class":"ch-thread-sticker-gif-picker-model"}];
		let pickerModelEle = this.utility.createElement("div", pickerModelAttributes, null, sendBoxContainer);

		let pickerHeaderAttributes = [{"class":"ch-thread-sticker-gif-picker-header"}];
		let pickerHeaderEle = this.utility.createElement("div", pickerHeaderAttributes, null, pickerModelEle);

		let headerSwitcherAttributes = [{"class":"ch-thread-sticker-gif-picker-header-switcher"}];
		let headerSwitcherEle = this.utility.createElement("div", headerSwitcherAttributes, null, pickerHeaderEle);

		let headerStickerBtnAttributes = [{"id":"ch_thread_sticker_gif_picker_header_sticker_btn"},{"class":"ch-thread-sticker-gif-picker-header-switcher-btn"},{"src":IMAGES.STICKER_ICON},{"title":LANGUAGE_PHRASES.STICKER}];
		let headerStickerBtnEle = this.utility.createElement("img", headerStickerBtnAttributes, null, headerSwitcherEle);

		let headerGifBtnAttributes = [{"id":"ch_thread_sticker_gif_picker_header_gif_btn"},{"class":"ch-thread-sticker-gif-picker-header-switcher-btn"},{"src":IMAGES.GIF_ICON},{"title":LANGUAGE_PHRASES.GIF}];
		let headerGifBtnEle = this.utility.createElement("img", headerGifBtnAttributes, null, headerSwitcherEle);

		let pickerHeaderSearchAttributes = [{"class":"ch-thread-sticker-gif-picker-search"}];
		let HeaderSearchEle = this.utility.createElement("div", pickerHeaderSearchAttributes, null, pickerHeaderEle);

		let headerSearchBarAttributes = [{"id":"ch_thread_sticker_gif_picker_search_bar"},{"class":"ch-thread-sticker-gif-picker-search-bar"},{"type":"input"}];
		let headerSearchBarEle = this.utility.createElement("input", headerSearchBarAttributes, null, HeaderSearchEle);

		let headerSearchBarClearAttributes = [{"id":"ch_thread_sticker_gif_picker_search_bar_clear"},{"class":"ch-thread-sticker-gif-picker-search-bar-clear"},{"title":LANGUAGE_PHRASES.CLEAR}];
		let headerSearchBarClearEle = this.utility.createElement("i", headerSearchBarClearAttributes, "highlight_off", HeaderSearchEle);
		headerSearchBarClearEle.classList.add("material-icons");

		let headerCloseBtnAttributes = [{"id":"ch_thread_sticker_gif_picker_close_btn"},{"class":"ch-thread-sticker-gif-picker-close-btn"},{"title":LANGUAGE_PHRASES.CLOSE}];
		let headerCloseBtnEle = this.utility.createElement("i", headerCloseBtnAttributes, "close", pickerHeaderEle);
		headerCloseBtnEle.classList.add("material-icons");

		let pickerContentAttributes = [{"id":"ch_thread_sticker_gif_picker_content"},{"class":"ch-thread-sticker-gif-picker-content"}];
		let pickerContentEle = this.utility.createElement("div", pickerContentAttributes, null, pickerModelEle);

		let pickerLoaderConAttributes = [{"id":"ch_thread_sticker_gif_picker_loader_container"},{"class":"ch-loader-bg"}];
		let pickerLoaderConEle = this.utility.createElement("div", pickerLoaderConAttributes, null, pickerContentEle);

		let pickerLoaderAttributes = [{"id":"ch_thread_sticker_gif_picker_loader"},{"class":"ch-thread-sticker-gif-picker-loader"}];
		let pickerLoader = this.utility.createElement("div", pickerLoaderAttributes, null, pickerLoaderConEle);

		let pickerListAttributes = [{"id":"ch_thread_sticker_gif_picker_list"},{"class":"ch-thread-sticker-gif-picker-list"}];
		let pickerListEle = this.utility.createElement("ul", pickerListAttributes, null, pickerContentEle);

		// Create Location model layout
		let locationPickerModelAttributes = [{"id":"ch_thread_location_model"},{"class":"ch-location-model-model"}];
		let locationPickerModelEle = this.utility.createElement("div", locationPickerModelAttributes, null, sendBoxContainer);

		let locationHeaderAttributes = [{"class":"ch-location-model-header ch-header"}];
		let locationHeaderEle = this.utility.createElement("div", locationHeaderAttributes, null, locationPickerModelEle);

		let locationHeaderSearchAttributes = [{"id":"ch_thread_location_header_search"},{"class":"ch-location-header-search ch-header-wrapper header-search"}];
		let locationHeaderSearchEle = this.utility.createElement("div", locationHeaderSearchAttributes, null, locationHeaderEle);

		let locationHeaderSearchLeftAttributes = [{"class":"ch-location-header-search-left"}];
		let locationHeaderSearchLeft = this.utility.createElement("div", locationHeaderSearchLeftAttributes, null, locationHeaderSearchEle);

		let locationHeaderSearchRightAttributes = [{"class":"ch-location-header-search-right"}];
		let locationHeaderSearchRight = this.utility.createElement("div", locationHeaderSearchRightAttributes, null, locationHeaderSearchEle);

		let locationHeaderSearchCloseBtnAttributes = [{"id":"ch_thread_location_search_close_btn"},{"title":LANGUAGE_PHRASES.BACK}];
		let locationHeaderSearchCloseBtn = this.utility.createElement("i", locationHeaderSearchCloseBtnAttributes, "arrow_back", locationHeaderSearchLeft);
		locationHeaderSearchCloseBtn.classList.add("material-icons");

		let locationHeaderSearchFieldAttributes = [
			{"id":"ch_thread_location_search_bar"},
			{"class":"ch-location-model-search"},
			{"type":"text"},
			{"placeholder":LANGUAGE_PHRASES.SEARCH_LOCATION}
		];
		let locationHeaderSearchFieldEle = this.utility.createElement("input", locationHeaderSearchFieldAttributes, null, locationHeaderSearchRight);

		let locationPickerContentAttributes = [{"id":"ch_thread_location_model_content"},{"class":"ch-location-model-content"}];
		let locationPickerContentEle = this.utility.createElement("div", locationPickerContentAttributes, null, locationPickerModelEle);

		let locationGoogleMapAttributes = [{"id":"ch_thread_google_map_area"},{"class":"ch-location-model-google-map"}];
		let locationGoogleMapEle = this.utility.createElement("div", locationGoogleMapAttributes, null, locationPickerContentEle);

		let locationSendBoxContentAttributes = [{"id":"ch_thread_location_model_send_box"},{"class":"ch-location-model-send-box"}];
		let locationSendBoxEle = this.utility.createElement("div", locationSendBoxContentAttributes, null, locationPickerModelEle);

		let locationPickerImageConatinerAttributes = [{"class":"ch-location-model-image-container"}];
		let locationPickerImageConatiner = this.utility.createElement("div", locationPickerImageConatinerAttributes, null, locationSendBoxEle);

		let locationPickerImageAttributes = [{"class":"ch-location-model-image"},{"src":IMAGES.LOCATION_ICON},{"title":LANGUAGE_PHRASES.CUREENT_LOCATION}];
		this.utility.createElement("img", locationPickerImageAttributes, null, locationPickerImageConatiner);

		let locationPickerPlaceAddressAttributes = [{"class":"ch-location-model-place-address"}];
		let locationPickerPlaceAddressEle = this.utility.createElement("p", locationPickerPlaceAddressAttributes, null, locationSendBoxEle);

		let locationPickerPlaceAttributes = [{"id":"ch_thread_location_place"},{"class":"ch-location-model-place"}];
		this.utility.createElement("span", locationPickerPlaceAttributes, null, locationPickerPlaceAddressEle);

		let locationPickerAddressAttributes = [{"id":"ch_thread_location_address"},{"class":"ch-location-model-address"}];
		this.utility.createElement("span", locationPickerAddressAttributes, null, locationPickerPlaceAddressEle);

		let locationPickerSendAttributes = [{"id":"ch_thread_location_model_send_btn"},{"class":"ch-location-model-send-btn"},{"title":LANGUAGE_PHRASES.SHARE_LOCATION}];
		let locationPickerSendBtn = this.utility.createElement("i", locationPickerSendAttributes, "send", locationSendBoxEle);
		locationPickerSendBtn.classList.add("material-icons");
		// End Location model layout

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
			if (loadMoreMessages && messages.length) {
				if ( moment(new Date(messages[0].createdAt)).format('DD/MM/YYYY') ==
					moment(new Date(this.threadsMessages[this.threadsMessages.length - 1].createdAt)).format('DD/MM/YYYY')
				) {
					let lastMessageDateTimeEle = document.getElementById("ch_thread_msg_datetime_" + 
					this.threadsMessages[this.threadsMessages.length - 1]['id']);
					if (lastMessageDateTimeEle) {
						lastMessageDateTimeEle.remove();
					}
				}
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
				firstMessage.scrollIntoView({ block: 'nearest', behavior: 'auto' });
			} else {
				messagesBox.scrollTop = messagesBox.scrollHeight;
			}
		});
	}

	_renderLocationModel() {
		// Get user current location
		navigator.geolocation.getCurrentPosition((pos) => {
			this.locationData.latitude = pos.coords.latitude;
      this.locationData.longitude = pos.coords.longitude;
      
      this._initGoogleMap();
		}, err => {
			this._initGoogleMap();
		});
	}

	_initGoogleMap() {
		this.isGoogleMapReady = true;

		this.googleMap = new this.liveStream.google.maps.Map(document.getElementById('ch_thread_google_map_area'), {
			zoom: 13,
			center: {
				lat: this.locationData.latitude,
				lng: this.locationData.longitude
			},
		});

    // Get address
		let geocoder = new this.liveStream.google.maps.Geocoder;
		var address;
		geocoder.geocode({ 'location': {
			lat: this.locationData.latitude,
			lng: this.locationData.longitude
		}}, (results, status) => {
			if (status == "OK") {
				if (results[0] != null) {
					this.locationData.place = "";
					this.locationData.address = results[0].formatted_address;
					document.getElementById("ch_thread_location_address").innerHTML = this.locationData.address;
				} else {
					console.log("No address available.");
				}
			} else {
				console.log("Geocoder failed due to: " + status);
			}
		});
		// Move google map marker to coordinates.
		this._dragLocationMarker();
		
		this._initSearchLocationAutocomplete();
	}

	_dragLocationMarker() {
		this.googleMapMarker = new this.liveStream.google.maps.Marker({
    	position: {
      	lat: this.locationData.latitude,
      	lng: this.locationData.longitude
      },
    	map: this.googleMap
    });
	}

	_initSearchLocationAutocomplete() {
		var locationSearchBar = document.getElementById("ch_thread_location_search_bar");
		var searchBox = new this.liveStream.google.maps.places.SearchBox(locationSearchBar);
		this.googleMap.addListener("bounds_changed", () => {
			searchBox.setBounds(this.googleMap.getBounds());
		});
		
		searchBox.addListener("places_changed", () => {
			var place = searchBox.getPlaces()[0];
			this.locationData.latitude = place.geometry.location.lat();
      this.locationData.longitude = place.geometry.location.lng();
      
      this.locationData.place = place.name;
			this.locationData.address = place.formatted_address;
			document.getElementById("ch_thread_location_place").innerHTML = this.locationData.place;
			document.getElementById("ch_thread_location_address").innerHTML = this.locationData.address;

			// Clear out the old markers.
      this.googleMapMarker.setMap(null);

			this._dragLocationMarker();

      var bounds = new this.liveStream.google.maps.LatLngBounds();
			if (place.geometry.viewport) {
				bounds.union(place.geometry.viewport);
			} else {
				bounds.extend(place.geometry.location);
			}
			this.googleMap.fitBounds(bounds);
		});
	}

	_shareLocation() {
		let attachment = [{
			"latitude": this.locationData.latitude,
			"longitude": this.locationData.longitude,
			"title": this.locationData.place,
			"address": this.locationData.address,
			"type" : "location"
		}];
		this._showLocationModel(false);
		this._sendMessage("location", attachment);
	}

	_createParentMessageBubble(message, messagesBox) {
		let threadStart = document.getElementById("ch_thread_start");
		if (!threadStart) {
			// Create message frame
			this._createMessageBubble(message, messagesBox, false, false, false);

			let parentMessage = document.getElementById("thread_" + message.id);
			// Create a line breaker b/w parent and chid message.
			let threadStartAttributes = [{"id":"ch_thread_start"},{"class":"ch-thread-start ch-msg-bubble"}];
			let threadStart = this.utility.createElement("div", threadStartAttributes, null, parentMessage);

			let threadLineSpanAttributes = [];
			let threadLineSpan = this.utility.createElement("span", threadLineSpanAttributes, LANGUAGE_PHRASES.START_OF_A_NEW_THREAD, threadStart);

			// Set parent message position
			messagesBox.insertBefore(parentMessage, messagesBox.childNodes[0]);

			// Add date time on the top of the parent message.
			let msgDateTimeAttributes = [{"id":"ch_thread_msg_datetime_" + message.id},{"class":"ch-msg-datetime"}];
			let msgDateTimeEle = this.utility.createElement("div", msgDateTimeAttributes, this.utility.formatDate(message.createdAt), null);
			messagesBox.insertBefore(msgDateTimeEle, messagesBox.childNodes[0]);
		}
	}

	_createTextMessageInMessageBubble(message, parentDiv, isPendingMessage) {
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

		if (isPendingMessage || message.isDeleted || !message.body) {
			return;
		}
		// Create rich link preview
		this.chAdapter.getUrlMetaData(message, (err, urlMetaData) => {
			if (err) return;

			urlMetaData.forEach(data => {

				let previewContainerAttributes = [{"class":"preview-container"},{"title":data.url}];
				let previewContainerEle = this.utility.createElement("div", previewContainerAttributes, null, parentDiv);

				let previewContentContainerAttributes = [{"class":"preview-content-container"}];
				let previewContentContainerEle = this.utility.createElement("div", previewContentContainerAttributes, null, previewContainerEle);

				if (data.image) {
					let imageContainerAttributes = [{"class":"image-container"}];
					let imageContainerEle = this.utility.createElement("div", imageContainerAttributes, null, previewContentContainerEle);

					let previewImageAttributes = [{"class":"preview-image"},{"style":"background-image: url(" + data.image + ")"}];
					this.utility.createElement("span", previewImageAttributes, null, imageContainerEle);
				}
				if (data.title) {
					let previewContentTitleAttributes = [{"class":"preview-content-title"},{"title":data.title}];
					this.utility.createElement("h3", previewContentTitleAttributes, data.title, previewContentContainerEle);
				}
				if (data.description) {
					let previewContentDescriptionAttributes = [{"class":"preview-content-description"}];
					this.utility.createElement("p", previewContentDescriptionAttributes, data.description, previewContentContainerEle);
				}

				previewContainerEle.addEventListener('click', (event) => {
					window.open(data.url, '_blank');
				});
				
			});

		});
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

							let locationPlaceAddressAttributes = [{"class":"ch-location-place-address"}];
							let locationPlaceAddressEle = this.utility.createElement("div", locationPlaceAddressAttributes, null, parentDiv);

							let locationPlaceAttributes = [{"class":"ch-location-place"}];
							this.utility.createElement("span", locationPlaceAttributes, attachment.title, locationPlaceAddressEle);

							let locationAddressAttributes = [{"class":"ch-location-address"}];
							this.utility.createElement("span", locationAddressAttributes, attachment.address, locationPlaceAddressEle);
							
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
		let inputBox = document.getElementById("ch_thread_input_box");
		inputBox.addEventListener("keydown", (data) => {
			if (data.keyCode === 13) {
				data.preventDefault();
				if (!inputBox.value.trim()) {
					return;
				}
				this._showMediaIconsDocker(false);
				this._showStickerGifPicker(false);
				this._sendMessage("text");
			}
		});

		// Send button listener
		let sendButton = document.getElementById("ch_thread_send_button");
		sendButton.addEventListener("click", (data) => {
			let inputBox = document.getElementById("ch_thread_input_box").value;
			if (!inputBox.trim()) {
				return;
			}
			this._showMediaIconsDocker(false);
			this._showStickerGifPicker(false);
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
			// Hide sticker and gif picker
			this._showStickerGifPicker(false);

			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
		});

		// Send message on image/audio/video choose
		let attachmentFilePicker = document.getElementsByClassName("ch-thread-msg-input");
		Array.from(attachmentFilePicker).forEach(filePickerInput => {
			filePickerInput.addEventListener("change", (event) => {
				document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
				if (event.target.files[0].size > 25000000) {
					this.utility.showWarningMsg(LANGUAGE_PHRASES.FILE_SIZE_WARNING);
				} else {
					this._sendMessage(filePickerInput.dataset.msgType);
					event.target.value = "";
				}
			});
		});

		// Open the emoji picker.
		let emojiPickerBtn = document.getElementById("ch_thread_emoji_picker_btn");
		const emojiPicker = new EmojiButton();
		emojiPicker.on('emoji', emoji => {
			document.getElementById("ch_thread_input_box").value += emoji;
		});
		emojiPickerBtn.addEventListener('click', () => {
			// Hide media docker
			this._showMediaIconsDocker(false);
			// Hide the sticker and gif picker
			this._showStickerGifPicker(false);
			
			document.getElementById("ch_thread_input_box").focus();
			emojiPicker.togglePicker(emojiPickerBtn);
		});

		// Open Sticker Popup Menu
		let stickerIconEle = document.getElementById("ch_thread_sticker_icon_span");
		stickerIconEle.addEventListener("click", (data) => {
			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
			this._openStickerPickerModel();
		});

		// Open Gif Popup Menu
		let gifIconEle = document.getElementById("ch_thread_gif_icon_span");
		gifIconEle.addEventListener("click", (data) => {
			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
			this._showGifPicker();
		});

		// Open Gif Popup Menu
		let stickerBtn = document.getElementById("ch_thread_sticker_gif_picker_header_sticker_btn");
		stickerBtn.addEventListener("click", (data) => {
			this._openStickerPickerModel();
		});

		// Open Gif Popup Menu
		let gifBtn = document.getElementById("ch_thread_sticker_gif_picker_header_gif_btn");
		gifBtn.addEventListener("click", (data) => {
			this._showGifPicker();
		});

		// Close Gif Popup Menu
		let stickerGifPickerCloseBtn = document.getElementById("ch_thread_sticker_gif_picker_close_btn");
		stickerGifPickerCloseBtn.addEventListener("click", (data) => {
			this._showStickerGifPicker(false);
		});

		// Scroll message box listener
		let stickerGifPickerContent = document.getElementById("ch_thread_sticker_gif_picker_content");
		stickerGifPickerContent.addEventListener("scroll", (data) => {
			if (stickerGifPickerContent.scrollHeight == stickerGifPickerContent.offsetHeight + stickerGifPickerContent.scrollTop) {
				this._loadStickersGifsContent();
			}
		});

		// Search sticker and gif box listener
		var stickerGifSearchTimeout;
		let stickerGifPickerSearchBar = document.getElementById("ch_thread_sticker_gif_picker_search_bar");
		stickerGifPickerSearchBar.addEventListener("keyup", (data) => {
			clearTimeout(stickerGifSearchTimeout);
			stickerGifSearchTimeout = setTimeout(() => {
				if (this.ativeStickerGifPickerTabName == 'stickers') {
					this._openStickerPickerModel();
				}
				if (this.ativeStickerGifPickerTabName == 'gifs') {
					this._showGifPicker();
				}
			}, 1000);
		});

		// Sticker gif search btn listener
		let stickerGifPickerSearchClearBtn = document.getElementById("ch_thread_sticker_gif_picker_search_bar_clear");
		stickerGifPickerSearchClearBtn.addEventListener("click", (data) => {
			let stickerGifPickerSearchBar = document.getElementById("ch_thread_sticker_gif_picker_search_bar");
			stickerGifPickerSearchBar.value = "";
			if (this.ativeStickerGifPickerTabName == 'stickers') {
				this._openStickerPickerModel();
			}
			if (this.ativeStickerGifPickerTabName == 'gifs') {
				this._showGifPicker();
			}
		});

		// Open Location Model
		let locationIconEle = document.getElementById("ch_thread_location_icon_span");
		locationIconEle.addEventListener("click", (data) => {
			// Toggle media message docker
			document.getElementById("ch_thread_media_docker").classList.toggle("ch-thread-show-docker");
			this._showLocationModel(true);
			if (!this.isGoogleMapReady) {
				this._renderLocationModel();
			}
			document.getElementById("ch_thread_location_search_bar").focus();
		});
		
		// Open Sticker Popup Menu
		let locationSearchCloseBtn = document.getElementById("ch_thread_location_search_close_btn");
		locationSearchCloseBtn.addEventListener("click", (data) => {
			this._showLocationModel(false);
		});

		// Send location message on click send btn in location picker
		let sendLocationBtn = document.getElementById("ch_thread_location_model_send_btn");
		sendLocationBtn.addEventListener("click", (data) => {
			this._shareLocation();
		});
	}

	_sendMessage(msgType, attachment) {
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

			case "sticker": case "gif":
				data['attachments'] = attachment;
				this._sendStickerGifMessage(data);
				break;

			case "location":
				data['attachments'] = attachment;
				this._sendLocationMessage(data);
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
		imageMsg.scrollIntoView({ block: 'nearest', behavior: 'auto' });

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

	_sendStickerGifMessage(data) {
		// Add pending message into list
		this._addPendingMessage(data);

		// Scroll to newly added dummy message
		let messagesBox = document.getElementById("ch_thread_messages_box");
		messagesBox.scrollTop = messagesBox.scrollHeight;

		// Hide the sticker and gifs picker
		this._showStickerGifPicker(false);
		
		this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
			if (err) return console.error(err);

			
		});
	}

	_sendLocationMessage(data) {
		// Add pending message into list
		this._addPendingMessage(data);

		// Scroll to newly added dummy message
		let messagesBox = document.getElementById("ch_thread_messages_box");
		messagesBox.scrollTop = messagesBox.scrollHeight;

		// Hide the location picker
		this._showLocationModel(false);
		
		this.chAdapter.sendMessage(this.conversation, data, (err, res) => {
			if (err) return console.error(err);
		});
	}

	_addPendingMessage(msgData) {
		msgData["ownerId"] = this.liveStream.userId;
		msgData['owner'] = this.loginUser;

		let messagesBox = document.getElementById("ch_thread_messages_box");

		// Create message frame
		this._createMessageBubble(msgData, messagesBox, false, true, true);
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
		message = new Channelize.core.Message.Model(this.chAdapter.channelize, message);

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
		this._createMessageBubble(message, messagesBox, true, true, false);
	}

	_getMessages(conversation, limit, skip, cb) {
		this.chAdapter.getMessages(conversation, limit, skip, null, null, null, null, this.parentMessage.id, null, (err, messages) => {
			if (err) return cb(err);

			return cb(null, messages);
		});
	}

	_isDateDiffShown(currentMsgId, lastMsgId, isNewMessage) {
	  	const messageIndex = this.threadsMessages.findIndex(message => message.id == currentMsgId);
	    if (messageIndex == -1) {
	    	return false;
	    }
	    const currentMsgDate = moment(new Date(this.threadsMessages[messageIndex].createdAt)).format('DD/MM/YYYY');

	    // Check if this new message
	    // 1. Yes: this is new entered message.
	    // 2. No: Means this is came from API.
	    if (isNewMessage) {
	    	// This in only one message.
	    	if (!lastMsgId) {
	    		return true;
	    	}
	    	const lastMsgIndex = this.threadsMessages.findIndex(message => message.id == lastMsgId);
		    if (lastMsgIndex == -1) {
		    	return true;
		  	}
		  	const lastMsgDate = moment(new Date(this.threadsMessages[lastMsgIndex].createdAt)).format('DD/MM/YYYY');
		  	if (currentMsgDate != lastMsgDate) {
		  		return true;
			}
			return false;
	    }

	  	if (!this.threadsMessages[messageIndex + 1]) {
	  		return true;
	  	}

	  	const nextMsgDate = moment(new Date(this.threadsMessages[messageIndex + 1].createdAt)).format('DD/MM/YYYY');
	  	
	  	if (currentMsgDate != nextMsgDate) {
	  		return true;
	  	}
	  	return false;
	}

	_createMessageBubble(message, messagesBox, showDateDiff = true, isNewMessage = false, isPendingMessage = false) {
		// Create message list
		const lastMsgId = messagesBox.lastChild && messagesBox.lastChild.id.replace("thread_", "");
		
		let msgBubbleEleAttributes = [{"id":"thread_" + message.id},{"class":"ch-msg-bubble"}];
		let msgBubbleEle = this.utility.createElement("div", msgBubbleEleAttributes, null, messagesBox);

		if(showDateDiff && this._isDateDiffShown(message.id, lastMsgId, isNewMessage)) {
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
		this._createTextMessageInMessageBubble(message, msgDiv, isPendingMessage);

		// Create media message frame
		this._createAttachmentCard(message, msgDiv);

		// Create added message reaction view
		if (this.reactionsSetting.enable && !message.isDeleted) {
			this._createMessageReactionFrame(message, msgDiv);
		}

		
	}

	async _openStickerPickerModel() {
		this._showStickerGifPicker(true);
		this.ativeStickerGifPickerTabName = 'stickers';

		let pickerListEle = document.getElementById("ch_thread_sticker_gif_picker_list");
		if (pickerListEle.innerHTML) {
			pickerListEle.innerHTML = "";
		}

		// Add style on sticker btn and remove from gif btn.
		document.getElementById("ch_thread_sticker_gif_picker_header_sticker_btn").classList.add("ch-active");
		document.getElementById("ch_thread_sticker_gif_picker_header_gif_btn").classList.remove("ch-active");

		// Scroll to top
		let stickerGifPickerContent = document.getElementById("ch_thread_sticker_gif_picker_content");
		stickerGifPickerContent.scrollTop = 0;

		// Change search bar placeholder
		let stickerGifPickerSearchBar = document.getElementById("ch_thread_sticker_gif_picker_search_bar");
		stickerGifPickerSearchBar.placeholder = LANGUAGE_PHRASES.SEARCH_STICKERS;
		
		// Start loading
		this._showStickerGifLoading(true);

		this.stickers = [];
		this._loadStickersGifsContent(stickerGifPickerSearchBar.value);
	}

	async _showGifPicker() {
		this._showStickerGifPicker(true);
		this.ativeStickerGifPickerTabName = 'gifs';

		let pickerListEle = document.getElementById("ch_thread_sticker_gif_picker_list");
		if (pickerListEle.innerHTML) {
			pickerListEle.innerHTML = "";
		}

		// Add style on gif btn
		document.getElementById("ch_thread_sticker_gif_picker_header_gif_btn").classList.add("ch-active");
		document.getElementById("ch_thread_sticker_gif_picker_header_sticker_btn").classList.remove("ch-active");
		
		// Scroll to top
		let stickerGifPickerContent = document.getElementById("ch_thread_sticker_gif_picker_content");
		stickerGifPickerContent.scrollTop = 0;

		// Change search bar placeholder
		let stickerGifPickerSearchBar = document.getElementById("ch_thread_sticker_gif_picker_search_bar");
		stickerGifPickerSearchBar.placeholder = LANGUAGE_PHRASES.SEARCH_GIFS;

		// Start loading
		this._showStickerGifLoading(true);

		this.gifs = [];
		this._loadStickersGifsContent(stickerGifPickerSearchBar.value);
	}

	async _loadStickersGifsContent(searchTerm = null) {
		if (this.ativeStickerGifPickerTabName == 'stickers') {
			let stickers = await this.utility.getStickersGifs('stickers', this.stickers.length, 15, searchTerm);
			this.stickers = this.stickers.concat(stickers);
			// Stop loading
			this._showStickerGifLoading(false);

			this._renderStickersGifs(stickers, 'sticker');
		}
		if (this.ativeStickerGifPickerTabName == 'gifs') {
			let gifs = await this.utility.getStickersGifs('gifs', this.gifs.length, 15, searchTerm);
			this.gifs = this.gifs.concat(gifs);
			// Stop loading
			this._showStickerGifLoading(false);

			this._renderStickersGifs(gifs, 'gif');
		}
	}

	_renderStickersGifs(data, contentType) {
		let pickerListEle = document.getElementById("ch_thread_sticker_gif_picker_list");

		if (!data.length) {
			let pickerErrorAttributes = [{"class":"ch-thread-sticker-gif-picker-error"}];
			this.utility.createElement("li", pickerErrorAttributes, `No ${contentType} found.`, pickerListEle);
			return;
		}

		data.forEach(item => {
			let pickerItemAttributes = [{"id":"ch_thread_sticker_gif_picker_item"},{"class":"ch-thread-sticker-gif-picker-item"}];
			let pickerItemEle = this.utility.createElement("li", pickerItemAttributes, null, pickerListEle);
			
			let pickerItemImgAttributes = [
				{"id":"ch_thread_sticker_gif_picker_item_img_" + item.id},
				{"class":"ch-thread-sticker-gif-picker-item-img"},
				{"title":item.title},
				{"src":IMAGES.LOADING_IMAGE},
				{"data-src":item.images.fixed_height_small.url},
				{"data-loaded":false}
			];
			let pickerItemImgEle = this.utility.createElement("img", pickerItemImgAttributes, null, pickerItemEle);
			
			pickerItemImgEle.addEventListener("click", (data) => {
				let attachment = [{
					"downsampledUrl": item.images.fixed_height_downsampled.url,
					"originalUrl": item.images.fixed_height.url,
					"stillUrl": item.images.fixed_height_still.url,
					"type" : contentType
				}];
				this._sendMessage(contentType, attachment);
			});

			pickerItemImgEle.onload = function() {
				if (!pickerItemImgEle.dataset.loadded) {
					pickerItemImgEle.src = pickerItemImgEle.dataset.src;
					pickerItemImgEle.dataset.loadded = true;
				}
			}
		});
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

	_showStickerGifPicker(value) {
		if (value) {
			document.getElementById("ch_thread_sticker_gif_picker").classList.add("ch-show");
		} else {
			document.getElementById("ch_thread_sticker_gif_picker").classList.remove("ch-show");
		}
	}

	_showLocationModel(value) {
		if (value) {
			document.getElementById("ch_thread_location_model").classList.add("ch-show");
		} else {
			document.getElementById("ch_thread_location_model").classList.remove("ch-show");
		}
	}

	_showStickerGifLoading(show) {
		if (show) {
			document.getElementById("ch_thread_sticker_gif_picker_loader_container").style.display = "block";
		} else {
			document.getElementById("ch_thread_sticker_gif_picker_loader_container").style.display = "none";
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