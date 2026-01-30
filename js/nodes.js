/**
 * IDS-Think — Node Editor
 * Custom LiteGraph node types for connecting JSON APIs.
 */

/* ========================================================================
   1. Node Type: API Request
      Makes an HTTP GET/POST request to a URL and outputs JSON.
   ======================================================================== */

function APIRequestNode() {
  this.addInput("URL", "string");
  this.addInput("Body", "json");
  this.addOutput("Response", "json");
  this.addOutput("Status", "number");
  this.addProperty("url", "https://jsonplaceholder.typicode.com/todos/1");
  this.addProperty("method", "GET");
  this.addWidget("text", "URL", this.properties.url, function (v) {
    this.properties.url = v;
  }.bind(this));
  this.addWidget("combo", "Method", this.properties.method, function (v) {
    this.properties.method = v;
  }.bind(this), { values: ["GET", "POST", "PUT", "DELETE"] });

  this._data = null;
  this._status = null;
  this._fetching = false;
  this.size = [320, 130];
}

APIRequestNode.title = "API Request";
APIRequestNode.desc = "Fetch JSON from an HTTP endpoint";

APIRequestNode.prototype.onExecute = function () {
  var urlInput = this.getInputData(0);
  var url = urlInput || this.properties.url;

  if (!url || this._fetching) {
    this.setOutputData(0, this._data);
    this.setOutputData(1, this._status);
    return;
  }

  this._fetching = true;
  var self = this;
  var opts = { method: this.properties.method };

  if (this.properties.method !== "GET") {
    var body = this.getInputData(1);
    if (body !== undefined) {
      opts.headers = { "Content-Type": "application/json" };
      opts.body = JSON.stringify(body);
    }
  }

  fetch(url, opts)
    .then(function (res) {
      self._status = res.status;
      return res.json();
    })
    .then(function (json) {
      self._data = json;
      self._fetching = false;
    })
    .catch(function (err) {
      self._data = { error: err.message };
      self._status = 0;
      self._fetching = false;
    });

  this.setOutputData(0, this._data);
  this.setOutputData(1, this._status);
};

LiteGraph.registerNodeType("api/request", APIRequestNode);


/* ========================================================================
   2. Node Type: JSON Property
      Extracts a value from a JSON object by dot-path.
   ======================================================================== */

function JSONPropertyNode() {
  this.addInput("JSON", "json");
  this.addOutput("Value", "json");
  this.addProperty("path", "");
  this.addWidget("text", "Path", this.properties.path, function (v) {
    this.properties.path = v;
  }.bind(this));
  this.size = [280, 80];
}

JSONPropertyNode.title = "JSON Property";
JSONPropertyNode.desc = "Extract a value by dot-path (e.g. data.items)";

JSONPropertyNode.prototype.onExecute = function () {
  var input = this.getInputData(0);
  if (input === undefined || input === null) {
    this.setOutputData(0, undefined);
    return;
  }

  var path = this.properties.path;
  if (!path) {
    this.setOutputData(0, input);
    return;
  }

  var parts = path.split(".");
  var val = input;
  for (var i = 0; i < parts.length; i++) {
    if (val === undefined || val === null) break;
    val = val[parts[i]];
  }
  this.setOutputData(0, val);
};

LiteGraph.registerNodeType("json/property", JSONPropertyNode);


/* ========================================================================
   3. Node Type: JSON Filter
      Filters an array of objects by a property condition.
   ======================================================================== */

function JSONFilterNode() {
  this.addInput("Array", "json");
  this.addOutput("Filtered", "json");
  this.addOutput("Count", "number");
  this.addProperty("key", "");
  this.addProperty("operator", "==");
  this.addProperty("value", "");
  this.addWidget("text", "Key", this.properties.key, function (v) {
    this.properties.key = v;
  }.bind(this));
  this.addWidget("combo", "Op", this.properties.operator, function (v) {
    this.properties.operator = v;
  }.bind(this), { values: ["==", "!=", ">", "<", ">=", "<=", "contains"] });
  this.addWidget("text", "Value", this.properties.value, function (v) {
    this.properties.value = v;
  }.bind(this));
  this.size = [280, 150];
}

JSONFilterNode.title = "JSON Filter";
JSONFilterNode.desc = "Filter a JSON array by condition";

