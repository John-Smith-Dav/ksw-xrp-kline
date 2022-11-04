
module.exports = {
  apps : [
      {
        name: 'abs-kline',
        script: './app.js',
        interpreter_args: '--max-old-space-size=8192',
		"error_file"      : "./logs/err.log",
		"out_file"        : "./logs/out.log",
    }
  ],
};

