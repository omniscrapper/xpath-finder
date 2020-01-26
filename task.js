var omniScrapperTask = omniScrapperTask || (() => {
  class Task {
    constructor() {
      this.site = window.location.hostname;
      this.schemas = [];
      this.definition = {};

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
      this.components = {}
    }

    toggle() {
      if (this.modal().length > 0) {
        this.modal().toggle();
      } else {
        this.createModal();

        this.modal().append(this.schemasSelectHtml());
        this.schemaSelect().on('change', () => {
          this.components.schemaFields.node().remove();
          var id = this.schemaSelect().val();
          this.modal().append(this.components.schemaFields.html(id));
        });

        this.components.schemaFields.node().find('button').on('click', (e) => {
          console.log('Click ' + e);
        });

        this.modal().append(
          this.components.schemaFields.html(
            this.task.schemas[0].id
          )
        );
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

    schemasSelectHtml() {
      const options = this.task.schemas.map((v, i, a) => {
        return "<option value=" + v.id + ">" + v.name + "</option>";
      }).join('');
      return "<br/>Schema: <select id='omniscrapper-schema'>" + options + "</select><br/>"
    }

    schemaSelect() {
      return $('#omniscrapper-schema');
    }
  }

  class SchemaFields {
    constructor(task) {
      this.task = task;
    }

    html(schemaId) {
      var output = "<div id='omniscrapper-schema-fields'>";
      var schema = this.task.schemas.find(e => {
        return e.id == schemaId
      }).definition;
      const definition = JSON.parse(schema);

      for (let [key, value] of Object.entries(definition.properties)) {
        output = output
          + "<div id='" + key + "'>"
          + "<span>" + key + "</span>"
          + "<button>pick</button>"
          + "</div>";
      }
      return output + "</div>";
    }

    node() {
      return $('#omniscrapper-schema-fields');
    }
  }

  this.task = new Task();
  this.taskModal = new TaskModal(this.task);
  this.schemaFields = new SchemaFields(this.task);

  this.taskModal.components['schemaFields'] = this.schemaFields;
  console.log(this.taskModal.components);

  chrome.runtime.onMessage.addListener(request => {
    if (request.action === 'toggle-omniscrapper-task') {
      this.taskModal.toggle();
    }
  });

  return true;
})();
