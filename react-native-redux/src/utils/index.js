import {produce, setAutoFreeze} from "immer"
setAutoFreeze(false);

export function createReducer(initialState, actionsMap) {
  return (state = initialState, action) => {
    return produce(state, draft => {
      const caseReducer = actionsMap[action.type];
      return caseReducer ? caseReducer(draft, action) : undefined;
    });
  };
}

export function uniqueList(list) {
  return list.reduce((uniqList, currentValue) => {
    let ids = uniqList.map(item => {
      return item.id;
    });
    if (ids.indexOf(currentValue.id) < 0) {
      uniqList.push(currentValue);
    }
    return uniqList;
  }, []);
};

export const modifyMessageList = (client, list) => {
  const user = client.getLoginUser();
  return list.map((message, i) => {
  	if (!message.hasOwnProperty('isUser')) {
		message['createdAt'] = updateTimeFormat(message.createdAt);
  	}

    // Determine if message owner is self or other? 
    message['isUser'] = false;
    if (user.id == message.ownerId) {
      message.isUser = true
    }

    // Determine if message owner should be displayed or not?
    message.owner.isShow = true;
    if (i < list.length - 1) {
      let prevMessage = list[i + 1];
      if (prevMessage.owner.id === message.owner.id) {
        message.owner.isShow = false;
      }
    }
    return message;
  });
};

export function updateTimeFormat(time) {
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