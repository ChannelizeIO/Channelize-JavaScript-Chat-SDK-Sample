class ChannelizeAdapter {

	constructor(publicKey) {
		this.channelize = window.channelize = new Channelize.client({publicKey: publicKey});
	}

	loginWithEmail(email, password, cb) {
		this.channelize.loginWithEmailPassword(email, password, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	loginWithUserId(userId, pmClientServerToken, cb) {
		this.channelize.loginWithUserId(userId, pmClientServerToken, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	getCurrentUser(cb) {
		return cb(null, this.channelize.getCurrentUser());
	}

	connect(userId, accessToken, cb) {
		this.channelize.connect(userId, accessToken, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	disconnect(deviceId, cb) {
		this.channelize.disconnect(deviceId, function (err, res) {
			if(err) return cb(err);

			return cb(null, res)
		});
	}

	createUser(displayName, email, password, cb) {
		this.channelize.User.createUser(displayName, email, password, function (err, user) {
			if(err) return cb(err);

			return cb(null, user);
		});
	}

	getUser(userId, cb) {
		this.channelize.User.get(userId, function (err, user) {
			if(err) return cb(err);

			return cb(null, user);
		});
	}

	getConversationsList(limit, skip, memberId = null, cb) {
		let conversationListQuery = this.channelize.Conversation.createConversationListQuery();
		conversationListQuery.limit = limit;
		conversationListQuery.skip = skip;
		if(memberId)
			conversationListQuery.memberId = memberId;

		conversationListQuery.list(function (err, conversations) {
			if(err) return cb(err);

			cb(null, conversations);
		});
	}

	getConversation(conversationId, cb) {
		this.channelize.Conversation.getConversation(conversationId, "messages", function (err, conversation) {
			if(err) return cb(err);

			return cb(null, conversation);
		});
	}

	createConversation(data, cb) {
		this.channelize.Conversation.createConversation(data, function (err, conversation) {
			if(err) return cb(err);

			return cb(null, conversation);
		});
	}

	addMember(conversation, memberIds, cb) {
    conversation.addMembers(memberIds, function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	removeMember(conversation, memberIds, cb) {
    conversation.removeMembers(memberIds, function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	blockMember(userId, cb) {
		this.channelize.User.block(userId, function (err, res) {
		if (err) return cb(err);

    	return cb(null, res);
    });
	}

	unblockMember(userId, cb) {
		this.channelize.User.unblock(userId, function (err, res) {
		if (err) return cb(err);

    	return cb(null, res);
    });
	}

	clearConversation(conversation, cb) {
    conversation.clear(function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	leaveConversation(conversation, cb) {
    conversation.leave(function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	muteConversation(conversation, cb) {
		conversation.mute(function (err, res) {
			if (err) return cb(err);

    	return cb(null, res);
		});
	}

	deleteConversation(conversation, cb) {
    conversation.delete(function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	markAsReadConversation(conversation, cb) {
    conversation.markAllMessageRead(function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	async sendTextMessage(conversation, body, tags = [], cb) {
    conversation.sendTextMessage(body, tags, function (err, res) {
    	if (err) return cb(err);

    	return cb(null, res);
    });
	}

	async sendTextMessageToUser(userId, body, cb) {
    this.channelize.Message.sendTextMessage(userId, body, function (err, message) {
    	if (err) return cb(err);

    	return cb(null, message);
    });
	}

	async sendFileMessage(conversation, file, createThumbnail, cb) {
    conversation.sendFileMessage(file, createThumbnail, function(err, message) {
    	if (err) return cb(err);

    	return cb(null, message);
    });
	}

	getMessages(conversation, limit = 50, skip = 0, cb) {
		let messageListQuery = conversation.createMessageListQuery();
		messageListQuery.sort = 'createdAt DESC';
		messageListQuery.limit = limit;	
		messageListQuery.skip = skip;

		messageListQuery.list(function (err, messages) {
			if (err) return cb(err);

			return cb(null, messages);
		});
	}

	getLastMessage(conversation, cb) {
		return cb(null, conversation.getLastMessage());
	}

	deleteMessagesForMe(messageIds, cb) {
		this.channelize.Message.deleteMessagesForMe(messageIds, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	deleteMessagesForEveryone(messageIds, cb) {
		this.channelize.Message.deleteMessagesForEveryone(messageIds, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	addFriend(userId, type, cb) {
		this.channelize.User.addFriend(userId, type, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	getFriends(cb) {
		let userListQuery = this.channelize.User.createUserListQuery();
		userListQuery.friendsList(function (err, users) {
			if(err) return cb(err);

			return cb(null, users);
		});
	}

	getAllUsers(searchValue, limit, skip, role, includeDeleted, cb) {
		let userListQuery = this.channelize.User.createUserListQuery();
		userListQuery.search = searchValue;
		userListQuery.limit = limit;
		userListQuery.skip = skip;
		userListQuery.role = role;
		userListQuery.includeDeleted = includeDeleted;

		userListQuery.allUsersList(function (err, users) {
			if(err) return cb(err);

			return cb(null, users);
		});
	}

}

export { ChannelizeAdapter as default };