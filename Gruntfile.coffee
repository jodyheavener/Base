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
      build:
        dest: "build/base-es6.js"
        src: [
          "source/Dependencies.js"
          "source/Base.js"
          "source/Base.Class.js"
          "source/Base.View.js"
          "source/Base.Set.js"
          "source/Base.Store.js"
        ]
      nodeps:
        dest: "build/base-es6.js"
        src: [
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
    "dist"
    "watch"
  ]

  grunt.registerTask "dist", [
    "clean:build",
    "concat:framework",
    "babel:framework",
    "clean:framework",
    "uglify:framework"
  ]

  grunt.registerTask "build-es6", [
    "clean:build",
    "concat:build",
  ]

  grunt.registerTask "build-es6-nodeps", [
    "clean:build",
    "concat:nodeps",
  ]
