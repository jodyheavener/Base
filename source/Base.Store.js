Base.Store = class extends Base.Class {

  /**
   * Constructor for setting up Base.Store instance
   * @param    *  {Object}      configuration  Instance configuration
   *              {Base.Set}    ^.*            Instances of Base.Set to attach to the store
   * @returns     {Base.Store}                 The class instance
   */
  constructor(configuration) {
    super.constructor(configuration);

    // Delegate instance events
    this.delegateEvents();

    // Observe data sets
    this.observeSets();

    if (this.initialize)
      this.initialize();
  };

};

/**
 * Performs Object.observe on all datasets in the store
 */
Base.Store.prototype.observeSets = function(){
  let sets = {};

  // Test all members of the instance for instances of Base.Set
  // If a Base.Set instance is found, add it to the sets object
  Object.keys(this).forEach(member => {
    if (this[member] instanceof Base.Set)
      sets[member] = this[member];
  });

  // For each instance of Base.Set within the store instance,
  // Observe its datasets changes using Object.observe
  Object.keys(sets).forEach(set => {
    Object.observe(sets[set]["data"], changeEvents => {
      this.changeObservation.call(this, {
        events: changeEvents,
        set: sets[set]
      })
    });
  });
};

/**
 * Fired when a dataset change is observed, triggering the
 * change type's event and passing the change data and
 * the changed Base.Set instance to the executed method
 */
Base.Store.prototype.changeObservation = function(data){
  data.events.forEach(change => {
    this.trigger({
      name: change.type,
      parameters: {
        change: change,
        set: data.set
      }
    });
  });
};
