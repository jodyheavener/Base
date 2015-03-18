Base.Font = class extends Base.Class {

  constructor(configuration) {
    super.constructor(configuration);

    this.protocol = document.location.protocol === "https:" ? "https" : "http";
    this.scriptAnchor = document.getElementsByTagName("script")[0];

    if (configuration.type === "google" && typeof configuration.config === "object")
      this.loadGoogleFonts(configuration.config)

    if (configuration.type === "typekit" && typeof configuration.config === "string")
      this.loadTypekit(configuration.config)
  }

  loadGoogleFonts(fonts) {
    let url = this.protocol + "://fonts.googleapis.com/css?family=";
    let tag = $("<script type=\"text/javascript\" async=\"true\" />");
    let families = Object.keys(fonts);

    families.forEach((family, index) => {
      let weights = fonts[family];
      url = url + family.replace(/ /g, "+") + ":";
      weights.forEach((weight, index) => {
        url = url + weight + (index + 1 !== weights.length ? "," : "");
      });
      if (index + 1 !== families.length)
        url = url + "|";
    });

    this.scriptAnchor.parentNode.insertBefore(tag.attr("src", url)[0], this.scriptAnchor);
  }

  loadTypekit(kitId) {
    let url = this.protocol + "://use.typekit.net/" + kitId + ".js";
    let tag = $("<script type=\"text/javascript\" async=\"true\" />");
    let inline = $("<script type=\"text/javascript\" />").html("try{Typekit.load();}catch(e){}");
    this.scriptAnchor.parentNode.insertBefore(tag.attr("src", url)[0], this.scriptAnchor);
    this.scriptAnchor.parentNode.insertBefore(inline[0], this.scriptAnchor);
  }

}

Base.prototype.addFonts = function(configuration) {
  let fontInstances = [];
  Object.keys(configuration).forEach(type => {
    fontInstances.push(new Base.Font({
      type: type,
      config: configuration[type]
    }));
  });
  return fontInstances;
}
