import Utility from "../utility.js";
import ConversationWindow from "./conversation-window.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants.js";

class Members {
	constructor(widget, conversationId) {
		this.widget = widget;
		this.chAdapter = widget.chAdapter;
		this.conversationId = conversationId;
		this.utility = new Utility();
		this.createMembersList();
	}

	createMembersList() {
		// Remove previous members window if exist
		let olderMembersWindow = document.getElementById("ch_members_window");
		if(olderMembersWindow) {
			olderMembersWindow.remove();
		}

		// Create members box components
		let widget = document.getElementById("ch_frame");
		let membersWindowAttributes = [{"id": "ch_members_window"},{"class":"ch-members-window"}];
		let membersWindow = this.utility.createElement("div", membersWindowAttributes, null, widget);

		// Create members header
		let membersHeaderAttributes = [{"id":"ch_members_header"},{"class":"ch-header"}];
		let membersHeader = this.utility.createElement("div", membersHeaderAttributes, LANGUAGE_PHRASES.MEMBERS, membersWindow);

		// Create members Close button
		let closeBtnAttributes = [{"id":"ch_members_close_btn"}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "arrow_back", membersHeader);
		closeBtn.classList.add("material-icons", "ch-close-btn");

		// Create members listing box
		let membersBoxAttributes = [{"id":"ch_members_box"},{"class":"ch-members-box"}];
		this.utility.createElement("div", membersBoxAttributes, null, membersWindow);

		// get conversation Members
		this.chAdapter.getConversation(this.conversationId, (err, conversation) => {
		    if (err) return console.error(err);

		    if(conversation.members) {
		    	conversation.members.forEach(member => {
	    			this._loadMembers(member);
		    	});
		    }
		});

		this._registerClickEventHandlers();
	}

	_loadMembers(member) {
		let membersBox = document.getElementById("ch_members_box");
		let membersListAttributes = [{"id":member.userId},{"class":"ch-members-list"}];
		let membersList = this.utility.createElement("li", membersListAttributes, null, membersBox);

		if(member.userId !== this.widget.userId) {
			// Add click listener on members list
			membersList.addEventListener("click", (data) => {
				// Remove conversation window
				if(document.getElementById("ch_conv_window")) {
					document.getElementById("ch_conv_window").remove();
					this.widget.convWindows.pop();
				}

				// Remove members window
				document.getElementById("ch_members_window").remove();

				// Check for exist conversation
				this.chAdapter.getConversationsList(1, 0 , member.userId, "members", null, null, null, null, null, (err, conversation) => {
					if(err) return console.error(err);

					conversation = conversation[0];

					if(conversation) {
						const conversationWindow = new ConversationWindow(this.widget);
						conversationWindow.init(conversation);
						this.widget.convWindows.push(conversationWindow);
					}
					else {
						// Open new conversation window
						const conversationWindow = new ConversationWindow(this.widget);
						conversationWindow.init(null, member.user);
						this.widget.convWindows.push(conversationWindow);
					}
				});
			});
		}
		else {
			membersList.style.cursor = "text";
		}

		// Create image tag
		member.profileImageUrl = member.user.profileImageUrl ? member.user.profileImageUrl : IMAGES.AVTAR;
		let imageAttributes = [{"id":"ch_member_img"},{"class":"ch-member-img"}];
		let memberImg = this.utility.createElement("div", imageAttributes, null, membersList);
		memberImg.style.backgroundImage = "url(" + member.profileImageUrl + ")";

		// Create name div
		const memberName = member.userId === this.widget.userId ? member.user.displayName + " (You)" : member.user.displayName;
		let nameAttributes = [{"id":"ch_member_name"},{"class":"ch-member-name"}];
		this.utility.createElement("div", nameAttributes, memberName, membersList);

		// Create online icon
		let iconAttributes = [{"id":member.user.id+"_member_online_icon"},{"class":"ch-online-icon"}];
		let icon = this.utility.createElement("span", iconAttributes, null, memberImg);

		// Show online icon
		if(member.user.isOnline) {
			icon.classList.add("ch-show-element");
		}
	}

	_registerClickEventHandlers() {
		// Close search button listener
		let closeBtn = document.getElementById("ch_members_close_btn");
		if(closeBtn) {
			closeBtn.addEventListener("click", (data) => {
				document.getElementById("ch_members_window").remove();
			});
		}
	}
}

export { Members as default }