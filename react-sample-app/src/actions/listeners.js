export function updateUserStatus(user) {
	return {
		type: "UPDATE_USER_STATUS",
		user: user
	}
}

export function blockStatus(user, action) {
	return {
		type: "UPDATE_BLOCK_STATUS",
		user: user,
		action: action
	}
}