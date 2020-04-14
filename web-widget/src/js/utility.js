class Utility {
	constructor() {}

	createElement(tagName, attributes = null, data = null, parentTag = null) {
		let element = document.createElement(tagName);
        if(data)
            element.innerHTML = data;
        
        if(parentTag)
            parentTag.appendChild(element);

		if(attributes && Array.isArray(attributes)) {
			attributes.forEach(attribute => {
				let keys = Object.keys(attribute);
				let values = Object.values(attribute);
				element.setAttribute(keys[0], values[0]);
			});
		}
		return element;
	}

	updateTimeFormat(time) {
      	const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

        var _getDay = val => {
            let day = parseInt(val);
            if (day == 1) {
                return day + "st";
            } else if (day == 2) {
                return day + "nd";
            } else if (day == 3) {
                return day + "rd";
            } else {
                return day + "th";
            }
        };

        var _checkTime = val => {
            return +val < 10 ? "0" + val : val;
        };

        if (time) {
            const LAST_MESSAGE_YESTERDAY = "Yesterday";
            var _nowDate = new Date();
            var _date = new Date(time);
            if (_nowDate.getDate() - _date.getDate() == 1) {
                return LAST_MESSAGE_YESTERDAY;
            } else if (
                _nowDate.getFullYear() == _date.getFullYear() &&
                _nowDate.getMonth() == _date.getMonth() &&
                _nowDate.getDate() == _date.getDate()
            ) {
                return (
                    _checkTime(_date.getHours()) + ":" + _checkTime(_date.getMinutes())
                );
            } else {
                return months[_date.getMonth()] + " " + _getDay(_date.getDate());
            }
        }
        return "";
    }

    showWarningMsg(text) {
        // Create snackbar for warnings
        let windowDiv = document.getElementById("ch_frame");
        let snackbarAttributes = [{"id":"ch_snackbar"}];
        this.createElement("div", snackbarAttributes, null, windowDiv);

        // Show size limit exceed message
        let snackbar = document.getElementById("ch_snackbar");
        snackbar.innerText = text;
        setTimeout(function() {
            snackbar.remove();
        }, 3000);
    }
}

export { Utility as default };