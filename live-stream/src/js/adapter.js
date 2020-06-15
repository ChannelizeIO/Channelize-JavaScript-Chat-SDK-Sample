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

	getLoginUser() {
		return this.channelize.getCurrentUser();
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

	createUser(name, email, password, cb) {
		let data = {
			displayName : name,
			email : email,
			password : password
		}
		this.channelize.User.createUser(data, function (err, user) {
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

	getConversationsList(limit, skip, memberIds, include, convIds, convType, search, isGroup, customTypes, cb) {
		let conversationListQuery = this.channelize.Conversation.createConversationListQuery();
		conversationListQuery.limit = limit;
		conversationListQuery.skip = skip;
		conversationListQuery.include = include;
		conversationListQuery.ids = convIds;
		conversationListQuery.type = convType;
		conversationListQuery.search = search;
		conversationListQuery.isGroup = isGroup;
		conversationListQuery.customTypes = customTypes;

		if(memberIds)
			conversationListQuery.membersExactly = memberIds;

		conversationListQuery.list(function (err, conversations) {
			if(err) return cb(err);

			cb(null, conversations);
		});
	}

	getConversation(conversationId, cb) {
		this.channelize.Conversation.getConversation(conversationId, "members", function (err, conversation) {
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

	addMembers(conversation, memberIds, cb) {
	    conversation.addMembers(memberIds, function (err, res) {
	    	if (err) return cb(err);

	    	return cb(null, res);
	    });
	}

	removeMembers(conversation, memberIds, cb) {
	    conversation.removeMembers(memberIds, function (err, res) {
	    	if (err) return cb(err);

	    	return cb(null, res);
	    });
	}

	blockUser(userId, cb) {
		this.channelize.User.block(userId, function (err, res) {
			if (err) return cb(err);

	    	return cb(null, res);
	    });
	}

	unblockUser(userId, cb) {
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

	joinConversation(conversation, cb) {
	    conversation.join(function (err, res) {
	        if (err) return cb(err);

	        return cb(null, res);
	    });
	}

	muteConversation(conversation, cb) {
		conversation.muteConversation(function (err, res) {
			if (err) return cb(err);

    	return cb(null, res);
		});
	}

	unmuteConversation(conversation, cb) {
		conversation.unmuteConversation(function (err, res) {
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

	markAsReadConversation(conversation, timestamp, cb) {
	    conversation.markAsRead(timestamp, function (err, res) {
	    	if (err) return cb(err);

	    	return cb(null, res);
	    });
	}

	sendMessage(conversation, data, cb) {
	    conversation.sendMessage(data, function (err, res) {
	    	if (err) return cb(err);

	    	return cb(null, res);
	    });
	}

	sendMessageToUser(data, cb) {
	    this.channelize.Message.sendMessage(data, function (err, message) {
	    	if (err) return cb(err);

	    	return cb(null, message);
	    });
	}

	uploadFile(file, type, createThumbnail, cb) {
	    this.channelize.File.upload(file, type, createThumbnail, function(err, message) {
	    	if (err) return cb(err);

	    	return cb(null, message);
	    });
	}

	getConversationMembers(conversation, cb) {
	    conversation.getMembers(function(err, members) {
	    	if (err) return cb(err);

	    	return cb(null, message);
	    });
	}

	getMessageReadMembers(conversation, message) {
	    return conversation.getReadMembers(message);
	}

	readByAllMembers(conversation, message) {
	    return conversation.readByAllMembers(message);
	}

	getConversationConfig(conversation, key) {
	    return conversation.getConfig(key);
	}

	getMessages(conversation, limit, skip, ids, types, attachmentTypes, ownerIds, parentId, showInConversation, cb) {
		let messageListQuery = conversation.createMessageListQuery();
		messageListQuery.sort = 'createdAt DESC';
		messageListQuery.limit = limit ? limit : 50;
		messageListQuery.skip = skip;
		messageListQuery.ids = ids;
		messageListQuery.types = "normal, forward, reply";
		messageListQuery.attachmentTypes = attachmentTypes;
		messageListQuery.ownerIds = ownerIds;
		messageListQuery.parentId = parentId;
		messageListQuery.showInConversation = showInConversation;
		
		messageListQuery.list(function (err, messages) {
			if (err) return cb(err);

			return cb(null, messages);
		});
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

	getFriends(searchTerm, limit, skip, isOnline, includeBlocked, cb) {
		let userListQuery = this.channelize.User.createUserListQuery();
		userListQuery.search = searchTerm;
		userListQuery.limit = limit;
		userListQuery.skip = skip;
		userListQuery.sort = "displayName ASC";
		userListQuery.isOnline = isOnline;
		userListQuery.includeBlocked = includeBlocked;

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

		userListQuery.usersList(function (err, users) {
			if(err) return cb(err);

			return cb(null, users);
		});
	}

	addReaction(message, data, cb) {
		message.addReaction(data, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}

	removeReaction(message, data, cb) {
		message.removeReaction(data, function (err, res) {
			if(err) return cb(err);

			return cb(null, res);
		});
	}
}

export { ChannelizeAdapter as default };