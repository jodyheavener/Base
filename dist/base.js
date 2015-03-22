"use strict";

var _get = function get(object, property, receiver) { var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc && desc.writable) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _inherits = function (subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; };

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

/*!
 * Object.observe polyfill - v0.2.3
 * by Massimo Artizzu (MaxArt2501)
 *
 * https://github.com/MaxArt2501/object-observe
 *
 * Licensed under the MIT License
 * See LICENSE for details
 */

// Some type definitions
/**
 * This represents the data relative to an observed object
 * @typedef  {Object}                     ObjectData
 * @property {Map<Handler, HandlerData>}  handlers
 * @property {String[]}                   properties
 * @property {*[]}                        values
 * @property {Descriptor[]}               descriptors
 * @property {Notifier}                   notifier
 * @property {Boolean}                    frozen
 * @property {Boolean}                    extensible
 * @property {Object}                     proto
 */
/**
 * Function definition of a handler
 * @callback Handler
 * @param {ChangeRecord[]}                changes
*/
/**
 * This represents the data relative to an observed object and one of its
 * handlers
 * @typedef  {Object}                     HandlerData
 * @property {Map<Object, ObservedData>}  observed
 * @property {ChangeRecord[]}             changeRecords
 */
/**
 * @typedef  {Object}                     ObservedData
 * @property {String[]}                   acceptList
 * @property {ObjectData}                 data
*/
/**
 * Type definition for a change. Any other property can be added using
 * the notify() or performChange() methods of the notifier.
 * @typedef  {Object}                     ChangeRecord
 * @property {String}                     type
 * @property {Object}                     object
 * @property {String}                     [name]
 * @property {*}                          [oldValue]
 * @property {Number}                     [index]
 */
/**
 * Type definition for a notifier (what Object.getNotifier returns)
 * @typedef  {Object}                     Notifier
 * @property {Function}                   notify
 * @property {Function}                   performChange
 */
/**
 * Function called with Notifier.performChange. It may optionally return a
 * ChangeRecord that gets automatically notified, but `type` and `object`
 * properties are overridden.
 * @callback Performer
 * @returns {ChangeRecord|undefined}
 */

