let Base = class {

  /**
   * Constructor for setting up Base instance
   * @param    *  {Object}   configuration  Instance configuration
   *              {String}   ^.name         Name of application
   *              {Integer}  ^.version      Version of application
   * @returns     {Object}                  The class instance
   */
  constructor(configuration) {
    // Version of Base Framework
    this.BASE_VERSION = "0.0.1";

    // Add all configuration options to instance
    if (typeof configuration === "object") {
      Object.keys(configuration).forEach(key => {
        this[key] = configuration[key];
      });
    };
  }

}
