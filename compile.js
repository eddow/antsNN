
  "browserify": {
    "transform": [
        ["babelify", {
          "presets": ["es2015"]
        }],
        ["uglifyify", {
          "mangle": true,
          "compress": {
            "sequences": true,
            "dead_code": true,
            "booleans": true,
            "conditionals": true,
            "if_return": false,
            "drop_console": false,
            "keep_fnames": true
          },
          "output": {
            "comments": false
          }
        }]
    ]
  },