Object.observe || (function (O, A, root) {
    "use strict";

    /**
     * Relates observed objects and their data
     * @type {Map<Object, ObjectData}
     */
    var observed,

    /**
     * List of handlers and their data
     * @type {Map<Handler, Map<Object, HandlerData>>}
     */
    handlers,
        defaultAcceptList = ["add", "update", "delete", "reconfigure", "setPrototype", "preventExtensions"];

    // Functions for internal usage

    /**
     * Checks if the argument is an Array object. Polyfills Array.isArray.
     * @function isArray
     * @param {?*} object
     * @returns {Boolean}
     */
    var isArray = A.isArray || (function (toString) {
        return function (object) {
            return toString.call(object) === "[object Array]";
        };
    })(O.prototype.toString),

    /**
     * Returns the index of an item in a collection, or -1 if not found.
     * Uses the generic Array.indexOf or Array.prototype.indexOf if available.
     * @function inArray
     * @param {Array} array
     * @param {*} pivot           Item to look for
     * @param {Number} [start=0]  Index to start from
     * @returns {Number}
     */
    inArray = A.prototype.indexOf ? A.indexOf || function (array, pivot, start) {
        return A.prototype.indexOf.call(array, pivot, start);
    } : function (array, pivot, start) {
        for (var i = start || 0; i < array.length; i++) if (array[i] === pivot) return i;
        return -1;
    },

    /**
     * Returns an instance of Map, or a Map-like object is Map is not
     * supported or doesn't support forEach()
     * @function createMap
     * @returns {Map}
     */
    createMap = typeof root.Map === "undefined" || !Map.prototype.forEach ? function () {
        // Lightweight shim of Map. Lacks clear(), entries(), keys() and
        // values() (the last 3 not supported by IE11, so can't use them),
        // it doesn't handle the constructor's argument (like IE11) and of
        // course it doesn't support for...of.
        // Chrome 31-35 and Firefox 13-24 have a basic support of Map, but
        // they lack forEach(), so their native implementation is bad for
        // this polyfill. (Chrome 36+ supports Object.observe.)
        var keys = [],
            values = [];

        return {
            size: 0,
            has: function has(key) {
                return inArray(keys, key) > -1;
            },
            get: function get(key) {
                return values[inArray(keys, key)];
            },
            set: function set(key, value) {
                var i = inArray(keys, key);
                if (i === -1) {
                    keys.push(key);
                    values.push(value);
                    this.size++;
                } else values[i] = value;
            },
            "delete": function (key) {
                var i = inArray(keys, key);
                if (i > -1) {
                    keys.splice(i, 1);
                    values.splice(i, 1);
                    this.size--;
                }
            },
            forEach: function forEach(callback /*, thisObj*/) {
                for (var i = 0; i < keys.length; i++) callback.call(arguments[1], values[i], keys[i], this);
            }
        };
    } : function () {
        return new Map();
    },

    /**
     * Simple shim for Object.getOwnPropertyNames when is not available
     * Misses checks on object, don't use as a replacement of Object.keys/getOwnPropertyNames
     * @function getProps
     * @param {Object} object
     * @returns {String[]}
     */
    getProps = O.getOwnPropertyNames ? (function () {
        var func = O.getOwnPropertyNames;
        try {
            arguments.callee;
        } catch (e) {
            // Strict mode is supported

            // In strict mode, we can't access to "arguments", "caller" and
            // "callee" properties of functions. Object.getOwnPropertyNames
            // returns [ "prototype", "length", "name" ] in Firefox; it returns
            // "caller" and "arguments" too in Chrome and in Internet
            // Explorer, so those values must be filtered.
            var avoid = (func(inArray).join(" ") + " ").replace(/prototype |length |name /g, "").slice(0, -1).split(" ");
            if (avoid.length) func = function (object) {
                var props = O.getOwnPropertyNames(object);
                if (typeof object === "function") for (var i = 0, j; i < avoid.length;) if ((j = inArray(props, avoid[i++])) > -1) props.splice(j, 1);

                return props;
            };
        }
        return func;
    })() : function (object) {
        // Poor-mouth version with for...in (IE8-)
        var props = [],
            prop,
            hop;
        if ("hasOwnProperty" in object) {
            for (prop in object) if (object.hasOwnProperty(prop)) props.push(prop);
        } else {
            hop = O.hasOwnProperty;
            for (prop in object) if (hop.call(object, prop)) props.push(prop);
        }

        // Inserting a common non-enumerable property of arrays
        if (isArray(object)) props.push("length");

        return props;
    },

    /**
     * Return the prototype of the object... if defined.
     * @function getPrototype
     * @param {Object} object
     * @returns {Object}
     */
    getPrototype = O.getPrototypeOf,

    /**
     * Return the descriptor of the object... if defined.
     * IE8 supports a (useless) Object.getOwnPropertyDescriptor for DOM
     * nodes only, so defineProperties is checked instead.
     * @function getDescriptor
     * @param {Object} object
     * @param {String} property
     * @returns {Descriptor}
     */
    getDescriptor = O.defineProperties && O.getOwnPropertyDescriptor,

    /**
     * Sets up the next check and delivering iteration, using
     * requestAnimationFrame or a (close) polyfill.
     * @function nextFrame
     * @param {function} func
     * @returns {number}
     */
    nextFrame = root.requestAnimationFrame || root.webkitRequestAnimationFrame || (function () {
        var initial = +new Date(),
            last = initial;
        return function (func) {
            var now = +new Date();
            return setTimeout(function () {
                func((last = +new Date()) - initial);
            }, 17);
        };
    })(),

    /**
     * Sets up the observation of an object
     * @function doObserve
     * @param {Object} object
     * @param {Handler} handler
     * @param {String[]} [acceptList]
     */
    doObserve = function doObserve(object, handler, acceptList) {

        var data = observed.get(object);

        if (data) setHandler(object, data, handler, acceptList);else {
            data = createObjectData(object);
            setHandler(object, data, handler, acceptList);

            if (observed.size === 1)
                // Let the observation begin!
                nextFrame(runGlobalLoop);
        }
    },

    /**
     * Creates the initial data for an observed object
     * @function createObjectData
     * @param {Object} object
     */
    createObjectData = function createObjectData(object, data) {
        var props = getProps(object),
            values = [],
            descs,
            i = 0,
            data = {
            handlers: createMap(),
            frozen: O.isFrozen ? O.isFrozen(object) : false,
            extensible: O.isExtensible ? O.isExtensible(object) : true,
            proto: getPrototype && getPrototype(object),
            properties: props,
            values: values,
            notifier: retrieveNotifier(object, data)
        };

        if (getDescriptor) {
            descs = data.descriptors = [];
            while (i < props.length) {
                descs[i] = getDescriptor(object, props[i]);
                values[i] = object[props[i++]];
            }
        } else while (i < props.length) values[i] = object[props[i++]];

        observed.set(object, data);

        return data;
    },

    /**
     * Performs basic property value change checks on an observed object
     * @function performPropertyChecks
     * @param {ObjectData} data
     * @param {Object} object
     * @param {String} [except]  Doesn't deliver the changes to the
     *                           handlers that accept this type
     */
    performPropertyChecks = (function () {
        var updateCheck = getDescriptor ? function (object, data, idx, except, descr) {
            var key = data.properties[idx],
                value = object[key],
                ovalue = data.values[idx],
                odesc = data.descriptors[idx];

            if ("value" in descr && (ovalue === value ? ovalue === 0 && 1 / ovalue !== 1 / value : ovalue === ovalue || value === value)) {
                addChangeRecord(object, data, {
                    name: key,
                    type: "update",
                    object: object,
                    oldValue: ovalue
                }, except);
                data.values[idx] = value;
            }
            if (odesc.configurable && (!descr.configurable || descr.writable !== odesc.writable || descr.enumerable !== odesc.enumerable || descr.get !== odesc.get || descr.set !== odesc.set)) {
                addChangeRecord(object, data, {
                    name: key,
                    type: "reconfigure",
                    object: object,
                    oldValue: ovalue
                }, except);
                data.descriptors[idx] = descr;
            }
        } : function (object, data, idx, except) {
            var key = data.properties[idx],
                value = object[key],
                ovalue = data.values[idx];

            if (ovalue === value ? ovalue === 0 && 1 / ovalue !== 1 / value : ovalue === ovalue || value === value) {
                addChangeRecord(object, data, {
                    name: key,
                    type: "update",
                    object: object,
                    oldValue: ovalue
                }, except);
                data.values[idx] = value;
            }
        };

        // Checks if some property has been deleted
        var deletionCheck = getDescriptor ? function (object, props, proplen, data, except) {
            var i = props.length,
                descr;
            while (proplen && i--) {
                if (props[i] !== null) {
                    descr = getDescriptor(object, props[i]);
                    proplen--;

                    // If there's no descriptor, the property has really
                    // been deleted; otherwise, it's been reconfigured so
                    // that's not enumerable anymore
                    if (descr) updateCheck(object, data, i, except, descr);else {
                        addChangeRecord(object, data, {
                            name: props[i],
                            type: "delete",
                            object: object,
                            oldValue: data.values[i]
                        }, except);
                        data.properties.splice(i, 1);
                        data.values.splice(i, 1);
                        data.descriptors.splice(i, 1);
                    }
                }
            }
        } : function (object, props, proplen, data, except) {
            var i = props.length;
            while (proplen && i--) if (props[i] !== null) {
                addChangeRecord(object, data, {
                    name: props[i],
                    type: "delete",
                    object: object,
                    oldValue: data.values[i]
                }, except);
                data.properties.splice(i, 1);
                data.values.splice(i, 1);
                proplen--;
            }
        };

        return function (data, object, except) {
            if (!data.handlers.size || data.frozen) return;

            var props,
                proplen,
                keys,
                values = data.values,
                descs = data.descriptors,
                i = 0,
                idx,
                key,
                value,
                proto,
                descr;

            // If the object isn't extensible, we don't need to check for new
            // or deleted properties
            if (data.extensible) {

                props = data.properties.slice();
                proplen = props.length;
                keys = getProps(object);

                if (descs) {
                    while (i < keys.length) {
                        key = keys[i++];
                        idx = inArray(props, key);
                        descr = getDescriptor(object, key);

                        if (idx === -1) {
                            addChangeRecord(object, data, {
                                name: key,
                                type: "add",
                                object: object
                            }, except);
                            data.properties.push(key);
                            values.push(object[key]);
                            descs.push(descr);
                        } else {
                            props[idx] = null;
                            proplen--;
                            updateCheck(object, data, idx, except, descr);
                        }
                    }
                    deletionCheck(object, props, proplen, data, except);

                    if (!O.isExtensible(object)) {
                        data.extensible = false;
                        addChangeRecord(object, data, {
                            type: "preventExtensions",
                            object: object
                        }, except);

                        data.frozen = O.isFrozen(object);
                    }
                } else {
                    while (i < keys.length) {
                        key = keys[i++];
                        idx = inArray(props, key);
                        value = object[key];

                        if (idx === -1) {
                            addChangeRecord(object, data, {
                                name: key,
                                type: "add",
                                object: object
                            }, except);
                            data.properties.push(key);
                            values.push(value);
                        } else {
                            props[idx] = null;
                            proplen--;
                            updateCheck(object, data, idx, except);
                        }
                    }
                    deletionCheck(object, props, proplen, data, except);
                }
            } else if (!data.frozen) {

                // If the object is not extensible, but not frozen, we just have
                // to check for value changes
                for (; i < props.length; i++) {
                    key = props[i];
                    updateCheck(object, data, i, except, getDescriptor(object, key));
                }

                if (O.isFrozen(object)) data.frozen = true;
            }

            if (getPrototype) {
                proto = getPrototype(object);
                if (proto !== data.proto) {
                    addChangeRecord(object, data, {
                        type: "setPrototype",
                        name: "__proto__",
                        object: object,
                        oldValue: data.proto
                    });
                    data.proto = proto;
                }
            }
        };
    })(),

    /**
     * Sets up the main loop for object observation and change notification
     * It stops if no object is observed.
     * @function runGlobalLoop
     */
    runGlobalLoop = (function (_runGlobalLoop) {
        var _runGlobalLoopWrapper = function runGlobalLoop() {
            return _runGlobalLoop.apply(this, arguments);
        };

        _runGlobalLoopWrapper.toString = function () {
            return _runGlobalLoop.toString();
        };

        return _runGlobalLoopWrapper;
    })(function () {
        if (observed.size) {
            observed.forEach(performPropertyChecks);
            handlers.forEach(deliverHandlerRecords);
            nextFrame(runGlobalLoop);
        }
    }),

    /**
     * Deliver the change records relative to a certain handler, and resets
     * the record list.
     * @param {HandlerData} hdata
     * @param {Handler} handler
     */
    deliverHandlerRecords = function deliverHandlerRecords(hdata, handler) {
        if (hdata.changeRecords.length) {
            handler(hdata.changeRecords);
            hdata.changeRecords = [];
        }
    },

    /**
     * Returns the notifier for an object - whether it's observed or not
     * @function retrieveNotifier
     * @param {Object} object
     * @param {ObjectData} [data]
     * @returns {Notifier}
     */
    retrieveNotifier = function retrieveNotifier(object, data) {
        if (arguments.length < 2) data = observed.get(object);

        /** @type {Notifier} */
        return data && data.notifier || {
            /**
             * @method notify
             * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype._notify
             * @memberof Notifier
             * @param {ChangeRecord} changeRecord
             */
            notify: function notify(changeRecord) {
                changeRecord.type; // Just to check the property is there...

                // If there's no data, the object has been unobserved
                var data = observed.get(object);
                if (data) {
                    var recordCopy = { object: object },
                        prop;
                    for (prop in changeRecord) if (prop !== "object") recordCopy[prop] = changeRecord[prop];
                    addChangeRecord(object, data, recordCopy);
                }
            },

            /**
             * @method performChange
             * @see http://arv.github.io/ecmascript-object-observe/#notifierprototype_.performchange
             * @memberof Notifier
             * @param {String} changeType
             * @param {Performer} func     The task performer
             * @param {*} [thisObj]        Used to set `this` when calling func
             */
            performChange: function performChange(changeType, func /*, thisObj*/) {
                if (typeof changeType !== "string") throw new TypeError("Invalid non-string changeType");

                if (typeof func !== "function") throw new TypeError("Cannot perform non-function");

                // If there's no data, the object has been unobserved
                var data = observed.get(object),
                    prop,
                    changeRecord,
                    result = func.call(arguments[2]);

                data && performPropertyChecks(data, object, changeType);

                // If there's no data, the object has been unobserved
                if (data && result && typeof result === "object") {
                    changeRecord = { object: object, type: changeType };
                    for (prop in result) if (prop !== "object" && prop !== "type") changeRecord[prop] = result[prop];
                    addChangeRecord(object, data, changeRecord);
                }
            }
        };
    },

    /**
     * Register (or redefines) an handler in the collection for a given
     * object and a given type accept list.
     * @function setHandler
     * @param {Object} object
     * @param {ObjectData} data
     * @param {Handler} handler
     * @param {String[]} acceptList
     */
    setHandler = function setHandler(object, data, handler, acceptList) {
        var hdata = handlers.get(handler),
            odata;
        if (!hdata) handlers.set(handler, hdata = {
            observed: createMap(),
            changeRecords: []
        });
        hdata.observed.set(object, {
            acceptList: acceptList.slice(),
            data: data
        });
        data.handlers.set(handler, hdata);
    },

    /**
     * Adds a change record in a given ObjectData
     * @function addChangeRecord
     * @param {Object} object
     * @param {ObjectData} data
     * @param {ChangeRecord} changeRecord
     * @param {String} [except]
     */
    addChangeRecord = function addChangeRecord(object, data, changeRecord, except) {
        data.handlers.forEach(function (hdata) {
            var acceptList = hdata.observed.get(object).acceptList;
            // If except is defined, Notifier.performChange has been
            // called, with except as the type.
            // All the handlers that accepts that type are skipped.
            if ((typeof except !== "string" || inArray(acceptList, except) === -1) && inArray(acceptList, changeRecord.type) > -1) hdata.changeRecords.push(changeRecord);
        });
    };

    observed = createMap();
    handlers = createMap();

    /**
     * @function Object.observe
     * @see http://arv.github.io/ecmascript-object-observe/#Object.observe
     * @param {Object} object
     * @param {Handler} handler
     * @param {String[]} [acceptList]
     * @throws {TypeError}
     * @returns {Object}               The observed object
     */
    O.observe = function observe(object, handler, acceptList) {
        if (!object || typeof object !== "object" && typeof object !== "function") throw new TypeError("Object.observe cannot observe non-object");

        if (typeof handler !== "function") throw new TypeError("Object.observe cannot deliver to non-function");

        if (O.isFrozen && O.isFrozen(handler)) throw new TypeError("Object.observe cannot deliver to a frozen function object");

        if (arguments.length > 2) {
            if (!acceptList || typeof acceptList !== "object") throw new TypeError("Object.observe cannot use non-object accept list");
        } else acceptList = defaultAcceptList;

        doObserve(object, handler, acceptList);

        return object;
    };

    /**
     * @function Object.unobserve
     * @see http://arv.github.io/ecmascript-object-observe/#Object.unobserve
     * @param {Object} object
     * @param {Handler} handler
     * @throws {TypeError}
     * @returns {Object}         The given object
     */
    O.unobserve = function unobserve(object, handler) {
        if (object === null || typeof object !== "object" && typeof object !== "function") throw new TypeError("Object.unobserve cannot unobserve non-object");

        if (typeof handler !== "function") throw new TypeError("Object.unobserve cannot deliver to non-function");

        var hdata = handlers.get(handler),
            odata;

        if (hdata && (odata = hdata.observed.get(object))) {
            hdata.observed.forEach(function (odata, object) {
                performPropertyChecks(odata.data, object);
            });
            nextFrame(function () {
                deliverHandlerRecords(hdata, handler);
            });

            // In Firefox 13-18, size is a function, but createMap should fall
            // back to the shim for those versions
            if (hdata.observed.size === 1 && hdata.observed.has(object)) handlers["delete"](handler);else hdata.observed["delete"](object);

            if (odata.data.handlers.size === 1) observed["delete"](object);else odata.data.handlers["delete"](handler);
        }

        return object;
    };

    /**
     * @function Object.getNotifier
     * @see http://arv.github.io/ecmascript-object-observe/#GetNotifier
     * @param {Object} object
     * @throws {TypeError}
     * @returns {Notifier}
     */
    O.getNotifier = function getNotifier(object) {
        if (object === null || typeof object !== "object" && typeof object !== "function") throw new TypeError("Object.getNotifier cannot getNotifier non-object");

        if (O.isFrozen && O.isFrozen(object)) {
            return null;
        }return retrieveNotifier(object);
    };

    /**
     * @function Object.deliverChangeRecords
     * @see http://arv.github.io/ecmascript-object-observe/#Object.deliverChangeRecords
     * @see http://arv.github.io/ecmascript-object-observe/#DeliverChangeRecords
     * @param {Handler} handler
     * @throws {TypeError}
     */
    O.deliverChangeRecords = function deliverChangeRecords(handler) {
        if (typeof handler !== "function") throw new TypeError("Object.deliverChangeRecords cannot deliver to non-function");

        var hdata = handlers.get(handler);
        if (hdata) {
            hdata.observed.forEach(function (odata, object) {
                performPropertyChecks(odata.data, object);
            });
            deliverHandlerRecords(hdata, handler);
        }
    };
})(Object, Array, undefined);

