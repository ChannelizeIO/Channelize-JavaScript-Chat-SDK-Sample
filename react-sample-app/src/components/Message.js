import React, { Component } from 'react';
import Utility from "../helpers/utility.js";

class Message extends Component {

	constructor(props) {
    super(props);
		this.utility = new Utility();
	}

	render() {
		// Set class for user/owner message
		if(this.props.message.ownerId === this.props.loginUserId) {
			this.msgContainerPos = "right";
			this.optionIconPos = "left";
		}
		else {
			this.msgContainerPos = "left";
			this.optionIconPos = "right";
		}

		let message = this.props.message;
		let readIcon = message.readByAll ? "done_all" : "check";

		return (
			<div id={message.id} className="ch-msg-list">
				<div>
					<div className={`ch-msg-container ${this.msgContainerPos}`}>
						<div className="ch-message">{message.body}</div>
						<span id="ch_msg_time" className="ch-msg-time">{message.time}</span>
						{
							message.ownerId === this.props.loginUserId &&
							<i id="ch_msg_status" className="material-icons ch-msg-status">{readIcon}</i>
						}
					</div>
				</div>
			</div>
		);
	}
}

export default Message;