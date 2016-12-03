var cheerio = require('cheerio');
var _ = require('lodash');
var string = require('extract-data-from-text')
var S = require('string');
var db = require('./../recipes')

var defaultCheerioOptions = {
  normalizeWhitespace: false,
  xmlMode: false,
  decodeEntities: true
};

var social = [
  'twitter.com',
  'linkedin.com',
  'pinterest.com',
  'youtube.com',
  'plus.google.com',
  'instagram.com',
  'github.com',
  'behance.net',
  'dribbble.com',
  'goldenline.pl'
]


/**
 * converts url and html to json data
 */
exports.convert = function(url, html, options) {

  var $ = cheerio.load(html, defaultCheerioOptions);

  var data = {
    meta: {
      title: S($('title').eq(0).text()).trim().s,
      description: $("meta[name='description']").attr('content'),
      'og:description': $("meta[property='og:description']").attr('content'),
      'og:image': $("meta[property='og:image']").attr('content')
    },
    social: exports.getSocialUrls(url, $),
    emails: _.uniq(string.emails(html))
  }

  var element = exports.findRecipe(url, options);

  if (element) {
    data.id = exports.generateId(url, element.pattern)
    data.data = element.parse($)
  } else {
    data.id = 'id_not_specified'
  }

  return data
}

/**
 * generate ID by url and pattern
 */
exports.generateId = function(url, pattern) {
  return url.match(pattern).slice(1).join('_')
}

/**
 * find jquery recipe for URL
 */
exports.findRecipe = function(url, options) {
  var recipes = db
  if (options.recipes) {
    if (_.isArray(options.recipes)) {
      recipes = options.recipes
    } else {
      recipes = require(options.recipes)
    }
  }

  var element = _.find(recipes, function(recipe) {
    var pattern = recipe.pattern
    if (url.match(pattern) !== null) {
      return true
    } else {
      return false
    }
  })
  return element
}

/**
 * gets url to fb, youtube, google plus etc
 */
exports.getSocialUrls = function(url, $) {

  var links = $('a').map(function(val) {
    return {
      url: $(this).attr('href'),
      text: $(this).text()
    }
  }).get()

  var data = {}

  for (var i = 0 ; i < social.length ; ++i) {
    var element = _.find(links, function(o) {
      if (o.url) {
        return o.url.indexOf(social[i]) !== -1 && url.indexOf(social[i]) === -1;
      }
    });

    if (element) {
      var social_name = social[i].split('.')[0]
      data[social_name] = element.url
    }
  }
  return data
}