var Base = (function () {
    var _class =

    /**
     * Constructor for setting up Base instance
     * @param       {Object}   configuration  Instance configuration
     *              {Any}      ^.*            Other members/methods to be bound to the instance
     * @returns     {Base}                    The class instance
     * @note        Technically this class does not need to be instantiated for anything to
     *              work. It is simply here so it can house the ._ helpers. Perhaps in the future
     *              this class could be used for global values, caching, or versioning.
     */
    function Base(configuration) {
        var _this = this;

        _classCallCheck(this, _class);

        // Framework version - need to a find a better way to implement and update this
        this.BASE_VERSION = "0.0.2";

        // Add all configuration members and methods to instance
        if (typeof configuration === "object") {
            Object.keys(configuration).forEach(function (key) {
                _this[key] = configuration[key];
            });
        };
    };

    return _class;
})();

/**
 * ._ will contain helpers used throughout the framework
 * @note This might be better off as direct methods of the Base class
 */
Base.prototype._ = {};

/**
 * Parses a string (with a specific format) to extract a value from an object
 * @param    *  {Object}   parameters  Function paramaters
 *           *  {String}   ^.route     Sring path to parse
 *           *  {Object}   ^.target    Object to extract the path from
 * @returns     {Any}                  The value of the object's path parsed from the route
 * @note        In the future I would like to see this a little more well-rounded,
 *              perhaps with conditional routes, built in type evaluation
 */
