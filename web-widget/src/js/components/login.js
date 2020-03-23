import Utility from "../utility.js";
import RecentConversations from "./recent-conversations.js";
import { LANGUAGE_PHRASES, IMAGES } from "../constants.js";

class Login {
	constructor(widget) {
		// Initialize dependencies
		this.chAdapter = widget.chAdapter;
		this.utility = new Utility();
		this.widget = widget;

		this._createLoginWindow();
		this._registerClickEventHandlers();
	}

	_createLoginWindow() {
		// Create Login window
		let widget = document.getElementById("ch_frame");
		let loginWindowAttributes = [{"id": "ch_login_window"},{"class":"ch-login-window"}];
		let loginWindow = this.utility.createElement("div", loginWindowAttributes, null, widget);

		// Create login header
		let loginHeaderAttributes = [{"id":"ch_login_header"},{"class":"ch-header"}];
		let loginHeader = this.utility.createElement("div", loginHeaderAttributes, LANGUAGE_PHRASES.LOGIN, loginWindow);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_login_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, loginWindow);

		// Create loader
		let loaderAttributes = [{"id":"ch_login_loader"},{"class":"ch-loader"}];
		this.utility.createElement("div", loaderAttributes, null, loaderContainer);

		// Create close button
		let closeBtnAttributes = [{"id":"ch_login_close_btn"}];
		let closeBtn = this.utility.createElement("i", closeBtnAttributes, "close", loginHeader);
		closeBtn.classList.add("material-icons", "ch-login-close-btn");

		// Create login user name container
		let loginNameContainerAttributes = [{"id":"ch_login_name_container"},{"class":"ch-login-name-container"}];
		let loginNameContainer = this.utility.createElement("div", loginNameContainerAttributes, null, loginWindow);

		// Create name div
		let loginNameAttributes = [{"id":"ch_login_name"},{"class":"ch-login-name"}];
		this.utility.createElement("div", loginNameAttributes, LANGUAGE_PHRASES.NAME, loginNameContainer);

		// Create input div
		let loginNameInputAttributes = [{"id":"ch_login_name_input"},{"class":"ch-login-name-input"},{"type":"text"},{"placeholder":"Enter a name"}];
		this.utility.createElement("input", loginNameInputAttributes, null, loginNameContainer);

		// Create error div
		let errorDivAttributes = [{"id":"ch_login_error"},{"class":"ch-login-error"}];
		this.utility.createElement("div", errorDivAttributes, null, loginNameContainer);

		// Create dummy users list for login
		this._createDummyUsersContainer(loginWindow);

		// Create Login button
		let loginBtnAttributes = [{"id":"ch_login_btn"},{"class":"ch-login-btn"}];
		this.utility.createElement("button", loginBtnAttributes, LANGUAGE_PHRASES.START, loginWindow);
	}

	_createDummyUsersContainer(parent) {
		// Create dummy users container
		let dummyContainerAttributes = [{"id":"ch_dummy_container"},{"class":"ch-dummy-container"}];
		let dummyContainer = this.utility.createElement("div", dummyContainerAttributes, null, parent);

		// Create dummy container text
		let containerTextAttributes = [{"class":"ch_container_text"},{"class":"ch-container-text"}];
		this.utility.createElement("div", containerTextAttributes, LANGUAGE_PHRASES.LOGIN_WITH_TEST_USERS, dummyContainer);

		// Create dummy user number 1 and its listener
		let dummyUser1Attributes = [{"id":"ch_dummy_user1"},{"class":"ch-dummy-img"},{"title":"Anna Smith"},{"src":IMAGES.ANNA_SMITH}];
		let user1 = this.utility.createElement("img", dummyUser1Attributes, null, dummyContainer);

		user1.addEventListener("click", (data) => {
			const email = "test1@seaddons.com";
			const password = "123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 2
		let dummyUser2Attributes = [{"id":"ch_dummy_user2"},{"class":"ch-dummy-img"},{"title":"Katrina Charle"},{"src":IMAGES.KATRINA_CHARLEY}];
		let user2 = this.utility.createElement("img", dummyUser2Attributes, null, dummyContainer);

		user2.addEventListener("click", (data) => {
			const email = "test2@seaddons.com";
			const password = "123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 3
		let dummyUser3Attributes = [{"id":"ch_dummy_user3"},{"class":"ch-dummy-img"},{"title":"Natalie Ivanovic"},{"src":IMAGES.NATALIE_IVANOVIC}];
		let user3 = this.utility.createElement("img", dummyUser3Attributes, null, dummyContainer);

		user3.addEventListener("click", (data) => {
			const email = "test@channelize.io";
			const password = "Test@123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 4
		let dummyUser4Attributes = [{"id":"ch_dummy_user4"},{"class":"ch-dummy-img"},{"title":"Eric Andrews"},{"src":IMAGES.ERIC_ANDREWS}];
		let user4 = this.utility.createElement("img", dummyUser4Attributes, null, dummyContainer);

		user4.addEventListener("click", (data) => {
			const email = "heyley@channelize.io";
			const password = "Test@123456";
			this._loginUser(email, password, true);
		});
	}

	_createUser() {
		let name = document.getElementById("ch_login_name_input").value;
		let errorDiv = document.getElementById("ch_login_error");
		errorDiv.innerText = "";

		if(!name.trim()) {
			errorDiv.style.display = "block";
			errorDiv.innerText =  LANGUAGE_PHRASES.ENTER_NAME;
			return;
		}

		document.getElementById("ch_login_loader_container").style.display = "block";

		var email = name.replace(/\s/g, '').toLowerCase() + "@channelize.io";
		const password = "123456";

		// Create a new user
		this.chAdapter.createUser(name, email, password, (err, user) => {
			if(err) {
				document.getElementById("ch_login_loader_container").style.display = "none";
				errorDiv.style.display = "block";
				errorDiv.innerText =  LANGUAGE_PHRASES.USER_EXIST;
				console.error(err);
				return;
			}

			this._loginUser(email, password, false);
		});
	}

	_loginUser(email, password, isDummyUser = null) {
		document.getElementById("ch_login_loader_container").style.display = "block";
		// Login user
		this.chAdapter.loginWithEmail(email, password, (err, res) => {
			if(err) console.error(err);

			const userId = this.widget.userId =  res.user.id;
			const accessToken = res.id;
			// Connect to Channelize Server
			this.widget.connect(userId, accessToken, (err,res) => {
				if(err) console.error(err);

				// Set cookies
				this.widget.setCookie(userId, accessToken, 30);

				if(isDummyUser) {
					// Open recent conversation window
					new RecentConversations(this.widget);

					// Close login window
					document.getElementById("ch_login_window").remove();
				}
				else {
					new RecentConversations(this.widget);
					// Add channelize.io team as a friend
					// const channelizeTeamId = "16d31770-8843-11e9-88fd-33cb21cf39cd"; // Channelize.io account ID

					// this.chAdapter.addFriend(channelizeTeamId, 2, (err, res) => {
					// 	if(err) return console.error(err);

					// 	// Open recent conversation window
					// 	new RecentConversations(this.widget);
					// });

					// Close login window
					document.getElementById("ch_login_window").remove();
				}
			});
		});
	}

	_registerClickEventHandlers() {
		// Login button listener
		let loginBtn = document.getElementById("ch_login_btn");
		loginBtn.addEventListener("click", data => {
			this._createUser();
		});

		// Close button listener
		let closeBtn = document.getElementById("ch_login_close_btn");
		closeBtn.addEventListener("click", data => {
			document.getElementById("ch_login_window").remove();
		});
	}
}

export { Login as default };