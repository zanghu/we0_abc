"use strict";
const require$$3 = require("electron");
const path = require("path");
const child_process = require("child_process");
const require$$0 = require("events");
const fs = require("fs");
const http = require("http");
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var main$1 = {};
var server = { exports: {} };
var objectsRegistry = {};
Object.defineProperty(objectsRegistry, "__esModule", { value: true });
const getOwnerKey = (webContents, contextId) => {
  return `${webContents.id}-${contextId}`;
};
class ObjectsRegistry {
  constructor() {
    this.nextId = 0;
    this.storage = {};
    this.owners = {};
    this.electronIds = /* @__PURE__ */ new WeakMap();
  }
  // Register a new object and return its assigned ID. If the object is already
  // registered then the already assigned ID would be returned.
  add(webContents, contextId, obj) {
    const id = this.saveToStorage(obj);
    const ownerKey = getOwnerKey(webContents, contextId);
    let owner = this.owners[ownerKey];
    if (!owner) {
      owner = this.owners[ownerKey] = /* @__PURE__ */ new Map();
      this.registerDeleteListener(webContents, contextId);
    }
    if (!owner.has(id)) {
      owner.set(id, 0);
      this.storage[id].count++;
    }
    owner.set(id, owner.get(id) + 1);
    return id;
  }
  // Get an object according to its ID.
  get(id) {
    const pointer = this.storage[id];
    if (pointer != null)
      return pointer.object;
  }
  // Dereference an object according to its ID.
  // Note that an object may be double-freed (cleared when page is reloaded, and
  // then garbage collected in old page).
  remove(webContents, contextId, id) {
    const ownerKey = getOwnerKey(webContents, contextId);
    const owner = this.owners[ownerKey];
    if (owner && owner.has(id)) {
      const newRefCount = owner.get(id) - 1;
      if (newRefCount <= 0) {
        owner.delete(id);
        this.dereference(id);
      } else {
        owner.set(id, newRefCount);
      }
    }
  }
  // Clear all references to objects refrenced by the WebContents.
  clear(webContents, contextId) {
    const ownerKey = getOwnerKey(webContents, contextId);
    const owner = this.owners[ownerKey];
    if (!owner)
      return;
    for (const id of owner.keys())
      this.dereference(id);
    delete this.owners[ownerKey];
  }
  // Saves the object into storage and assigns an ID for it.
  saveToStorage(object) {
    let id = this.electronIds.get(object);
    if (!id) {
      id = ++this.nextId;
      this.storage[id] = {
        count: 0,
        object
      };
      this.electronIds.set(object, id);
    }
    return id;
  }
  // Dereference the object from store.
  dereference(id) {
    const pointer = this.storage[id];
    if (pointer == null) {
      return;
    }
    pointer.count -= 1;
    if (pointer.count === 0) {
      this.electronIds.delete(pointer.object);
      delete this.storage[id];
    }
  }
  // Clear the storage when renderer process is destroyed.
  registerDeleteListener(webContents, contextId) {
    const processHostId = contextId.split("-")[0];
    const listener = (_, deletedProcessHostId) => {
      if (deletedProcessHostId && deletedProcessHostId.toString() === processHostId) {
        webContents.removeListener("render-view-deleted", listener);
        this.clear(webContents, contextId);
      }
    };
    webContents.on("render-view-deleted", listener);
  }
}
objectsRegistry.default = new ObjectsRegistry();
var typeUtils = {};
Object.defineProperty(typeUtils, "__esModule", { value: true });
typeUtils.deserialize = typeUtils.serialize = typeUtils.isSerializableObject = typeUtils.isPromise = void 0;
const electron_1 = require$$3;
function isPromise(val) {
  return val && val.then && val.then instanceof Function && val.constructor && val.constructor.reject && val.constructor.reject instanceof Function && val.constructor.resolve && val.constructor.resolve instanceof Function;
}
typeUtils.isPromise = isPromise;
const serializableTypes = [
  Boolean,
  Number,
  String,
  Date,
  Error,
  RegExp,
  ArrayBuffer
];
function isSerializableObject(value) {
  return value === null || ArrayBuffer.isView(value) || serializableTypes.some((type) => value instanceof type);
}
typeUtils.isSerializableObject = isSerializableObject;
const objectMap = function(source, mapper) {
  const sourceEntries = Object.entries(source);
  const targetEntries = sourceEntries.map(([key, val]) => [key, mapper(val)]);
  return Object.fromEntries(targetEntries);
};
function serializeNativeImage(image) {
  const representations = [];
  const scaleFactors = image.getScaleFactors();
  if (scaleFactors.length === 1) {
    const scaleFactor = scaleFactors[0];
    const size = image.getSize(scaleFactor);
    const buffer = image.toBitmap({ scaleFactor });
    representations.push({ scaleFactor, size, buffer });
  } else {
    for (const scaleFactor of scaleFactors) {
      const size = image.getSize(scaleFactor);
      const dataURL = image.toDataURL({ scaleFactor });
      representations.push({ scaleFactor, size, dataURL });
    }
  }
  return { __ELECTRON_SERIALIZED_NativeImage__: true, representations };
}
function deserializeNativeImage(value) {
  const image = electron_1.nativeImage.createEmpty();
  if (value.representations.length === 1) {
    const { buffer, size, scaleFactor } = value.representations[0];
    const { width, height } = size;
    image.addRepresentation({ buffer, scaleFactor, width, height });
  } else {
    for (const rep of value.representations) {
      const { dataURL, size, scaleFactor } = rep;
      const { width, height } = size;
      image.addRepresentation({ dataURL, scaleFactor, width, height });
    }
  }
  return image;
}
function serialize(value) {
  if (value && value.constructor && value.constructor.name === "NativeImage") {
    return serializeNativeImage(value);
  }
  if (Array.isArray(value)) {
    return value.map(serialize);
  } else if (isSerializableObject(value)) {
    return value;
  } else if (value instanceof Object) {
    return objectMap(value, serialize);
  } else {
    return value;
  }
}
typeUtils.serialize = serialize;
function deserialize(value) {
  if (value && value.__ELECTRON_SERIALIZED_NativeImage__) {
    return deserializeNativeImage(value);
  } else if (Array.isArray(value)) {
    return value.map(deserialize);
  } else if (isSerializableObject(value)) {
    return value;
  } else if (value instanceof Object) {
    return objectMap(value, deserialize);
  } else {
    return value;
  }
}
typeUtils.deserialize = deserialize;
var getElectronBinding$1 = {};
Object.defineProperty(getElectronBinding$1, "__esModule", { value: true });
getElectronBinding$1.getElectronBinding = void 0;
const getElectronBinding = (name) => {
  if (process._linkedBinding) {
    return process._linkedBinding("electron_common_" + name);
  } else if (process.electronBinding) {
    return process.electronBinding(name);
  } else {
    return null;
  }
};
getElectronBinding$1.getElectronBinding = getElectronBinding;
server.exports;
(function(module, exports) {
  var __importDefault = commonjsGlobal && commonjsGlobal.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { "default": mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.initialize = exports.isInitialized = exports.enable = exports.isRemoteModuleEnabled = void 0;
  const events_1 = require$$0;
  const objects_registry_1 = __importDefault(objectsRegistry);
  const type_utils_1 = typeUtils;
  const electron_12 = require$$3;
  const get_electron_binding_1 = getElectronBinding$1;
  const { Promise: Promise2 } = commonjsGlobal;
  const v8Util = get_electron_binding_1.getElectronBinding("v8_util");
  const hasWebPrefsRemoteModuleAPI = (() => {
    var _a, _b;
    const electronVersion = Number((_b = (_a = process.versions.electron) === null || _a === void 0 ? void 0 : _a.split(".")) === null || _b === void 0 ? void 0 : _b[0]);
    return Number.isNaN(electronVersion) || electronVersion < 14;
  })();
  const FUNCTION_PROPERTIES = [
    "length",
    "name",
    "arguments",
    "caller",
    "prototype"
  ];
  const rendererFunctionCache = /* @__PURE__ */ new Map();
  const finalizationRegistry = new FinalizationRegistry((fi) => {
    const mapKey = fi.id[0] + "~" + fi.id[1];
    const ref = rendererFunctionCache.get(mapKey);
    if (ref !== void 0 && ref.deref() === void 0) {
      rendererFunctionCache.delete(mapKey);
      if (!fi.webContents.isDestroyed()) {
        try {
          fi.webContents.sendToFrame(fi.frameId, "REMOTE_RENDERER_RELEASE_CALLBACK", fi.id[0], fi.id[1]);
        } catch (error) {
          console.warn(`sendToFrame() failed: ${error}`);
        }
      }
    }
  });
  function getCachedRendererFunction(id) {
    const mapKey = id[0] + "~" + id[1];
    const ref = rendererFunctionCache.get(mapKey);
    if (ref !== void 0) {
      const deref = ref.deref();
      if (deref !== void 0)
        return deref;
    }
  }
  function setCachedRendererFunction(id, wc, frameId, value) {
    const wr = new WeakRef(value);
    const mapKey = id[0] + "~" + id[1];
    rendererFunctionCache.set(mapKey, wr);
    finalizationRegistry.register(value, {
      id,
      webContents: wc,
      frameId
    });
    return value;
  }
  const locationInfo = /* @__PURE__ */ new WeakMap();
  const getObjectMembers = function(object) {
    let names = Object.getOwnPropertyNames(object);
    if (typeof object === "function") {
      names = names.filter((name) => {
        return !FUNCTION_PROPERTIES.includes(name);
      });
    }
    return names.map((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(object, name);
      let type;
      let writable = false;
      if (descriptor.get === void 0 && typeof object[name] === "function") {
        type = "method";
      } else {
        if (descriptor.set || descriptor.writable)
          writable = true;
        type = "get";
      }
      return { name, enumerable: descriptor.enumerable, writable, type };
    });
  };
  const getObjectPrototype = function(object) {
    const proto = Object.getPrototypeOf(object);
    if (proto === null || proto === Object.prototype)
      return null;
    return {
      members: getObjectMembers(proto),
      proto: getObjectPrototype(proto)
    };
  };
  const valueToMeta = function(sender, contextId, value, optimizeSimpleObject = false) {
    let type;
    switch (typeof value) {
      case "object":
        if (value instanceof Buffer) {
          type = "buffer";
        } else if (value && value.constructor && value.constructor.name === "NativeImage") {
          type = "nativeimage";
        } else if (Array.isArray(value)) {
          type = "array";
        } else if (value instanceof Error) {
          type = "error";
        } else if (type_utils_1.isSerializableObject(value)) {
          type = "value";
        } else if (type_utils_1.isPromise(value)) {
          type = "promise";
        } else if (Object.prototype.hasOwnProperty.call(value, "callee") && value.length != null) {
          type = "array";
        } else if (optimizeSimpleObject && v8Util.getHiddenValue(value, "simple")) {
          type = "value";
        } else {
          type = "object";
        }
        break;
      case "function":
        type = "function";
        break;
      default:
        type = "value";
        break;
    }
    if (type === "array") {
      return {
        type,
        members: value.map((el) => valueToMeta(sender, contextId, el, optimizeSimpleObject))
      };
    } else if (type === "nativeimage") {
      return { type, value: type_utils_1.serialize(value) };
    } else if (type === "object" || type === "function") {
      return {
        type,
        name: value.constructor ? value.constructor.name : "",
        // Reference the original value if it's an object, because when it's
        // passed to renderer we would assume the renderer keeps a reference of
        // it.
        id: objects_registry_1.default.add(sender, contextId, value),
        members: getObjectMembers(value),
        proto: getObjectPrototype(value)
      };
    } else if (type === "buffer") {
      return { type, value };
    } else if (type === "promise") {
      value.then(function() {
      }, function() {
      });
      return {
        type,
        then: valueToMeta(sender, contextId, function(onFulfilled, onRejected) {
          value.then(onFulfilled, onRejected);
        })
      };
    } else if (type === "error") {
      return {
        type,
        value,
        members: Object.keys(value).map((name) => ({
          name,
          value: valueToMeta(sender, contextId, value[name])
        }))
      };
    } else {
      return {
        type: "value",
        value
      };
    }
  };
  const throwRPCError = function(message) {
    const error = new Error(message);
    error.code = "EBADRPC";
    error.errno = -72;
    throw error;
  };
  const removeRemoteListenersAndLogWarning = (sender, callIntoRenderer) => {
    const location = locationInfo.get(callIntoRenderer);
    let message = `Attempting to call a function in a renderer window that has been closed or released.
Function provided here: ${location}`;
    if (sender instanceof events_1.EventEmitter) {
      const remoteEvents = sender.eventNames().filter((eventName) => {
        return sender.listeners(eventName).includes(callIntoRenderer);
      });
      if (remoteEvents.length > 0) {
        message += `
Remote event names: ${remoteEvents.join(", ")}`;
        remoteEvents.forEach((eventName) => {
          sender.removeListener(eventName, callIntoRenderer);
        });
      }
    }
    console.warn(message);
  };
  const fakeConstructor = (constructor, name) => new Proxy(Object, {
    get(target, prop, receiver) {
      if (prop === "name") {
        return name;
      } else {
        return Reflect.get(target, prop, receiver);
      }
    }
  });
  const unwrapArgs = function(sender, frameId, contextId, args) {
    const metaToValue = function(meta) {
      switch (meta.type) {
        case "nativeimage":
          return type_utils_1.deserialize(meta.value);
        case "value":
          return meta.value;
        case "remote-object":
          return objects_registry_1.default.get(meta.id);
        case "array":
          return unwrapArgs(sender, frameId, contextId, meta.value);
        case "buffer":
          return Buffer.from(meta.value.buffer, meta.value.byteOffset, meta.value.byteLength);
        case "promise":
          return Promise2.resolve({
            then: metaToValue(meta.then)
          });
        case "object": {
          const ret = meta.name !== "Object" ? /* @__PURE__ */ Object.create({
            constructor: fakeConstructor(Object, meta.name)
          }) : {};
          for (const { name, value } of meta.members) {
            ret[name] = metaToValue(value);
          }
          return ret;
        }
        case "function-with-return-value": {
          const returnValue = metaToValue(meta.value);
          return function() {
            return returnValue;
          };
        }
        case "function": {
          const objectId = [contextId, meta.id];
          const cachedFunction = getCachedRendererFunction(objectId);
          if (cachedFunction !== void 0) {
            return cachedFunction;
          }
          const callIntoRenderer = function(...args2) {
            let succeed = false;
            if (!sender.isDestroyed()) {
              try {
                succeed = sender.sendToFrame(frameId, "REMOTE_RENDERER_CALLBACK", contextId, meta.id, valueToMeta(sender, contextId, args2)) !== false;
              } catch (error) {
                console.warn(`sendToFrame() failed: ${error}`);
              }
            }
            if (!succeed) {
              removeRemoteListenersAndLogWarning(this, callIntoRenderer);
            }
          };
          locationInfo.set(callIntoRenderer, meta.location);
          Object.defineProperty(callIntoRenderer, "length", { value: meta.length });
          setCachedRendererFunction(objectId, sender, frameId, callIntoRenderer);
          return callIntoRenderer;
        }
        default:
          throw new TypeError(`Unknown type: ${meta.type}`);
      }
    };
    return args.map(metaToValue);
  };
  const isRemoteModuleEnabledImpl = function(contents) {
    const webPreferences = contents.getLastWebPreferences() || {};
    return webPreferences.enableRemoteModule != null ? !!webPreferences.enableRemoteModule : false;
  };
  const isRemoteModuleEnabledCache = /* @__PURE__ */ new WeakMap();
  const isRemoteModuleEnabled = function(contents) {
    if (hasWebPrefsRemoteModuleAPI && !isRemoteModuleEnabledCache.has(contents)) {
      isRemoteModuleEnabledCache.set(contents, isRemoteModuleEnabledImpl(contents));
    }
    return isRemoteModuleEnabledCache.get(contents);
  };
  exports.isRemoteModuleEnabled = isRemoteModuleEnabled;
  function enable(contents) {
    isRemoteModuleEnabledCache.set(contents, true);
  }
  exports.enable = enable;
  const handleRemoteCommand = function(channel, handler) {
    electron_12.ipcMain.on(channel, (event, contextId, ...args) => {
      let returnValue;
      if (!exports.isRemoteModuleEnabled(event.sender)) {
        event.returnValue = {
          type: "exception",
          value: valueToMeta(event.sender, contextId, new Error('@electron/remote is disabled for this WebContents. Call require("@electron/remote/main").enable(webContents) to enable it.'))
        };
        return;
      }
      try {
        returnValue = handler(event, contextId, ...args);
      } catch (error) {
        returnValue = {
          type: "exception",
          value: valueToMeta(event.sender, contextId, error)
        };
      }
      if (returnValue !== void 0) {
        event.returnValue = returnValue;
      }
    });
  };
  const emitCustomEvent = function(contents, eventName, ...args) {
    const event = { sender: contents, returnValue: void 0, defaultPrevented: false };
    electron_12.app.emit(eventName, event, contents, ...args);
    contents.emit(eventName, event, ...args);
    return event;
  };
  const logStack = function(contents, code, stack) {
    if (stack) {
      console.warn(`WebContents (${contents.id}): ${code}`, stack);
    }
  };
  let initialized = false;
  function isInitialized() {
    return initialized;
  }
  exports.isInitialized = isInitialized;
  function initialize() {
    if (initialized)
      throw new Error("@electron/remote has already been initialized");
    initialized = true;
    handleRemoteCommand("REMOTE_BROWSER_WRONG_CONTEXT_ERROR", function(event, contextId, passedContextId, id) {
      const objectId = [passedContextId, id];
      const cachedFunction = getCachedRendererFunction(objectId);
      if (cachedFunction === void 0) {
        return;
      }
      removeRemoteListenersAndLogWarning(event.sender, cachedFunction);
    });
    handleRemoteCommand("REMOTE_BROWSER_REQUIRE", function(event, contextId, moduleName, stack) {
      logStack(event.sender, `remote.require('${moduleName}')`, stack);
      const customEvent = emitCustomEvent(event.sender, "remote-require", moduleName);
      if (customEvent.returnValue === void 0) {
        if (customEvent.defaultPrevented) {
          throw new Error(`Blocked remote.require('${moduleName}')`);
        } else {
          if (process.mainModule) {
            customEvent.returnValue = process.mainModule.require(moduleName);
          } else {
            let mainModule = module;
            while (mainModule.parent) {
              mainModule = mainModule.parent;
            }
            customEvent.returnValue = mainModule.require(moduleName);
          }
        }
      }
      return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_BUILTIN", function(event, contextId, moduleName, stack) {
      logStack(event.sender, `remote.getBuiltin('${moduleName}')`, stack);
      const customEvent = emitCustomEvent(event.sender, "remote-get-builtin", moduleName);
      if (customEvent.returnValue === void 0) {
        if (customEvent.defaultPrevented) {
          throw new Error(`Blocked remote.getBuiltin('${moduleName}')`);
        } else {
          customEvent.returnValue = require$$3[moduleName];
        }
      }
      return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_GLOBAL", function(event, contextId, globalName, stack) {
      logStack(event.sender, `remote.getGlobal('${globalName}')`, stack);
      const customEvent = emitCustomEvent(event.sender, "remote-get-global", globalName);
      if (customEvent.returnValue === void 0) {
        if (customEvent.defaultPrevented) {
          throw new Error(`Blocked remote.getGlobal('${globalName}')`);
        } else {
          customEvent.returnValue = commonjsGlobal[globalName];
        }
      }
      return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_CURRENT_WINDOW", function(event, contextId, stack) {
      logStack(event.sender, "remote.getCurrentWindow()", stack);
      const customEvent = emitCustomEvent(event.sender, "remote-get-current-window");
      if (customEvent.returnValue === void 0) {
        if (customEvent.defaultPrevented) {
          throw new Error("Blocked remote.getCurrentWindow()");
        } else {
          customEvent.returnValue = event.sender.getOwnerBrowserWindow();
        }
      }
      return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_GET_CURRENT_WEB_CONTENTS", function(event, contextId, stack) {
      logStack(event.sender, "remote.getCurrentWebContents()", stack);
      const customEvent = emitCustomEvent(event.sender, "remote-get-current-web-contents");
      if (customEvent.returnValue === void 0) {
        if (customEvent.defaultPrevented) {
          throw new Error("Blocked remote.getCurrentWebContents()");
        } else {
          customEvent.returnValue = event.sender;
        }
      }
      return valueToMeta(event.sender, contextId, customEvent.returnValue);
    });
    handleRemoteCommand("REMOTE_BROWSER_CONSTRUCTOR", function(event, contextId, id, args) {
      args = unwrapArgs(event.sender, event.frameId, contextId, args);
      const constructor = objects_registry_1.default.get(id);
      if (constructor == null) {
        throwRPCError(`Cannot call constructor on missing remote object ${id}`);
      }
      return valueToMeta(event.sender, contextId, new constructor(...args));
    });
    handleRemoteCommand("REMOTE_BROWSER_FUNCTION_CALL", function(event, contextId, id, args) {
      args = unwrapArgs(event.sender, event.frameId, contextId, args);
      const func = objects_registry_1.default.get(id);
      if (func == null) {
        throwRPCError(`Cannot call function on missing remote object ${id}`);
      }
      try {
        return valueToMeta(event.sender, contextId, func(...args), true);
      } catch (error) {
        const err = new Error(`Could not call remote function '${func.name || "anonymous"}'. Check that the function signature is correct. Underlying error: ${error}
` + (error instanceof Error ? `Underlying stack: ${error.stack}
` : ""));
        err.cause = error;
        throw err;
      }
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_CONSTRUCTOR", function(event, contextId, id, method, args) {
      args = unwrapArgs(event.sender, event.frameId, contextId, args);
      const object = objects_registry_1.default.get(id);
      if (object == null) {
        throwRPCError(`Cannot call constructor '${method}' on missing remote object ${id}`);
      }
      return valueToMeta(event.sender, contextId, new object[method](...args));
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_CALL", function(event, contextId, id, method, args) {
      args = unwrapArgs(event.sender, event.frameId, contextId, args);
      const object = objects_registry_1.default.get(id);
      if (object == null) {
        throwRPCError(`Cannot call method '${method}' on missing remote object ${id}`);
      }
      try {
        return valueToMeta(event.sender, contextId, object[method](...args), true);
      } catch (error) {
        const err = new Error(`Could not call remote method '${method}'. Check that the method signature is correct. Underlying error: ${error}` + (error instanceof Error ? `Underlying stack: ${error.stack}
` : ""));
        err.cause = error;
        throw err;
      }
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_SET", function(event, contextId, id, name, args) {
      args = unwrapArgs(event.sender, event.frameId, contextId, args);
      const obj = objects_registry_1.default.get(id);
      if (obj == null) {
        throwRPCError(`Cannot set property '${name}' on missing remote object ${id}`);
      }
      obj[name] = args[0];
      return null;
    });
    handleRemoteCommand("REMOTE_BROWSER_MEMBER_GET", function(event, contextId, id, name) {
      const obj = objects_registry_1.default.get(id);
      if (obj == null) {
        throwRPCError(`Cannot get property '${name}' on missing remote object ${id}`);
      }
      return valueToMeta(event.sender, contextId, obj[name]);
    });
    handleRemoteCommand("REMOTE_BROWSER_DEREFERENCE", function(event, contextId, id) {
      objects_registry_1.default.remove(event.sender, contextId, id);
    });
    handleRemoteCommand("REMOTE_BROWSER_CONTEXT_RELEASE", (event, contextId) => {
      objects_registry_1.default.clear(event.sender, contextId);
      return null;
    });
  }
  exports.initialize = initialize;
})(server, server.exports);
var serverExports = server.exports;
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.enable = exports.isInitialized = exports.initialize = void 0;
  var server_1 = serverExports;
  Object.defineProperty(exports, "initialize", { enumerable: true, get: function() {
    return server_1.initialize;
  } });
  Object.defineProperty(exports, "isInitialized", { enumerable: true, get: function() {
    return server_1.isInitialized;
  } });
  Object.defineProperty(exports, "enable", { enumerable: true, get: function() {
    return server_1.enable;
  } });
})(main$1);
var main = main$1;
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head></head>
    <meta charset="UTF-8">
    <title>登录成功</title>
    <script src="https://unpkg.com/react@17/umd/react.development.js"><\/script>
    <script src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"><\/script>
    <script src="https://unpkg.com/babel-standalone@6.26.0/babel.min.js"><\/script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #000000;
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
        }

        .success-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: linear-gradient(180deg, #000000 0%, #111111 100%);
            padding: 24px;
        }

        .success-icon-container {
            width: 48px;
            height: 48px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 24px;
            animation: fadeIn 0.6s ease-out, scaleIn 0.6s ease-out;
        }

        .success-icon {
            color: #10B981;
            font-size: 24px;
        }

        .success-message {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 12px;
            opacity: 0;
            animation: fadeIn 0.6s ease-out 0.2s forwards;
        }

        .success-description {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            text-align: center;
            opacity: 0;
            animation: fadeIn 0.6s ease-out 0.4s forwards;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes scaleIn {
            from {
                transform: scale(0.8);
            }
            to {
                transform: scale(1);
            }
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        function LoginSuccess() {
            return (
                <div className="success-container">
                    <div className="success-icon-container">
                        <div className="success-icon">✓</div>
                    </div>
                    <h1 className="success-message">登录成功</h1>
                    <p className="success-description">请返回应用程序继续操作</p>
                </div>
            );
        }

        ReactDOM.render(<LoginSuccess />, document.getElementById('root'));
    <\/script>
</body>
</html>
`;
function startLoginServer(mainWindow2) {
  const server2 = http.createServer((req, res) => {
    var _a;
    if ((_a = req.url) == null ? void 0 : _a.startsWith("/auth/callback")) {
      const url = new URL(req.url, `http://127.0.0.1:12900`);
      const token = url.searchParams.get("token");
      if (token && mainWindow2) {
        console.log("准备发送 token 到渲染进程:", token);
        mainWindow2.webContents.send("login:callback", token);
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(htmlTemplate);
    } else {
      res.writeHead(404);
      res.end("Not Found");
    }
  });
  server2.listen(12900, () => {
    console.log("登录服务器启动在端口 12900");
  });
  return server2;
}
const isHiddenNodeModules = ["node_modules", "dist", ".swc", ".next", "package-lock.json", "pnpm-lock.yaml"];
console.log({
  appPath: require$$3.app.getAppPath(),
  exe: require$$3.app.getPath("exe"),
  home: require$$3.app.getPath("home"),
  // 用户主目录
  appData: require$$3.app.getPath("appData"),
  // 应用数据目录
  userData: require$$3.app.getPath("userData"),
  // 应用用户数据目录
  temp: require$$3.app.getPath("temp"),
  // 临时文件目录
  downloads: require$$3.app.getPath("downloads"),
  // 下载目录
  desktop: require$$3.app.getPath("desktop"),
  // 桌面目录
  documents: require$$3.app.getPath("documents")
  // 文档目录
});
const logPath = path.join(require$$3.app.getAppPath(), "../../logs");
const logFile = path.join(
  logPath,
  `app-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.log`
);
try {
  if (!fs.existsSync(logPath)) {
    fs.mkdirSync(logPath, { recursive: true });
  }
} catch (error) {
  console.error("Failed to create log directory:", error);
}
function logToFile(message) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `${timestamp} - ${message}
`;
  try {
    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage);
  } catch (error) {
    console.error("Failed to write log:", error);
  }
}
logToFile("sadasd");
logToFile(JSON.stringify(process.env, null, 2));
logToFile("Application starting...");
logToFile(`Log file location: ${logFile}`);
logToFile(`Process arguments: ${process.argv.join(" ")}`);
logToFile(`Electron version: ${process.versions.electron}`);
logToFile(`Chrome version: ${process.versions.chrome}`);
logToFile(`Node version: ${process.versions.node}`);
logToFile(require$$3.app.getAppPath());
logToFile(__dirname);
logToFile(require$$3.app.getPath("exe"));
process.on("uncaughtException", (error) => {
  logToFile(`Uncaught Exception: ${error.stack || error.message}`);
});
process.on("unhandledRejection", (error) => {
  logToFile(`Unhandled Rejection: ${error}`);
});
require$$3.app.on("will-finish-launching", () => {
  logToFile("App will finish launching");
});
let pty;
try {
  const ptyNodePath = path.join(__dirname, "../../../node_modules/node-pty");
  pty = require(ptyNodePath);
  console.log(
    "Successfully loaded node-pty from:",
    path.join(__dirname, "../../../node_modules/node-pty")
  );
} catch (error) {
  try {
    const ptyNodePath = path.join(__dirname, "./node_modules/node-pty");
    pty = require(ptyNodePath);
    console.log(
      "Successfully loaded node-pty from:",
      path.join(__dirname, "./node_modules/node-pty")
    );
  } catch (secondError) {
    try {
      const ptyNodePath = path.join(
        require$$3.app.getAppPath(),
        "../../app.asar.unpacked/node_modules/node-pty"
      );
      pty = require(ptyNodePath);
      console.log(
        "Successfully loaded node-pty from:",
        path.join(
          require$$3.app.getAppPath(),
          "../../app.asar.unpacked/node_modules/node-pty"
        )
      );
    } catch (error2) {
      try {
        pty = require("node-pty");
        console.log("Successfully loaded node-pty from:", "node-pty");
      } catch (secondError2) {
        console.error("Failed to load node-pty directly:", secondError2);
        pty = {
          spawn: () => {
            throw new Error("node-pty not available");
          }
        };
      }
    }
  }
}
let nowPath = "";
const activeProcesses = /* @__PURE__ */ new Map();
const ptyProcesses = /* @__PURE__ */ new Map();
main.initialize();
let mainWindow = null;
function createWindow() {
  logToFile("Starting to create window");
  try {
    mainWindow = new require$$3.BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        preload: process.env.VITE_DEV_SERVER_URL ? path.join(__dirname, "preload.js") : path.join(require$$3.app.getAppPath(), "dist-electron", "preload.js")
        // 生产环境
      }
    });
    const loginServer = startLoginServer(mainWindow);
    require$$3.ipcMain.on("open:external:url", (_, url) => {
      const { shell } = require("electron");
      shell.openExternal(url);
    });
    mainWindow.on("closed", () => {
      mainWindow = null;
      if (loginServer) {
        loginServer.close();
      }
    });
    require$$3.nativeTheme.themeSource = "dark";
    mainWindow.webContents.on(
      "did-fail-load",
      (event, errorCode, errorDescription) => {
        logToFile(`Window failed to load: ${errorDescription} (${errorCode})`);
      }
    );
    mainWindow.on("unresponsive", () => {
      logToFile("Window became unresponsive");
    });
    mainWindow.on("responsive", () => {
      logToFile("Window became responsive");
    });
    if (process.env.VITE_DEV_SERVER_URL) {
      logToFile(`Loading dev server URL: ${process.env.VITE_DEV_SERVER_URL}`);
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
      mainWindow.webContents.openDevTools();
    } else {
      const htmlPath = path.join(__dirname, "../dist/index.html");
      logToFile(`Loading production HTML file: ${htmlPath}`);
      mainWindow.loadFile(htmlPath);
    }
    main.enable(mainWindow.webContents);
    require$$3.ipcMain.handle(
      "node-container:check-file-exists",
      async (_event, path2) => {
        try {
          const fs2 = require("fs/promises");
          await fs2.access(path2);
          return true;
        } catch {
          throw new Error("文件不存在");
        }
      }
    );
    require$$3.ipcMain.handle("node-container:init", async () => {
      return true;
    });
    require$$3.ipcMain.handle("node-container:mkdir", async (_, dirPath, options) => {
      const fs2 = require("fs/promises");
      await fs2.mkdir(dirPath, options);
      return true;
    });
    require$$3.ipcMain.handle(
      "node-container:writeFile",
      async (_, filePath, contents) => {
        const fs2 = require("fs/promises");
        await fs2.writeFile(filePath, contents);
        return true;
      }
    );
    require$$3.ipcMain.handle("node-container:readFile", async (_, filePath, encoding) => {
      const fs2 = require("fs/promises");
      return await fs2.readFile(filePath, { encoding });
    });
    require$$3.ipcMain.handle("node-container:readdir", async (_, dirPath, options) => {
      const fs2 = require("fs/promises");
      return await fs2.readdir(dirPath, options);
    });
    require$$3.ipcMain.handle("node-container:platform", async () => {
      const os = require("os");
      return os.platform();
    });
    require$$3.ipcMain.handle("node-container:set-now-path", (_, path2) => {
      nowPath = path2;
    });
    require$$3.ipcMain.handle("node-container:get-project-root", () => {
      if (nowPath) {
        return nowPath;
      }
      if (process.env.VITE_DEV_SERVER_URL) {
        return path.join(process.cwd(), "workspace");
      }
      return path.join(require$$3.app.getAppPath(), "../../workspace");
    });
    require$$3.ipcMain.handle(
      "node-container:spawn",
      async (event, command, args, options) => {
        try {
          console.log(
            "Main Process: Spawning command:",
            command,
            args,
            options
          );
          const proc = child_process.spawn(command, args, {
            cwd: process.env.VITE_DEV_SERVER_URL ? path.join(process.cwd(), "workspace") : path.join(require$$3.app.getAppPath(), "../../workspace"),
            env: {
              ...process.env,
              PATH: `${process.env.PATH}${path.delimiter}${path.join(require$$3.app.getAppPath(), "node_modules", ".bin")}`,
              NODE_PATH: path.join(require$$3.app.getAppPath(), "node_modules")
            },
            shell: true,
            stdio: ["pipe", "pipe", "pipe"]
          });
          const processId = Math.random().toString(36).substr(2, 9);
          console.log("Main Process: Process ID:", processId);
          activeProcesses.set(processId, proc);
          const webContents = event.sender;
          proc.stdout.on("data", (data) => {
            const output = data.toString();
            console.log("Main Process: stdout:", output);
            webContents.send(`process-output-${processId}`, output);
          });
          proc.stderr.on("data", (data) => {
            const output = data.toString();
            console.error("Main Process: stderr:", output);
            webContents.send(`process-output-${processId}`, output);
          });
          proc.on("error", (error) => {
            console.error("Main Process: Process error:", error);
            webContents.send(
              `process-output-${processId}`,
              `Error: ${error.message}
`
            );
          });
          proc.on("close", (code) => {
            activeProcesses.delete(processId);
            webContents.send(`process-exit-${processId}`, code || 0);
          });
          return { processId };
        } catch (error) {
          console.error("Main Process: Spawn error:", error);
          throw error;
        }
      }
    );
    require$$3.ipcMain.handle(
      "node-container:wait-exit",
      async (event, processId) => {
        const proc = activeProcesses.get(processId);
        if (!proc) {
          throw new Error("Process not found");
        }
        return new Promise((resolve) => {
          proc.on("close", (code) => {
            activeProcesses.delete(processId);
            resolve(code);
          });
        });
      }
    );
    require$$3.ipcMain.handle(
      "node-container:kill-process",
      async (event, processId) => {
        const proc = activeProcesses.get(processId);
        if (proc) {
          proc.kill();
          activeProcesses.delete(processId);
        }
      }
    );
    require$$3.ipcMain.handle("node-container:stop-server", async (_, port) => {
      if (process.platform === "win32") {
        child_process.spawn("taskkill", ["/F", "/PID", port.toString()]);
      } else {
        child_process.spawn("kill", ["-9", port.toString()]);
      }
    });
    require$$3.ipcMain.handle("node-container:stat", async (_, filePath) => {
      const fs2 = require("fs/promises");
      const stats = await fs2.stat(filePath);
      return {
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        size: stats.size,
        mtime: stats.mtime
      };
    });
    require$$3.ipcMain.handle("node-container:sync-filesystem", async (event, files) => {
      try {
        const projectRoot = nowPath ? nowPath : process.env.VITE_DEV_SERVER_URL ? path.join(process.cwd(), "workspace") : path.join(require$$3.app.getAppPath(), "../../workspace");
        const fs2 = require("fs/promises");
        await fs2.mkdir(projectRoot, { recursive: true });
        async function getAllFiles(dir) {
          const entries = await fs2.readdir(dir, { withFileTypes: true });
          const files2 = [];
          for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const isHiddenNodeModules2 = [
              "node_modules",
              "dist",
              ".swc",
              ".next",
              ".yaml"
            ];
            if (isHiddenNodeModules2.includes(entry.name)) {
              continue;
            }
            if (entry.isDirectory()) {
              files2.push(...await getAllFiles(fullPath));
            } else {
              files2.push(fullPath);
            }
          }
          return files2;
        }
        const existingFiles = await getAllFiles(projectRoot);
        for (const [filePath, contents] of Object.entries(files)) {
          if (typeof contents !== "string") {
            console.log("Skipping non-string content:", filePath);
            continue;
          }
          if (filePath.startsWith("node_modules/")) {
            console.log("Skipping node_modules file:", filePath);
            continue;
          }
          const fullPath = path.join(projectRoot, filePath);
          const dirPath = path.dirname(fullPath);
          await fs2.mkdir(dirPath, { recursive: true });
          await fs2.writeFile(fullPath, contents, "utf-8");
          const index = existingFiles.indexOf(fullPath);
          if (index > -1) {
            existingFiles.splice(index, 1);
          }
        }
        for (const file of existingFiles) {
          if (!isHiddenNodeModules.some((item) => (file == null ? void 0 : file.indexOf(item)) > -1)) {
            await fs2.unlink(file);
          }
        }
        return true;
      } catch (error) {
        throw error;
      }
    });
    require$$3.ipcMain.handle("terminal:create", (_, options) => {
      console.log("terminal:create", options);
      let shell = process.platform === "win32" ? "powershell.exe" : "bash";
      if (process.platform === "darwin") {
        try {
          const userShell = process.env.SHELL;
          if (userShell && userShell.includes("zsh")) {
            shell = "zsh";
          } else if (fs.existsSync("/bin/zsh")) {
            shell = "zsh";
          }
        } catch (error) {
          console.error("Error detecting shell:", error);
        }
      }
      const processId = Math.random().toString(36).substr(2, 9);
      const env = {
        ...process.env,
        PATH: process.env.PATH || ""
      };
      if (process.platform === "darwin") {
        const additionalPaths = [
          "/usr/local/bin",
          // Homebrew 安装的包
          "/opt/homebrew/bin",
          // Apple Silicon 上的 Homebrew
          "/usr/bin",
          // 系统二进制文件
          "/bin",
          // 基本二进制文件
          "/usr/sbin",
          // 系统管理二进制文件
          "/sbin",
          // 基本系统管理二进制文件
          `${process.env.HOME}/.npm-global/bin`,
          // npm 全局安装路径
          `${process.env.HOME}/.nvm/versions/node/*/bin`
          // nvm 安装的 node 路径
        ];
        env.PATH = `${additionalPaths.join(":")}:${env.PATH}`;
      }
      const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: options.cols || 80,
        rows: options.rows || 24,
        cwd: nowPath ? nowPath : process.env.VITE_DEV_SERVER_URL ? path.join(process.cwd(), "workspace") : path.join(require$$3.app.getAppPath(), "../../workspace"),
        env
        // 使用更新后的环境变量
      });
      ptyProcesses.set(processId, ptyProcess);
      ptyProcess.onData((data) => {
        mainWindow.webContents.send(`terminal-output-${processId}`, data);
      });
      return { processId };
    });
    require$$3.ipcMain.handle("terminal:write", (_, processId, data) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.write(data);
      }
    });
    require$$3.ipcMain.handle("terminal:resize", (_, processId, cols, rows) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.resize(cols, rows);
      }
    });
    require$$3.ipcMain.handle(
      "node-container:get-parent-paths",
      async (_event, currentPath) => {
        try {
          const parentPath = path.dirname(currentPath);
          const grandParentPath = path.dirname(parentPath);
          const lastGrandParentPath = path.dirname(grandParentPath);
          return {
            parentPath,
            grandParentPath,
            lastGrandParentPath
          };
        } catch (error) {
          throw new Error(`获取上级目录失败: ${error.message}`);
        }
      }
    );
    require$$3.ipcMain.handle(
      "node-container:exec-command",
      async (_event, command) => {
        try {
          const { exec } = require("child_process");
          return new Promise((resolve, reject) => {
            exec(
              command,
              (error, stdout, stderr) => {
                if (error) {
                  reject(error.message);
                  return;
                }
                if (stderr) {
                  reject(stderr);
                  return;
                }
                resolve(stdout);
              }
            );
          });
        } catch (error) {
          throw new Error(`命令执行失败: ${error.message}`);
        }
      }
    );
    require$$3.ipcMain.handle("terminal:dispose", (_, processId) => {
      const ptyProcess = ptyProcesses.get(processId);
      if (ptyProcess) {
        ptyProcess.kill();
        ptyProcesses.delete(processId);
      }
    });
    mainWindow.on("closed", () => {
      for (const ptyProcess of Array.from(ptyProcesses.values())) {
        ptyProcess.kill();
      }
      ptyProcesses.clear();
    });
    logToFile(`App path: ${require$$3.app.getAppPath()}`);
    logToFile(`__dirname: ${__dirname}`);
    logToFile(
      `Preload path: ${process.env.VITE_DEV_SERVER_URL ? path.join(__dirname, "preload.js") : path.join(require$$3.app.getAppPath(), "dist-electron", "preload.js")}`
    );
  } catch (error) {
    logToFile(`Error creating window: ${error}`);
    throw error;
  }
}
require$$3.app.whenReady().then(() => {
  logToFile("App is ready");
  try {
    createWindow();
  } catch (error) {
    logToFile(`Error in whenReady handler: ${error}`);
  }
}).catch((error) => {
  logToFile(`Failed to initialize app: ${error}`);
});
require$$3.app.on("window-all-closed", () => {
  logToFile("All windows closed");
  if (process.platform !== "darwin") {
    require$$3.app.quit();
  }
});
require$$3.app.on("activate", () => {
  logToFile("App activated");
  if (require$$3.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
require$$3.app.on("quit", () => {
  logToFile("App is quitting");
});