Base.prototype._.dataRoute = function (parameters) {
    var tokens = undefined,
        route = "";
    // Start by splitting up all spaced text
    tokens = String(parameters.route).split(" ");
    tokens.forEach(function (token) {
        // Then join it back together, wrapping in brackets and quotation marks
        route = route + "[\"" + token + "\"]";
    });
    // Finally, replace any colon+numbers with cut-off brackets and quotes
    // This regex should probably be /:([0-9]\d*)"/g
    route = route.replace(/:([0-9])"/g, "\"][$1");
    return eval("parameters.target" + route);
};

/**
 * DOM Parser; used for template string parsing in Views
 */
Base.prototype._.domParser = new DOMParser();

/**
 * All browser DOM events; used for determing if event name is DOM event or custom
 * event when delegating events in Base.Class
 * @returns  {Array}  List of browser DOM events
 */
Base.prototype._.domEvents = Object.getOwnPropertyNames(document).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(Object.getPrototypeOf(document)))).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(window))).filter(function (i) {
    return !i.indexOf("on") && (document[i] == null || typeof document[i] == "function");
}).filter(function (elem, pos, self) {
    return self.indexOf(elem) == pos;
});

/**
 * Allows us to execute an HTMLElement's method on one element or a Nodelist
 * @param    *  {Object}        parameters  Function paramaters
 *           *  {String|Array}  ^.elements  Elements to execute the function on
 *           *  {Function}      ^.execute   Function to execute on the elements
 */
