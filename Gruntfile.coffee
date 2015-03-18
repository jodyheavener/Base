

module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")

    watch:
      framework:
        files: [
          "source/*.js",
          "!source/_combined.js"
        ]
        tasks: [
          "concat:framework",
          "babel:framework",
          "clean:framework"
        ]

    concat:
      framework:
        src: [
          "source/deps.js"
          "source/core.js"
          "source/fonts.js"
          "source/store.js"
          "source/view.js"
        ]
        dest: "source/_combined.js"

    babel:
      options:
        compact: false
      framework:
        src: "source/_combined.js"
        dest: "build/base.js"

    clean:
      framework: "source/_combined.js"

    uglify:
      framework:
        src: "build/base.js"
        dest: "build/base.js"

  require("load-grunt-tasks") grunt

  grunt.registerTask "default", [ "watch" ]
  grunt.registerTask "build", [
    "concat:framework",
    "babel:framework",
    "clean:framework",
    "uglify:framework"
  ]
