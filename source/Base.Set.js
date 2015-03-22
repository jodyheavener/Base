Base.prototype.sets = {};

Base.Set = class extends Base.Class {

  /**
   * Constructor for setting up Base.Set instance
   * @param    *  {Object}         configuration  Instance configuration
   *           *  {Object}         ^.schema       Schema to adhere dataset to
   *              {String|Number}  ^.id           Set identifier. If left unset will default
   *                                              to stacking order of Base.sets
   * @returns     {Base.Set}                       The class instance
   */
  constructor(configuration) {
    super.constructor(configuration);

    // Indentify and add set to Base.sets
    this.id = this.id || Object.keys(Base.prototype.sets).length + 1;
    Base.prototype.sets[this.id] = this;

    this.data = {};

    // If initialize is set, call it
    if (this.initialize)
      this.initialize();
  };

};

/**
 * Object containing collection of functions to test against named types
 * @note Do not directly alter this object. Use Base.Set.addType method
 * @note In the future I would like be able to incorporate arguments in to
 *       the test strings. Notes and examples below.
 */
Base.Set.prototype.typeTests = {
  "string": function(value) {
    return typeof value == "string" || value instanceof String;
  },
  "number": function(value) {
    // Possible arguments:
    // - number comparators "number > 20"
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
  "array": function(value) {
    // Possible arguments:
    // - length comparators "array > 20"
    // - contains element that equals "arrray contains 'test'"
    return value.constructor === Array;
  },
  "object": function(value) {
    return typeof value === "object";
  },
  "url": function(value) {
    // Possible arguments:
    // - is specific protocol "url is https"
    let pattern = new RegExp("^(https?:\\/\\/)?" +
      "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" +
      "((\\d{1,3}\\.){3}\\d{1,3}))" +
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" +
      "(\\?[;&a-z\\d%_.~+=-]*)?" +
      "(\\#[-a-z\\d_]*)?$","i");
    if(!pattern.test(value)) {
      return false;
    } else {
      return true;
    };
  },
  "timestamp": function(value) {
    // Possible arguments:
    // - is named format "timestamp is unix"
    // - date is when "timestamp when today|yesterday|2015-03-11"
    return (new Date(value)).getTime() > 0;
  }
};

/**
 * Adds a new type test to this.typeTests object
 * @param    *  {Object}    parameters  Function parameters
 *           *  {String}    ^.type      Named type that will run the test
 *           *  {Function}  ^.test      Test to run against the named type
 *                                      Test MUST return Boolean
 */
Base.Set.prototype.addType = function(parameters) {
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
Base.Set.prototype.isType = function(parameters) {
  if (typeof parameters.type === "function")
    return parameters.type(parameters.value);
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
Base.Set.prototype.add = function(parameters) {
  let addDataIfType, data = parameters.data || parameters;

  // Function to test value against type, and if true adds it
  // to the this.data dataset
  // @param {String} name of the data key
  // @param {String} path to be dataRouted
  // @param {String} name of the type to enforce
  // @returns {Boolean} used to halt the test loop or execute the fail member
  addDataIfType = (name, use, type) => {
    let extractedData = Base.prototype._.dataRoute({target: data, route: use});
    if (this.isType({ type: type, value: extractedData })){
      this.data[name] = extractedData;
      return true;
    } else {
      return false;
    }
  }

  // For each item in the schema
  Object.keys(this.schema).forEach(item => {
    let hasMatchedData = false;
    // Get the parameters from the schema item
    let info = this.schema[item];

    // info.use is a dataRoute that can either be a string or array
    // If it's a string, perform the test with info.type
    if (typeof info.use === "string") {
      if (!hasMatchedData)
        hasMatchedData = addDataIfType(item, info.use, info.type);
    // If it's an array, loop through and perform the test with each
    // dataRoute, halting if a match is found
    } else {
      info.use.forEach(useRoute => {
        if (!hasMatchedData)
          hasMatchedData = addDataIfType(item, useRoute, info.type);
      });
    };

    // If no matches are found and info.fail is set, call it
    // info.fail can be a string or function
    if (!hasMatchedData && info.fail) {
      if (typeof info.fail === "function")
        return this.data[item] = info.fail();
      return this.data[item] = info.fail;
    };
  });
};

/**
 * Get a value from the dataset
 * @param    *  {Object|String}  parameters  Function parameters or route name
 *           *  {String}         ^.route     dataRoute formatted string
 * @returns     {Any}                        Returned value from the dataset
 */
Base.Set.prototype.get = function(parameters) {
  let route = parameters.route || parameters;
  return Base.prototype._.dataRoute({target: this.data, route: route});
};