Base.prototype._.forElements = function (parameters) {
    if (!parameters.elements.length) parameters.elements = [parameters.elements];

    [].forEach.call(parameters.elements, function (element) {
        parameters.execute(element);
    });
};

Base.Class = (function () {
    var _class2 =

    /**
     * Constructor for setting up Base.Class instance
     * This class is meant to be extended in to all classes
     * @param    *  {Object}      configuration  Instance configuration
     *              {Object}      ^.events       Events to delegate within the instance
     *              {Function}    ^.initialize   Method to call once instance is set up.
     *                                           Must be called from extending instance.
     *              {Any}         ^.*            Other members/methods to be bound to the instance
     * @returns     {Base.Class}                 The class instance
     */
    function (configuration) {
        var _this = this;

        _classCallCheck(this, _class2);

        // Add all configuration members and methods to instance
        Object.keys(configuration).forEach(function (key) {
            _this[key] = configuration[key];
        });
    };

    return _class2;
})();

/**
 * Internal reference to the events bound to the instance
 * @note I don't think this is a great idea, since two events with the same
 *       name will cancel each other out. Fix this!
 */
Base.Class.prototype.instanceEvents = {};

/**
 * Internal reference to the events bound to the instance
 * @returns  {Boolean}  Does instance have a valid HTMLElement?
 */
Base.Class.prototype.hasElement = function () {
    return this.element && this.element instanceof HTMLElement;
};

/**
 * Parses this.events and delegates events across this and any assigned instances
 * @note Although managed here, this method needs to be called by the extending
 *       instance so it can delegate to the most up to date event element (Views)
 */
