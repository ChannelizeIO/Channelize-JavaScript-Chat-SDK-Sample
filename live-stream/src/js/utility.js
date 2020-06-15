import moment from 'moment';
import { LANGUAGE_PHRASES } from "./constants.js";

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

  formatDate(date) {
    var currentDate = moment();
    var formattedDate = moment(date);
    if (currentDate.format('DD/MM/YYYY') == formattedDate.format('DD/MM/YYYY')) {
      return LANGUAGE_PHRASES.TODAY;
    }
    if (currentDate.diff(formattedDate,'days') == 1) {
      return LANGUAGE_PHRASES.YESTERDAY;
    }
    return formattedDate.format('DD MMMM YYYY');
  }

  createModelFrame() {
    let modelFrameAttributes = [{"id":"ch_modal_frame"},{"class":"ch-modal-wrapper"}];
    let modelFrameEle = this.createElement("div", modelFrameAttributes, null, document.body);

    let modelContainerAttributes = [{"class":"ch-model-container"}];
    let modelContainer = this.createElement("div", modelContainerAttributes, null, modelFrameEle);
    
    let modelCloseBtnAttributes = [{"class":"ch-model-close"},{"title":LANGUAGE_PHRASES.CLOSE}];
    let modelCloseBtn = this.createElement("i", modelCloseBtnAttributes, "cancel", modelContainer);
    modelCloseBtn.classList.add("material-icons");

    let modelDataContainerAttributes = [{"id":"ch_model_data_container"},{"class":"ch-model-data-container"}];
    let modelDataContainer = this.createElement("div", modelDataContainerAttributes, null, modelContainer);

    modelCloseBtn.addEventListener("click", (event) => {
      modelFrameEle.style.display = "none";
      modelDataContainer.innerHTML = "";
    });
  }

  openAttachmentFileInModel(fileUrl, attachmentType) {
    let modelFrameEle = document.getElementById("ch_modal_frame");;
    let modelDataContainer = document.getElementById("ch_model_data_container");
    switch(attachmentType) {
      case "image":
        // modelDataContainer.classList.add("ch-image");
        modelFrameEle.style.display = "block";
        let imageDataAttributes = [{"class":"ch-model-image"},{"src":fileUrl}];
        this.createElement("img", imageDataAttributes, null, modelDataContainer);
        break;

      case "video":
        // modelDataContainer.classList.add("ch-image");
        modelFrameEle.style.display = "block";
        let videoDataAttributes = [
          {"class":"ch-model-video"},
          {"controls": true},
          {"preload": "auto"},
          {"loop": "loop"},
          {"autoplay": "autoplay"},
          {"src":fileUrl}
        ];
        this.createElement("video", videoDataAttributes, null, modelDataContainer);
        break;
    }
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

  formatDuration(duration) {
    let updatedDuration, actualDuration;
    actualDuration = duration / 1000;
    updatedDuration = ((Math.floor(actualDuration / 60) + (actualDuration % 60) / 100).toFixed(2)).toString().replace('.',':');
    return updatedDuration;
  }
}

export { Utility as default };