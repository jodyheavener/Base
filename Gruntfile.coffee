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
          "source/Base.Store.js"
          "source/Base.Font.js"
        ]

    babel:
      options:
        compact: false
      framework:
        src: "source/concatinated.js"
        dest: "build/base.js"

    clean:
      build: "build/"
      framework: "source/concatinated.js"

    uglify:
      framework:
        src: "build/base.js"
        dest: "build/base.js"

  require("load-grunt-tasks") grunt

  grunt.registerTask "default", [
    "build"
    "watch"
  ]

  grunt.registerTask "build", [
    "clean:build",
    "concat:framework",
    "babel:framework",
    "clean:framework",
    "uglify:framework"
  ]