Base.Class.prototype.delegateEvents = function () {
    var _this = this;

    // Bail if no events
    if (!this.events) return;

    // Iterate through this.events
    Object.keys(this.events).forEach(function (caller) {
        var eventName = undefined,
            element = undefined,
            method = undefined,
            assignee = undefined,
            selector = undefined,
            instance = undefined;

        eventName = caller.substr(0, caller.indexOf(" "));
        element = _this.element;
        method = _this.events[caller];
        assignee = _this.events[caller].substr(0, _this.events[caller].indexOf(" "));

        // Find out if the event contains a selector. If it does, reasign the event element
        // to a child of the instance element
        if (eventName.length) {
            selector = caller.substr(caller.indexOf(" ") + 1);
            element = element.querySelectorAll(caller.substr(caller.indexOf(" ") + 1));
        } else {
            eventName = caller;
        };

        // Find out if the event method should executed from the current instance,
        // or assigned to a different instances (which is a member of the current one)
        instance = _this;
        if (assignee.length) {
            method = _this.events[caller].substr(0, _this.events[caller].indexOf(" "));
            instance = _this[_this.events[caller].substr(_this.events[caller].indexOf(" ") + 1)];
        };

        // If we have a valid instance element and the event name is found within
        // the array of DOM events, bind that that event to the element
        if (_this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
            Base.prototype._.forElements.call(_this, {
                elements: element,
                execute: function (element) {
                    element.addEventListener(eventName, function (event) {
                        instance[method].apply(instance, [event, event.detail]);
                    });
                }
            });
            // If the event is not in the list of DOM elements, the event should be bound to
            // the instance and can be called with this.trigger()
        } else {
            _this.instanceEvents[eventName] = instance[method];
        };
    });
};

/**
 * Parses this.events and undelegates events across this and any assigned instances
 * @see Base.Class.delegateEvents, but take not of comments within this method
 */
Base.Class.prototype.undelegateEvents = function () {
    var _this = this;

    if (!this.events) return;

    Object.keys(this.events).forEach(function (caller) {
        var eventName = undefined,
            element = undefined,
            method = undefined,
            assignee = undefined,
            selector = undefined,
            instance = undefined;

        eventName = caller.substr(0, caller.indexOf(" "));
        element = _this.element;
        method = _this.events[caller];
        assignee = _this.events[caller].substr(0, _this.events[caller].indexOf(" "));

        if (eventName.length) {
            selector = caller.substr(caller.indexOf(" ") + 1);
            element = element.querySelectorAll(caller.substr(caller.indexOf(" ") + 1));
        } else {
            eventName = caller;
        };

        instance = _this;
        if (assignee.length) {
            method = _this.events[caller].substr(0, _this.events[caller].indexOf(" "));
            instance = _this[_this.events[caller].substr(_this.events[caller].indexOf(" ") + 1)];
        };

        if (_this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
            Base.prototype._.forElements.call(_this, {
                elements: element,
                execute: function (element) {
                    // Using removeEventListener instead of addEventListener
                    element.removeEventListener(eventName, function (event) {
                        instance[method].apply(instance, [event, event.detail]);
                    });
                }
            });
        } else {
            // Nullify the event name within this.instanceEvents so it cant be triggered
            _this.instanceEvents[eventName] = null;
        };
    });
};

/**
 * Triggers a named event on the instance or its element
 * @param    *  {Object|String}  parameters  Function parameters or event name
 *              {String}         ^.name      Event to trigger
 *              {Object}         ^.data      Data to pass to the method
 * @note        If no data is being sent to the executed method, parameters can
 *              just be a string equal to the event name
 */
Base.Class.prototype.trigger = function (parameters) {
    if (!this.events) return;

    var eventName = parameters.name || parameters;

    // If we have a valid instance element and the event name is found within
    // the array of DOM events, emit the event as a CustomEvent
    if (this.hasElement && Base.prototype._.domEvents.indexOf("on" + eventName) !== -1) {
        var _event = undefined;

        // Support cross-browser CustomEvents
        if (window.CustomEvent) {
            _event = new CustomEvent(eventName, { detail: parameters.data });
        } else {
            _event = document.createEvent("CustomEvent");
            _event.initCustomEvent(eventName, true, true, parameters.data);
        };

        this.element.dispatchEvent(_event);
        // If the event is not in the list of DOM elements, the method within
        // this.instanceEvents by event name is called
    } else {
        this.instanceEvents[eventName].call(this, parameters.data);
    };
};

Base.prototype.views = {};

Base.View = (function (_Base$Class) {
    var _class3 =

    /**
     * Constructor for setting up Base.View instance
     * @param    *  {Object}           configuration  Instance configuration
     *           *  {HTMLElement}      ^.element      The View's element
     *                                                Only required if ^.template is unset
     *              {String|Function}  ^.template     Template to be parsed and returned in
     *                                                this.render()
     *              {String|Number}    ^.id           Set identifier. If left unset will default
     *                                                to stacking order of Base.views
     * @returns     {Base.View}                       The class instance
     */
    function (configuration) {
        _classCallCheck(this, _class3);

        _get(Object.getPrototypeOf(_class3.prototype), "constructor", this).call(this, configuration);

        // Indentify and add set to Base.views
        this.id = this.id || Object.keys(Base.prototype.views).length + 1;
        Base.prototype.views[this.id] = this;

        // Only running this.setupView() is this.element is present, because
        // if it's not and this.template is set, running this.render() will
        // also run this.setupView()
        if (this.element) this.setupView();
    };

    _inherits(_class3, _Base$Class);

    return _class3;
})(Base.Class);

