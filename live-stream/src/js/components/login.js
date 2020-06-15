import Utility from "../utility.js";
import Conversation from "./conversation.js";
import { LANGUAGE_PHRASES, SETTINGS, IMAGES } from "../constants.js";

class Login {
	constructor(liveStream) {
		// Initialize dependencies
		this.chAdapter = liveStream.chAdapter;
		this.utility = new Utility();
		this.liveStream = liveStream;

		this._createLoginScreen();
		this._registerClickEventHandlers();
	}

	_createLoginScreen() {
		// Create Login screen
		let chFrame = document.getElementById("ch_frame");

		// Create login screen
		let loginScreenAttributes = [{"id": "ch_login_screen"},{"class":"ch-login-screen"}];
		let loginScreen = this.utility.createElement("div", loginScreenAttributes, null, chFrame);

		// Create loader container
		let loaderContainerAttributes = [{"id":"ch_login_loader_container"},{"class":"ch-loader-bg"}];
		let loaderContainer = this.utility.createElement("div", loaderContainerAttributes, null, loginScreen);
		
		// Create loader
		let loaderAttributes = [{"id":"ch_login_loader"},{"class":"ch-loader"}];
		let loader = this.utility.createElement("div", loaderAttributes, null, loaderContainer);

		// Create login header
		let headerAttributes = [{"class":"ch-header"}];
		let header = this.utility.createElement("div", headerAttributes, null, loginScreen);

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

		// Create header header title
		let titleAttributes = [{"class":"ch-header-title"}];
		let headerTitle = this.utility.createElement("div", titleAttributes, LANGUAGE_PHRASES.LOGIN, headerCenter);

		// Create login body container
		let loginBodyContainerAttributes = [{"id":"ch_login_body_container"},{"class":"ch-login-body-container ch-body"}];
		let loginBodyContainer = this.utility.createElement("div", loginBodyContainerAttributes, null, loginScreen);

		// Create dummy users list for login
		this._createDummyUsersContainer(loginBodyContainer);

		// Create or div
		let loginMoreOptionAttributes = [{"class":"ch-login-sperator"}];
		this.utility.createElement("div", loginMoreOptionAttributes, LANGUAGE_PHRASES.OR, loginBodyContainer);

		// Create login user name container
		let loginNameContainerAttributes = [{"id":"ch_login_name_container"},{"class":"ch-login-name-container"}];
		let loginNameContainer = this.utility.createElement("div", loginNameContainerAttributes, null, loginBodyContainer);

		// Create name div
		let loginNameAttributes = [{"id":"ch_login_name"},{"class":"ch-login-name"}];
		this.utility.createElement("div", loginNameAttributes, LANGUAGE_PHRASES.ENTER_YOUR_NAME_GET_STARTED, loginNameContainer);

		// Create input div
		let loginNameInputAttributes = [{"id":"ch_login_name_input"},{"class":"ch-login-name-input"},
					{"type":"text"},{"placeholder":LANGUAGE_PHRASES.ENTER_NAME}];
		this.utility.createElement("input", loginNameInputAttributes, null, loginNameContainer);

		// Create error div
		let errorDivAttributes = [{"id":"ch_login_error"},{"class":"ch-login-error"}];
		this.utility.createElement("div", errorDivAttributes, null, loginNameContainer);


		// Create Login button
		let loginBtnAttributes = [{"id":"ch_login_btn"},{"class":"ch-login-btn"}];
		this.utility.createElement("button", loginBtnAttributes, LANGUAGE_PHRASES.START, loginBodyContainer);
	}

	_createDummyUsersContainer(parent) {
		// Create dummy users container
		let dummyContainerAttributes = [{"id":"ch_dummy_container"},{"class":"ch-dummy-container"}];
		let dummyContainer = this.utility.createElement("div", dummyContainerAttributes, null, parent);

		// Create dummy container text
		let containerTextAttributes = [{"class":"ch_container_text"},{"class":"ch-container-text"}];
		this.utility.createElement("div", containerTextAttributes, LANGUAGE_PHRASES.TRY_WITH_TEST_USERS, dummyContainer);

		// Create dummy user number 1 and its listener
		let dummyUser1Attributes = [{"id":"ch_dummy_user1"},{"class":"ch-dummy-img"},{"title":"Anna Smith"},{"src":IMAGES.ANNA_SMITH}];
		let user1 = this.utility.createElement("img", dummyUser1Attributes, null, dummyContainer);

		user1.addEventListener("click", (data) => {
			const email = "test21@gamil.com";
			const password = "123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 2
		let dummyUser2Attributes = [{"id":"ch_dummy_user2"},{"class":"ch-dummy-img"},{"title":"Katrina Charle"},{"src":IMAGES.KATRINA_CHARLEY}];
		let user2 = this.utility.createElement("img", dummyUser2Attributes, null, dummyContainer);

		user2.addEventListener("click", (data) => {
			const email = "test22@gamil.com";
			const password = "123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 3
		let dummyUser3Attributes = [{"id":"ch_dummy_user3"},{"class":"ch-dummy-img"},{"title":"Natalie Ivanovic"},{"src":IMAGES.NATALIE_IVANOVIC}];
		let user3 = this.utility.createElement("img", dummyUser3Attributes, null, dummyContainer);

		user3.addEventListener("click", (data) => {
			const email = "test23@gamil.com";
			const password = "123456";
			this._loginUser(email, password, true);
		});

		// Create dummy user number 4
		let dummyUser4Attributes = [{"id":"ch_dummy_user4"},{"class":"ch-dummy-img"},{"title":"Eric Andrews"},{"src":IMAGES.ERIC_ANDREWS}];
		let user4 = this.utility.createElement("img", dummyUser4Attributes, null, dummyContainer);

		user4.addEventListener("click", (data) => {
			const email = "test24@gamil.com";
			const password = "123456";
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

		this._showLoading(true);

		var email = name.replace(/\s/g, '').toLowerCase() + "@channelize.io";
		const password = "123456";

		// Create a new user
		this.chAdapter.createUser(name, email, password, (err, user) => {
			if(err) {
				this._showLoading(false);
				errorDiv.style.display = "block";
				errorDiv.innerText =  LANGUAGE_PHRASES.USER_EXIST;
				console.error(err);
				return;
			}

			this._loginUser(email, password, false);
		});
	}

	_loginUser(email, password, isDummyUser = null) {
		this._showLoading(true);

		// Login user
		this.chAdapter.loginWithEmail(email, password, (err, res) => {
			
			if(err) {
				this._showLoading(false);
				console.error(err);
				return;
			}

			const userId = this.liveStream.userId =  res.user.id;
			const accessToken = res.id;
			// Connect to Channelize Server
			this.liveStream.connect(userId, accessToken, (err,res) => {
				if(err) console.error(err);

				// Set cookies
				this.liveStream.setCookie(userId, accessToken, 30);
				
				this.liveStream.loadConversation(SETTINGS.CONVERSATION_ID);
			});
		});
	}

	_registerClickEventHandlers() {
		// Login button listener
		let loginBtn = document.getElementById("ch_login_btn");
		loginBtn.addEventListener("click", data => {
			this._createUser();
		});
	}

	_showLoading(show) {
		if (show) {
			document.getElementById("ch_login_loader_container").style.display = "block";
		} else {
			document.getElementById("ch_login_loader_container").style.display = "none";
		}
	}
}

export { Login as default };