JSONFilterNode.prototype.onExecute = function () {
  var arr = this.getInputData(0);
  if (!Array.isArray(arr)) {
    this.setOutputData(0, []);
    this.setOutputData(1, 0);
    return;
  }

  var key = this.properties.key;
  var op = this.properties.operator;
  var cmp = this.properties.value;

  // Auto-convert numeric comparison values
  var cmpNum = parseFloat(cmp);
  var useNum = !isNaN(cmpNum);

  var result = arr.filter(function (item) {
    var val = key ? item[key] : item;
    switch (op) {
      case "==":  return String(val) === cmp;
      case "!=":  return String(val) !== cmp;
      case ">":   return useNum ? Number(val) > cmpNum : val > cmp;
      case "<":   return useNum ? Number(val) < cmpNum : val < cmp;
      case ">=":  return useNum ? Number(val) >= cmpNum : val >= cmp;
      case "<=":  return useNum ? Number(val) <= cmpNum : val <= cmp;
      case "contains":
        return String(val).toLowerCase().indexOf(cmp.toLowerCase()) !== -1;
      default: return true;
    }
  });

  this.setOutputData(0, result);
  this.setOutputData(1, result.length);
};

LiteGraph.registerNodeType("json/filter", JSONFilterNode);


/* ========================================================================
   4. Node Type: JSON Merge
      Merges two JSON objects into one (shallow merge).
   ======================================================================== */

function JSONMergeNode() {
  this.addInput("A", "json");
  this.addInput("B", "json");
  this.addOutput("Merged", "json");
  this.size = [200, 60];
}

JSONMergeNode.title = "JSON Merge";
JSONMergeNode.desc = "Shallow-merge two JSON objects";

JSONMergeNode.prototype.onExecute = function () {
  var a = this.getInputData(0) || {};
  var b = this.getInputData(1) || {};
  this.setOutputData(0, Object.assign({}, a, b));
};

LiteGraph.registerNodeType("json/merge", JSONMergeNode);


/* ========================================================================
   5. Node Type: JSON Template
      Creates a JSON object from named inputs.
   ======================================================================== */

function JSONTemplateNode() {
  this.addInput("key1", "json");
  this.addInput("key2", "json");
  this.addOutput("Object", "json");
  this.addProperty("key1", "id");
  this.addProperty("key2", "name");
  this.addWidget("text", "Key 1", this.properties.key1, function (v) {
    this.properties.key1 = v;
  }.bind(this));
  this.addWidget("text", "Key 2", this.properties.key2, function (v) {
    this.properties.key2 = v;
  }.bind(this));
  this.size = [260, 110];
}

JSONTemplateNode.title = "JSON Template";
JSONTemplateNode.desc = "Build a JSON object from inputs";

JSONTemplateNode.prototype.onExecute = function () {
  var obj = {};
  var v1 = this.getInputData(0);
  var v2 = this.getInputData(1);
  if (v1 !== undefined) obj[this.properties.key1] = v1;
  if (v2 !== undefined) obj[this.properties.key2] = v2;
  this.setOutputData(0, obj);
};

LiteGraph.registerNodeType("json/template", JSONTemplateNode);


/* ========================================================================
   6. Node Type: JSON Watch
      Displays JSON input as formatted text inside the node.
   ======================================================================== */

function JSONWatchNode() {
  this.addInput("JSON", "json");
  this._value = "";
  this.size = [320, 200];
}

JSONWatchNode.title = "JSON Watch";
JSONWatchNode.desc = "Display JSON data";

JSONWatchNode.prototype.onExecute = function () {
  var v = this.getInputData(0);
  if (v !== undefined) {
    try {
      this._value = JSON.stringify(v, null, 2);
    } catch (e) {
      this._value = String(v);
    }
  } else {
    this._value = "(no data)";
  }
};

JSONWatchNode.prototype.onDrawForeground = function (ctx) {
  if (!this._value) return;
  ctx.save();
  ctx.font = "11px monospace";
  ctx.fillStyle = "#ccc";
  var lines = this._value.split("\n");
  var y = 40;
  for (var i = 0; i < Math.min(lines.length, 20); i++) {
    ctx.fillText(lines[i], 10, y);
    y += 14;
  }
  if (lines.length > 20) {
    ctx.fillStyle = "#888";
    ctx.fillText("... (" + lines.length + " lines total)", 10, y);
  }
  ctx.restore();
};