/**
 * Sets up the view for usage, including setting the ID attributes
 * delegating events, and initializing
 */
Base.View.prototype.setupView = function () {
    // Add identifier to this.element in the DOM
    this.element.setAttribute("data-view", this.id);

    // Run event delegation
    this.delegateEvents();

    if (this.initialize) this.initialize();
};

/**
 * Renders and returns the compiled template
 * @param    *  {Object}           parameters  Function parameters
 *              {String|Function}  ^.template  Template to be parsed and returned.
 *                                             If left unset will default to this.template
 *              {Object}           ^.data      Data to be passed to the template, if a function
 *              {Function}         ^.callback  Function to be executed once render is complete
 * @returns     {HTMLElement}                  The newly created this.element
 */
Base.View.prototype.render = function (parameters) {
    var parsedHTML = undefined,
        template = undefined;

    // If a template string or function is specified, use it
    // checking whether or not execute it and pass data to it
    if (parameters.template) {
        if (typeof parameters.template === "function") {
            template = parameters.template(parameters.data);
        } else {
            template = parameters.template;
        }
        // If not, use the instance's template
    } else {
        if (typeof this.template === "function") {
            template = this.template(parameters.data);
        } else {
            template = this.template;
        }
    }

    // Use a DOM Parser to create actualy HTML elements from the template string
    // Extracting the top-most element and assigning it as the view's new element
    parsedHTML = Base.prototype._.domParser.parseFromString(this.template, "text/xml");
    this.element = parsedHTML.children[0];

    // Set up our view and execute the callback if one is supplied
    this.setupView();
    if (parameters.callback) parameters.callback();

    return this.element;
};

/**
 * Removes the view's instance, optionally removing the element from the DOM
 * @param    *  {Object|Boolean}   parameters       Function parameters or bool to remove the view element
 *              {Boolean}          ^.removeElement  If the view's element should also be removed
 */
Base.View.prototype.destroy = function (parameters) {
    var removeView = undefined,
        removeElement = undefined;

    // Function to remove the view instance, it's association with the element,
    // and any events delegated to it
    removeView = function () {
        if (this.element != null) {
            this.element.removeAttribute("data-view");
        };

        this.undelegateEvents();
        Base.prototype.views[this.id] = null;
    };

    // Function to remove the element from the DOM
    // @param {Function} executed after the element has been removed
    removeElement = function (callback) {
        this.element.parentNode.removeChild(this.element);
        this.element = undefined;

        if (callback != null) callback.call(this);
    };

    // If we're removing the view's element, call removeElement and specify
    // removeView as its callback function
    if (parameters != null && (parameters === true || parameters.removeElement === true)) {
        removeElement.apply(this, [function () {
            removeView.call(this);
        }]);
        // If not, just run removeView
    } else {
        removeView.call(this);
    };
};

Base.prototype.sets = {};

Base.Set = (function (_Base$Class2) {
    var _class4 =

    /**
     * Constructor for setting up Base.Set instance
     * @param    *  {Object}         configuration  Instance configuration
     *           *  {Object}         ^.schema       Schema to adhere dataset to
     *              {String|Number}  ^.id           Set identifier. If left unset will default
     *                                              to stacking order of Base.sets
     * @returns     {Base.Set}                       The class instance
     */
    function (configuration) {
        _classCallCheck(this, _class4);

        _get(Object.getPrototypeOf(_class4.prototype), "constructor", this).call(this, configuration);

        // Indentify and add set to Base.sets
        this.id = this.id || Object.keys(Base.prototype.sets).length + 1;
        Base.prototype.sets[this.id] = this;

        this.data = {};

        // If initialize is set, call it
        if (this.initialize) this.initialize();
    };

    _inherits(_class4, _Base$Class2);

    return _class4;
})(Base.Class);

/**
 * Object containing collection of functions to test against named types
 * @note Do not directly alter this object. Use Base.Set.addType method
 * @note In the future I would like be able to incorporate arguments in to
 *       the test strings. Notes and examples below.
 */
Base.Set.prototype.typeTests = {
    string: function (value) {
        return typeof value == "string" || value instanceof String;
    },
    number: function (value) {
        // Possible arguments:
        // - number comparators "number > 20"
        return !isNaN(parseFloat(value)) && isFinite(value);
    },
    array: function (value) {
        // Possible arguments:
        // - length comparators "array > 20"
        // - contains element that equals "arrray contains 'test'"
        return value.constructor === Array;
    },
    object: function (value) {
        return typeof value === "object";
    },
    url: function (value) {
        // Possible arguments:
        // - is specific protocol "url is https"
        var pattern = new RegExp("^(https?:\\/\\/)?" + "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + "((\\d{1,3}\\.){3}\\d{1,3}))" + "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + "(\\?[;&a-z\\d%_.~+=-]*)?" + "(\\#[-a-z\\d_]*)?$", "i");
        if (!pattern.test(value)) {
            return false;
        } else {
            return true;
        };
    },
    timestamp: function (value) {
        // Possible arguments:
        // - is named format "timestamp is unix"
        // - date is when "timestamp when today|yesterday|2015-03-11"
        return new Date(value).getTime() > 0;
    }
};

