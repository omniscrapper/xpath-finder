var omniScrapperTask = omniScrapperTask || (() => {
  class Task {
    constructor() {
      this.site = window.location.hostname;
      this.schemas = [];

      chrome.runtime.sendMessage(
        {contentScriptQuery: "queryGraphQl", query: "{ schemas { id definition name }}"},
        schemas => { this.schemas = schemas.data.schemas }
      );
    }
  }

  class TaskModal {
    constructor(task) {
      this.task = task;
      this.taskModalId = 'omniscrapper-task';
      this.modalStyles = `*{cursor:crosshair!important;}#omniscrapper-task{bottom:100px; cursor:initial!important;padding:10px;background:gray;color:white;position:fixed;font-size:14px;z-index:10000001;}`;
    }

    toggle() {
      if (this.modal().length > 0) {
        this.modal().toggle();
      } else {
        this.createModal();
        this.modal().append(this.schemasSelect())
      }
    }

    createModal() {
      const styles = document.createElement('style');
      styles.innerText = this.modalStyles;
      document.getElementsByTagName('head')[0].appendChild(styles);

      const contentHtml = document.createElement('div');
      contentHtml.innerText = this.task.site;

      contentHtml.id = this.taskModalId;
      document.body.appendChild(contentHtml);
    }

    modal() {
      return $("#" + this.taskModalId);
    }

    schemasSelect() {
      const options = this.task.schemas.map((v, i, a) => {
        return "<option value=" + v.id + ">" + v.name + "</option>";
      }).join('');
      return "<select>" + options + "</select>"
    }
  }

  this.task = new Task();
  this.taskModal = new TaskModal(this.task);

  chrome.runtime.onMessage.addListener(request => {
    if (request.action === 'toggle-omniscrapper-task') {
      this.taskModal.toggle();
    }
  });

  return true;
})();
