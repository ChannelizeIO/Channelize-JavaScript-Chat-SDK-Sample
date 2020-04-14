const initState = {
	chAdapter: null,
	isConnected: false,
	isShowWidget: false,
	isRecentWindowOpen: true,
	recentConversations: [],
	isConversationWindowOpen: false,
	openConversation: null,
	showMessages: false,
	isSearchWindowOpen: false,
	friends: [],
	users: []
}

// function handleNewMessage(state, action) {
// 	let messages = state.messages;
// 	messages.push(action.message);
// 	return {...state, recentConversations: action.recentConversations, openConversation: action.conversation, messages: messages};
// }

function updateUserStatus(state, action) {
	state.recentConversations.forEach(conv => {
		if(!conv.isGroup && conv.user.id === action.user.id) {
			conv.user.isOnline = action.user.isOnline;
		} 
	});
	return {...state, ...action};
}

function loadMessages(state, action) {
	const index = state.recentConversations.findIndex(conv => conv.id === action.conversationId);
	if(index !== -1) {
		state.recentConversations[index]["messages"] = action.messages;
	}

	state.openConversation["messages"] = action.messages;
	return {...state, showMessages: action.showMessages};
}

function updateBlockStatus(state, action) {
	action = action === "block" ? true : false;

	state.recentConversations.forEach(conv => {
		if(!conv.isGroup && conv.blocker && conv.user.id === action.blocker.id) {
			conv.blockedByMember = action;
		}
		else if(!conv.isGroup && conv.blocker && conv.user.id === action.blocker.id) {
			conv.blockedByUser = action;
		}
	});

	return {...state};
}

function updateReadStatus(state, action) {
	if(state.openConversation && action.conversation.id === state.openConversation.id) {
		if(state.openConversation.messages) {
			state.openConversation.messages.forEach(message => {
				message.readByAll = state.chAdapter.readByAllMembers(state.openConversation, message);
			});
		}
	}
	return {...state};
}

function openMemberConversation(state, action) {
	const index = state.recentConversations.findIndex(conv => conv.id === action.conversation.id);
	let openConversation;
	if(index !== -1) {
		state.recentConversations[index]["messages"] = action.messages;
		openConversation = state.recentConversations[index];
	}

	return {...state, openConversation: openConversation, showMessages: action.showMessages};
}

const rootReducer = (state = initState, action) => {
	switch(action.type) {
		case "HANDLE_CONNECTION":
			return {...state, chAdapter: action.chAdapter, userId: action.userId, isConnected: action.isConnected};

		case "SHOW_WIDGET":
			return {...state, isShowWidget: action.isShowWidget, isRecentWindowOpen: true};

		case "LOAD_RECENT_CONVERSATIONS":
			return {...state, recentConversations: action.conversations};

		case "LOAD_MESSAGES":
			return loadMessages(state, action);

		case "OPEN_CONVERSATION_WINDOW":
			return {...state, isConversationWindowOpen: true, openConversation: action.conversation};

		case "HANDLE_NEW_MESSAGE":
			return {...state, recentConversations: action.recentConversations, openConversation: action.conversation};

		case "OPEN_SEARCH_WINDOW":
			return {...state, isSearchWindowOpen: true};

		case "LOAD_FRIENDS":
			return {...state, friends: action.friends};

		case "LOAD_USERS":
			return {...state, users: action.users};

		case "OPEN_MEMBER_CONVERSATION":
			return openMemberConversation(state, action);

		case "CLOSE_WINDOW":
			return {...state, ...action};

		case  "UPDATE_USER_STATUS":
			return updateUserStatus(state, action);

		case "UPDATE_BLOCK_STATUS":
			return updateBlockStatus(state, action);

		case "UPDATE_READ_STATUS":
			return updateReadStatus(state, action);

		default :
			return state;
	}
}

export default rootReducer