/**
 * Adds a new type test to this.typeTests object
 * @param    *  {Object}    parameters  Function parameters
 *           *  {String}    ^.type      Named type that will run the test
 *           *  {Function}  ^.test      Test to run against the named type
 *                                      Test MUST return Boolean
 */
Base.Set.prototype.addType = function (parameters) {
    this.typeTests[parameters.type] = parameters.test;
};

/**
 * Tests a value for type validation
 * @param    *  {Object}           parameters  Function parameters
 *           *  {String|Function}  ^.type      Either a named type within this.typeTests, or
 *                                             a Function to test the value against
 *           *  {Any}              ^.value     Value to use in the type test
 * @returns     {Boolean}                      If the value is of the type
 * @note        The idea here is that typically you would run a value against a named
 *              type, but if the test is a once off, a function can be used
 */
Base.Set.prototype.isType = function (parameters) {
    if (typeof parameters.type === "function") return parameters.type(parameters.value);
    return this.typeTests[parameters.type](parameters.value);
};

/**
 * Attempts to add an object to the this.data dataset, adhering to this.schema
 * @param    *  {Object}           parameters  Function parameters
 *           *  {String|Function}  ^.type      Either a named type within this.typeTests, or
 *                                             a Function to test the value against
 *           *  {Any}              ^.value     Value to use in the type test
 * @returns     {Boolean}                      If the value is of the type
 * @note        The idea here is that typically you would run a value against a named
 *              type, but if the test is a once off, a function can be used
 */
Base.Set.prototype.add = function (parameters) {
    var _this = this;

    var addDataIfType = undefined,
        data = parameters.data || parameters;

    // Function to test value against type, and if true adds it
    // to the this.data dataset
    // @param {String} name of the data key
    // @param {String} path to be dataRouted
    // @param {String} name of the type to enforce
    // @returns {Boolean} used to halt the test loop or execute the fail member
    addDataIfType = function (name, use, type) {
        var extractedData = Base.prototype._.dataRoute({ target: data, route: use });
        if (_this.isType({ type: type, value: extractedData })) {
            _this.data[name] = extractedData;
            return true;
        } else {
            return false;
        }
    };

    // For each item in the schema
    Object.keys(this.schema).forEach(function (item) {
        var hasMatchedData = false;
        // Get the parameters from the schema item
        var info = _this.schema[item];

        // info.use is a dataRoute that can either be a string or array
        // If it's a string, perform the test with info.type
        if (typeof info.use === "string") {
            if (!hasMatchedData) hasMatchedData = addDataIfType(item, info.use, info.type);
            // If it's an array, loop through and perform the test with each
            // dataRoute, halting if a match is found
        } else {
            info.use.forEach(function (useRoute) {
                if (!hasMatchedData) hasMatchedData = addDataIfType(item, useRoute, info.type);
            });
        };

        // If no matches are found and info.fail is set, call it
        // info.fail can be a string or function
        if (!hasMatchedData && info.fail) {
            if (typeof info.fail === "function") return _this.data[item] = info.fail();
            return _this.data[item] = info.fail;
        };
    });
};

/**
 * Get a value from the dataset
 * @param    *  {Object|String}  parameters  Function parameters or route name
 *           *  {String}         ^.route     dataRoute formatted string
 * @returns     {Any}                        Returned value from the dataset
 */
Base.Set.prototype.get = function (parameters) {
    var route = parameters.route || parameters;
    return Base.prototype._.dataRoute({ target: this.data, route: route });
};

Base.Store = (function (_Base$Class3) {
    var _class5 =

    /**
     * Constructor for setting up Base.Store instance
     * @param    *  {Object}      configuration  Instance configuration
     *              {Base.Set}    ^.*            Instances of Base.Set to attach to the store
     * @returns     {Base.Store}                 The class instance
     */
    function (configuration) {
        _classCallCheck(this, _class5);

        _get(Object.getPrototypeOf(_class5.prototype), "constructor", this).call(this, configuration);

        // Delegate instance events
        this.delegateEvents();

        // Observe data sets
        this.observeSets();

        if (this.initialize) this.initialize();
    };

    _inherits(_class5, _Base$Class3);

    return _class5;
})(Base.Class);

/**
 * Performs Object.observe on all datasets in the store
 */
Base.Store.prototype.observeSets = function () {
    var _this = this;

    var sets = {};

    // Test all members of the instance for instances of Base.Set
    // If a Base.Set instance is found, add it to the sets object
    Object.keys(this).forEach(function (member) {
        if (_this[member] instanceof Base.Set) sets[member] = _this[member];
    });

    // For each instance of Base.Set within the store instance,
    // Observe its datasets changes using Object.observe
    Object.keys(sets).forEach(function (set) {
        Object.observe(sets[set].data, function (changeEvents) {
            _this.changeObservation.call(_this, {
                events: changeEvents,
                set: sets[set]
            });
        });
    });
};

/**
 * Fired when a dataset change is observed, triggering the
 * change type's event and passing the change data and
 * the changed Base.Set instance to the executed method
 */
Base.Store.prototype.changeObservation = function (data) {
    var _this = this;

    data.events.forEach(function (change) {
        _this.trigger({
            name: change.type,
            parameters: {
                change: change,
                set: data.set
            }
        });
    });
};