LiteGraph.registerNodeType("json/watch", JSONWatchNode);


/* ========================================================================
   7. Node Type: String Constant
      Outputs a constant string (useful for URLs, keys, etc.).
   ======================================================================== */

function StringConstNode() {
  this.addOutput("String", "string");
  this.addProperty("value", "https://jsonplaceholder.typicode.com/users");
  this.addWidget("text", "Value", this.properties.value, function (v) {
    this.properties.value = v;
  }.bind(this));
  this.size = [320, 60];
}

StringConstNode.title = "String";
StringConstNode.desc = "Output a constant string value";

StringConstNode.prototype.onExecute = function () {
  this.setOutputData(0, this.properties.value);
};

LiteGraph.registerNodeType("basic/string", StringConstNode);


/* ========================================================================
   8. Node Type: JSON Constant
      Outputs a constant JSON value from text.
   ======================================================================== */

function JSONConstNode() {
  this.addOutput("JSON", "json");
  this.addProperty("value", '{"completed": false}');
  this.addWidget("text", "JSON", this.properties.value, function (v) {
    this.properties.value = v;
  }.bind(this));
  this._parsed = null;
  this.size = [300, 60];
}

JSONConstNode.title = "JSON Value";
JSONConstNode.desc = "Output a constant JSON object";

JSONConstNode.prototype.onExecute = function () {
  try {
    this._parsed = JSON.parse(this.properties.value);
  } catch (e) {
    this._parsed = { _parseError: e.message };
  }
  this.setOutputData(0, this._parsed);
};

LiteGraph.registerNodeType("json/constant", JSONConstNode);


/* ========================================================================
   Initialize the graph and canvas
   ======================================================================== */

(function () {
  var el = document.getElementById("node-canvas");
  if (!el) return;

  var graph = new LGraph();
  var canvas = new LGraphCanvas(el, graph);

  // Style the canvas — always black background
  canvas.background_image = null;
  canvas.clear_background = true;
  canvas.clear_background_color = "#000000";
  canvas.render_shadows = false;

  // Resize canvas to fill parent section
  function resize() {
    var section = el.parentElement;
    if (!section) return;
    var rect = section.getBoundingClientRect();
    el.width = rect.width;
    el.height = rect.height;
    canvas.setDirty(true, true);
  }

  resize();
  new ResizeObserver(resize).observe(el.parentElement);

  // --- Seed a demo pipeline ---
  var urlNode = LiteGraph.createNode("basic/string");
  urlNode.pos = [50, 80];
  urlNode.properties.value = "https://jsonplaceholder.typicode.com/todos";
  if (urlNode.widgets) urlNode.widgets[0].value = urlNode.properties.value;
  graph.add(urlNode);

  var fetchNode = LiteGraph.createNode("api/request");
  fetchNode.pos = [420, 60];
  graph.add(fetchNode);

  var filterNode = LiteGraph.createNode("json/filter");
  filterNode.pos = [800, 60];
  filterNode.properties.key = "completed";
  filterNode.properties.operator = "==";
  filterNode.properties.value = "true";
  if (filterNode.widgets) {
    filterNode.widgets[0].value = "completed";
    filterNode.widgets[1].value = "==";
    filterNode.widgets[2].value = "true";
  }
  graph.add(filterNode);

  var watchNode = LiteGraph.createNode("json/watch");
  watchNode.pos = [1150, 60];
  graph.add(watchNode);

  // Wire them up: String → API Request → Filter → Watch
  urlNode.connect(0, fetchNode, 0);
  fetchNode.connect(0, filterNode, 0);
  filterNode.connect(0, watchNode, 0);

  graph.start();

  // --- Toolbar buttons ---
  var btnRun = document.getElementById("btn-run");
  if (btnRun) {
    btnRun.addEventListener("click", function () {
      if (graph.status === LGraph.STATUS_RUNNING) {
        graph.stop();
        btnRun.textContent = "Run";
      } else {
        graph.start();
        btnRun.textContent = "Stop";
      }
    });
    btnRun.textContent = "Stop"; // graph starts running
  }

  var btnClear = document.getElementById("btn-clear");
  if (btnClear) {
    btnClear.addEventListener("click", function () {
      if (confirm("Clear all nodes?")) {
        graph.clear();
      }
    });
  }
})();
