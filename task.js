var omniScrapperTask = omniScrapperTask || (() => {
  class Task {
    constructor(callback) {
      this.site = window.location.hostname;
      this.schemas = [];
      this.definition = {};
      this.afterInitializationCallback = callback;

      chrome.runtime.sendMessage(
        {contentScriptQuery: "queryGraphQl", query: "{ schemas { id definition name }}"},
        schemas => { this.setSelectedSchema(schemas) }
      );
    }

    setSelectedSchema(schemas) {
      this.schemas = schemas.data.schemas;
      this.schemaId = this.schemas[0].id;
      this.afterInitializationCallback(this);
    }
  }

  class TaskModal {
    constructor(dom, task) {
      this.dom = dom;
      this.task = task;
      this.id = 'omniscrapper-task';
      this.modalStyles = `*{cursor:crosshair!important;}#omniscrapper-task{bottom:100px; cursor:initial!important;padding:10px;background:gray;color:white;position:fixed;font-size:14px;z-index:10000001;}`;
      this.components = [];

      this.createModal();
      this.toggle();
    }

    toggle() {
      this.node().toggle();
    }

    render() {
      this.components.forEach((v, i, a) => {
        v.render();
      });
    }

    register(componentClass) {
      const component = new componentClass(this, this.task);
      this.components.push(component);
    }

    createModal() {
      const styles = document.createElement('style');
      styles.innerText = this.modalStyles;
      document.getElementsByTagName('head')[0].appendChild(styles);

      const contentHtml = document.createElement('div');
      contentHtml.innerText = this.task.site;

      contentHtml.id = this.id;
      document.body.appendChild(contentHtml);
    }

    node() {
      return this.dom("#" + this.id);
    }
  }

  class SchemaFields {
    constructor(container, task) {
      this.container = container;
      this.task = task;
      this.id = 'omniscrapper-schema-fields';
    }

    html(schemaId) {
      var output = "<div id='" + this.id + "'>";
      var schema = this.task.schemas.find(e => {
        return e.id == this.task.schemaId
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

    render() {
      this.node().remove();
      this.container.node().append(this.html());
    }

    node() {
      return this.container.node().find('#' + this.id);
    }
  }

  class SchemaSelect {
    constructor(container, task) {
      this.container = container;
      this.task = task;
      this.id = 'omniscrapper-schema';
    }

    render() {
      this.node().remove();
      this.container.node().append(this.html());
      this.selectNode().val(this.task.schemaId);
      this.setListeners();
    }

    html() {
      const options = this.task.schemas.map((v, i, a) => {
        return "<option value=" + v.id + ">" + v.name + "</option>";
      }).join('');
      return "<div id='" + this.id + "'>Schema: <select>" + options + "</select></div>"
    }

    setListeners() {
      this.selectNode().on('change', () => {
        this.task.schemaId = this.selectNode().val();
        this.container.render();
      });
    }

    node() {
      return this.container.node().find('#' + this.id);
    }

    selectNode() {
      return this.node().find('select');
    }
  }

  this.dom = $;
  self = this;

  this.task = new Task(function(task) {
    self.taskModal = new TaskModal(self.dom, task);
    self.taskModal.render();

    self.taskModal.register(SchemaSelect);
    self.taskModal.register(SchemaFields);

    self.taskModal.render();
  });

  chrome.runtime.onMessage.addListener(request => {
    if (request.action === 'toggle-omniscrapper-task') {
      this.taskModal.toggle();
    }
  });

  return true;
})();
