module.exports = {
	init: {
		files: [{
			src: 'bower_components/**/*',
			expand: true,
			dest: 'serve-development/js/'
		}]
	},
	serve: {
		files: [{
			src: 'html/index.html',
			dest: 'serve-development',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'dist/junto.js',
			dest: 'serve-development/js',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'lib/development/start.js',
			dest: 'serve-development/js',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'css/*',
			expand: true,
			dest: 'serve-development/css/',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'img/**/*',
			expand: true,
			dest: 'serve-development/img',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}]
	},
	deploy: {
		files: [{
			src: 'html/index.html',
			dest: 'serve-production',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'dist/junto.js',
			dest: 'serve-production/js',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'lib/production/start.js',
			dest: 'serve-production/js',
			expand: true,
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'css/*',
			expand: true,
			dest: 'serve-production/css/',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		}, {
			src: 'img/**/*',
			expand: true,
			dest: 'serve-production/img',
			nonull: true,
			flatten: true,
			filter: 'isFile'
		},
		{
			src: 'bower_components/**/*',
			expand: true,
			dest: 'serve-production/js/'
		}]
	}
};
