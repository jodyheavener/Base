module.exports = (grunt) ->

  grunt.initConfig
    pkg: grunt.file.readJSON("package.json")

    watch:
      framework:
        files: [
          "source/*.js",
          "!source/concatinated.js"
        ]
        tasks: [
          "concat:framework",
          "babel:framework",
          "clean:framework"
        ]

    concat:
      framework:
        dest: "source/concatinated.js"
        src: [
          "source/Dependencies.js"
          "source/Base.js"
          "source/Base.Class.js"
          "source/Base.View.js"
          "source/Base.Set.js"
          "source/Base.Store.js"
        ]

    babel:
      options:
        compact: false
      framework:
        src: "source/concatinated.js"
        dest: "dist/base.js"

    clean:
      dist: "dist/"
      framework: "source/concatinated.js"

    uglify:
      framework:
        src: "dist/base.js"
        dest: "dist/base.min.js"

  require("load-grunt-tasks") grunt

  grunt.registerTask "default", [
    "dist"
    "watch"
  ]

  grunt.registerTask "dist", [
    "clean:dist",
    "concat:framework",
    "babel:framework",
    "clean:framework",
    "uglify:framework"
  ]
