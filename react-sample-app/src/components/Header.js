import React, { Component } from 'react';

class Header extends Component {

	constructor(props) {
    super(props);
    this.state = {openOptionDocker: false};
  }

	render() {
		return (
			<div id="ch_header" className="ch-header">
				{this.props.headerImg}
				<div className="ch-details-wrapper">
					<div className="ch-header-title">{this.props.title}</div>
					{this.props.showDropDown && 
						<i id="ch_conv_options" className="material-icons ch-conv-options" onClick={()=> this.setState({openOptionDocker:!this.state.openOptionDocker})}>keyboard_arrow_down</i>
					}
					<div className="ch-conv-status">{this.props.status}</div>
				</div>

				<div id="ch_header_option" className="ch-header-option">
					{(this.props.openOptionDocker || this.state.openOptionDocker) && this.props.children}
					{this.props.showCloseBtn &&
						<i id="ch_conv_close_btn" title="Close" className="material-icons ch-close-btn" onClick={this.props.closeFunction}>close</i>
					}
				</div>
			</div>
		);
	}
}

export default Header;